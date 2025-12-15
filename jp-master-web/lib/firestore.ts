import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, where, deleteDoc, runTransaction, Timestamp } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string | null;
    level: number;
    xp: number;
    daily_limit: number;
    last_login: string;
    last_checkin?: string; // ISO Date YYYY-MM-DD
    streak?: number;
    nickname?: string;
    bio?: string;
    photoURL?: string;
    friends?: string[]; // List of UIDs
}

export interface WordProgress {
    word_id: number;
    next_review: string; // ISO Date string (Full Timestamp) - effectively 'dueAt'
    interval: number; // Kept for reference or backward compat
    repetitions: number; // 'reps'
    easiness: number; // Kept for reference (SM-2)

    // Half-Life SRS New Fields
    half_life: number; // in Hours
    last_review?: string; // ISO Date of last review
    lapses: number; // Count of times forgotten (Again)
    last_grade?: number; // 0-5
}

export interface GameResult {
    id?: string;
    wpm: number;
    accuracy: number; // 0-100
    timestamp: Timestamp; // Firestore Timestamp
    mode?: string;
    xpEarned?: number;
}

export interface ChatMessage {
    id?: string;
    text: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string | null;
    timestamp: Timestamp; // Firestore Timestamp
}

export interface FriendRequest {
    id: string;
    fromUid: string;
    fromName: string;
    fromPhoto?: string;
    toUid: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

export async function createUserProfile(uid: string, email: string | null) {
    const newUser: UserProfile = {
        uid,
        email,
        level: 1,
        xp: 0,
        daily_limit: 20,
        last_login: new Date().toISOString().split('T')[0],
    };
    await setDoc(doc(db, "users", uid), newUser);
    return newUser;
}

export async function updateUserXP(uid: string, xpToAdd: number) {
    const userRef = doc(db, "users", uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                // Determine what to do if user doesn't exist? Throw or ignore?
                // For now, throw to avoid silent fail logic updates
                throw new Error("User does not exist!");
            }

            const data = userSnap.data() as UserProfile;
            let { xp, level } = data;

            xp += xpToAdd;

            // Simple Level Up Logic: Level * 1000
            if (xp >= level * 1000) {
                level += 1;
                xp = 0; // Reset XP or carry over? Python logic was reset.
            }

            transaction.update(userRef, { xp, level });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
}

export async function performDailyCheckIn(uid: string): Promise<{ success: boolean; streak: number; message: string }> {
    const userRef = doc(db, "users", uid);
    let userSnap = await getDoc(userRef);

    // Self-healing: Create profile if it doesn't exist
    if (!userSnap.exists()) {
        await createUserProfile(uid, null); // Email not available here, optional
        userSnap = await getDoc(userRef);
    }

    if (!userSnap.exists()) return { success: false, streak: 0, message: "User not found (Create Failed)" };

    const data = userSnap.data() as UserProfile;
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = data.last_checkin;
    let streak = data.streak || 0;

    if (lastCheckin === today) {
        return { success: false, streak, message: "Already checked in today!" };
    }

    // Check if consecutive day
    if (lastCheckin) {
        const lastDate = new Date(lastCheckin);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak += 1;
        } else {
            streak = 1; // Reset streak if missed a day
        }
    } else {
        streak = 1; // First time
    }

    // Update DB
    await updateDoc(userRef, {
        last_checkin: today,
        streak: streak,
        xp: (data.xp || 0) + 50 // Bonus 50 XP for check-in
    });

    return { success: true, streak, message: "Check-in successful! +50 XP" };
}

export async function getSRSProgress(uid: string): Promise<Record<number, WordProgress>> {
    const querySnapshot = await getDocs(collection(db, "users", uid, "progress"));
    const progress: Record<number, WordProgress> = {};
    querySnapshot.forEach((doc) => {
        const data = doc.data() as WordProgress;
        progress[data.word_id] = data;
    });
    return progress;
}

export async function saveWordProgress(uid: string, progress: WordProgress) {
    // Save under a subcollection 'progress', doc ID = word_id
    await setDoc(doc(db, "users", uid, "progress", progress.word_id.toString()), progress);
}

export async function saveGameResult(uid: string, result: Omit<GameResult, 'timestamp'>) {
    await addDoc(collection(db, "users", uid, "game_results"), {
        ...result,
        timestamp: serverTimestamp()
    });
}

export async function getGameResults(uid: string, limitCount = 50): Promise<GameResult[]> {
    const q = query(
        collection(db, "users", uid, "game_results"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const results: GameResult[] = [];
    snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as GameResult);
    });
    return results.reverse(); // Return chronological for graphs
}

export async function getLeaderboard(limitCount = 10): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("xp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
    });
    return users;
}

export async function updateUserDetails(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
}

