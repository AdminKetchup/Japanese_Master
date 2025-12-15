export interface SRSResult {
    next_review: string; // ISO Date
    half_life: number;   // Hours
    repetitions: number;
    lapses: number;
    interval_days: number; // For informational purposes
}

// Configuration
const TARGET_PROBABILITY = 0.9; // 90% retention target
const LN2 = Math.log(2);
const MAX_HALF_LIFE = 24 * 365 * 10; // Cap at 10 years (in hours)

// Helper: Calculate P(recall)
export function calculateRecallProbability(halfLifeHours: number, elapsedHours: number): number {
    if (halfLifeHours <= 0) return 0;
    return Math.pow(2, -elapsedHours / halfLifeHours);
}

// Logic: Calculate next review interval based on Target P
// Formula: interval = - (half_life * log2(TargetP)) ?? 
// Re-deriving from P = 2^(-t/h)
// log2(P) = -t/h
// t = -h * log2(P)
// t = -h * (ln(P) / ln(2))
function calculateInterval(halfLifeHours: number, targetP: number): number {
    return -halfLifeHours * Math.log2(targetP); // Returns hours
}

export function calculateNextReview(
    grade: number, // 0-5
    currentHalfLife: number, // Hours, 0 if new
    repetitions: number,
    lapses: number,
    daysSinceLastReview: number = 0 // Used for 'actual' stability update if we were doing true FSRS, but simple version requested.
): SRSResult {
    // 1. Initial State Handling
    if (currentHalfLife <= 0) {
        currentHalfLife = 12; // Start with 12 hours?? Or depends on grade.
        // If it's a new card being reviewed for the first time:
        // Grade 0-2: Fail immediately? 
        // Let's assume this function is called AFTER the user rates a card.
    }

    let nextHalfLife = currentHalfLife;
    let nextReps = repetitions;
    let nextLapses = lapses;

    // 2. Algorithm Logic
    if (grade < 3) {
        // --- AGAIN / HARD (Fail) ---
        nextReps = 0; // Reset consecutive reps (or keep count but punish HL?) -> Usually "streak" breaks.
        nextLapses += 1;

        // Slash Half-Life
        // Example: Drop to 40% of previous, or minimum 2 hours.
        nextHalfLife = Math.max(2, currentHalfLife * 0.4);
    } else {
        // --- PASS (Good/Easy) ---
        nextReps += 1;

        // Growth Factor
        // We want growth to dampen as reps increase (log/root).
        // basicMulti: Good=2.5x, Easy=4.0x?
        let baseMultiplier = 2.0;
        if (grade === 3) baseMultiplier = 2.5; // Good
        if (grade === 4) baseMultiplier = 3.5; // Easy
        if (grade === 5) baseMultiplier = 4.5; // Perfect

        // Damping: Multiplier decreases as Reps increase? 
        // Actually, in SRS, stability usually grows EXPONENTIALLY if you keep recalling correctly. 
        // But user asked: "reps가 쌓일수록 증가폭이 완만해지게(로그/루트 등)"
        // This likely means the *multiplier* should decrease, or the *added* value?
        // Let's assume they mean stability shouldn't explode too fast.

        // Modifier = Base / (1 + decay * log(reps))
        const damping = 1 + 0.1 * Math.log(Math.max(1, nextReps));
        const effectiveMultiplier = baseMultiplier / damping;

        nextHalfLife = currentHalfLife * effectiveMultiplier;

        // If first successful review of a new item, set initial HL
        if (repetitions === 0) {
            // override calculated logic for first pass
            if (grade === 3) nextHalfLife = 24 * 3; // 3 days
            if (grade >= 4) nextHalfLife = 24 * 7; // 7 days
        }
    }

    // Cap Max
    nextHalfLife = Math.min(nextHalfLife, MAX_HALF_LIFE);

    // 3. Calculate Due Date
    // Hours until P drops to TARGET_PROBABILITY
    const hoursToNextReview = calculateInterval(nextHalfLife, TARGET_PROBABILITY);

    // Ensure we don't schedule "0 hours" if it's super short, minimum 1 hour?
    // Actually if they failed, users usually want "1 min" or "10 min". 
    // For this MVP, let's say minimum 4 hours if passed, or immediate if failed?
    // User Requirement 5: "실패(Again)는 즉시 재출제" -> Implies dueAt = now

    let dueOffsetHours = hoursToNextReview;
    if (grade < 3) {
        dueOffsetHours = 0; // Immediate
    }

    const nextReviewDate = new Date();
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + Math.ceil(dueOffsetHours * 60));

    return {
        next_review: nextReviewDate.toISOString(),
        half_life: nextHalfLife,
        repetitions: nextReps,
        lapses: nextLapses,
        interval_days: parseFloat((dueOffsetHours / 24).toFixed(2))
    };
}