// Global Chat
export async function cleanupGlobalChat() {
    // Delete messages older than 30 minutes
    const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);
    const q = query(
        collection(db, "global_chat"),
        where("timestamp", "<", THIRTY_MINUTES_AGO)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const batch = import("firebase/firestore").then(async ({ writeBatch }) => {
            const b = writeBatch(db);
            snapshot.forEach((doc) => {
                b.delete(doc.ref);
            });
            await b.commit();
            console.log(`Cleaned up ${snapshot.size} old messages.`);
        });
    }
}

export async function sendGlobalMessage(uid: string, text: string, senderName: string, senderPhoto?: string | null) {
    await addDoc(collection(db, "global_chat"), {
        text,
        senderId: uid,
        senderName,
        senderPhoto: senderPhoto || null,
        timestamp: serverTimestamp()
    });
}

export function subscribeToGlobalChat(callback: (messages: ChatMessage[]) => void) {
    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages.reverse()); // Show newest at bottom
    });
}

// Friend System
export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const results: UserProfile[] = [];

    // Prefix search for Nickname
    // Note: This requires an index if combining with other fields, but simple range is fine.
    // We use the startAt/endAt method: name >= term && name <= term + \uf8ff
    const qNick = query(
        usersRef,
        where("nickname", ">=", searchTerm),
        where("nickname", "<=", searchTerm + '\uf8ff')
    );
    const snapNick = await getDocs(qNick);
    snapNick.forEach(doc => results.push(doc.data() as UserProfile));

    // Also try exact email match (Prefix on email is weird because of domains)
    // Or prefix on email username part? Let's stick to exact email for privacy/simplicity or prefix if needed.
    // Let's add exact email match to results if not already there.
    const qEmail = query(usersRef, where("email", "==", searchTerm));
    const snapEmail = await getDocs(qEmail);
    snapEmail.forEach(doc => {
        const data = doc.data() as UserProfile;
        if (!results.some(r => r.uid === data.uid)) {
            results.push(data);
        }
    });

    return results;
}

export async function checkNicknameAvailability(nickname: string): Promise<boolean> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("nickname", "==", nickname));
    const snapshot = await getDocs(q);
    return snapshot.empty;
}

export async function sendFriendRequest(fromUser: UserProfile, toUid: string) {
    if (fromUser.uid === toUid) throw new Error("Cannot add self");

    // Check if already friends
    // (Skipping check for MVP, UI should handle)

    await addDoc(collection(db, "friend_requests"), {
        fromUid: fromUser.uid,
        fromName: fromUser.nickname || fromUser.email?.split('@')[0],
        fromPhoto: fromUser.photoURL || null,
        toUid: toUid,
        status: 'pending',
        timestamp: serverTimestamp()
    });
}

export function subscribeToFriendRequests(uid: string, callback: (reqs: FriendRequest[]) => void) {
    const q = query(collection(db, "friend_requests"), where("toUid", "==", uid), where("status", "==", "pending"));
    return onSnapshot(q, (snapshot) => {
        const reqs: FriendRequest[] = [];
        snapshot.forEach(doc => reqs.push({ id: doc.id, ...doc.data() } as FriendRequest));
        callback(reqs);
    });
}

export async function acceptFriendRequest(requestId: string, fromUid: string, toUid: string) {
    // 1. Add to both users' friend lists (using arrayUnion would be better but let's just use manual array update for now if friend list is simple)
    // Actually, let's use a subcollection 'friends' for scalability or just assume the 'friends' array exists in profile (from Plan)
    // Plan said: friends[] in UserProfile.

    // Update Recipient (Me)
    const meRef = doc(db, "users", toUid);
    const meSnap = await getDoc(meRef);
    const meData = meSnap.data() as UserProfile;
    const myFriends = meData.friends || [];
    if (!myFriends.includes(fromUid)) await updateDoc(meRef, { friends: [...myFriends, fromUid] });

    // Update Sender (Them)
    const themRef = doc(db, "users", fromUid);
    const themSnap = await getDoc(themRef);
    const themData = themSnap.data() as UserProfile;
    const theirFriends = themData.friends || [];
    if (!theirFriends.includes(toUid)) await updateDoc(themRef, { friends: [...theirFriends, toUid] });

    // 2. Delete Request
    await deleteDoc(doc(db, "friend_requests", requestId));
}

// DM System
export function getChatId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join("_");
}

export function subscribeToDM(chatId: string, callback: (msgs: ChatMessage[]) => void) {
    const q = query(collection(db, "messages", chatId, "chats"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        callback(messages.reverse());
    });
}

export async function sendDM(chatId: string, senderUid: string, text: string, senderName: string) {
    await addDoc(collection(db, "messages", chatId, "chats"), {
        text,
        senderId: senderUid,
        senderName,
        timestamp: serverTimestamp()
    });
}

export async function getFriendsList(uid: string): Promise<UserProfile[]> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const user = userSnap.data() as UserProfile;

    if (!user.friends || user.friends.length === 0) return [];

    // Parallel Fetching using Promise.all
    const friendPromises = user.friends.map(friendId => getUserProfile(friendId));
    const friends = await Promise.all(friendPromises);

    return friends.filter((profile): profile is UserProfile => profile !== null);
}
