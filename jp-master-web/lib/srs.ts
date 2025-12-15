import { SRS_CONFIG, GRADE } from './srs-constants';

export interface SRSResult {
    next_review: string; // ISO Date
    half_life: number;   // Hours
    repetitions: number;
    lapses: number;
    interval_days: number; // For informational purposes
}

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
    lapses: number
): SRSResult {
    let nextHalfLife = currentHalfLife;
    let nextReps = repetitions;
    let nextLapses = lapses;

    // Handle first-time reviews (new cards)
    if (currentHalfLife <= 0 && repetitions === 0) {
        // Set initial Half-Life based on user's perceived difficulty
        if (grade === GRADE.AGAIN) {
            nextHalfLife = SRS_CONFIG.INITIAL_HL_AGAIN;
        } else if (grade === GRADE.HARD) {
            nextHalfLife = SRS_CONFIG.INITIAL_HL_HARD;
        } else if (grade === GRADE.GOOD) {
            nextHalfLife = SRS_CONFIG.INITIAL_HL_GOOD;
        } else {
            nextHalfLife = SRS_CONFIG.INITIAL_HL_EASY;
        }

        // Set reps and lapses based on grade
        if (grade < GRADE.GOOD) {
            nextReps = 0;
            nextLapses = 1;
        } else {
            nextReps = 1;
            nextLapses = 0;
        }
    } else {
        // Normal review logic for established cards
        if (grade < GRADE.GOOD) {
            // --- FAIL (Again/Hard) ---
            nextReps = 0;
            nextLapses += 1;
            nextHalfLife = Math.max(
                SRS_CONFIG.MIN_HALF_LIFE_HOURS,
                currentHalfLife * SRS_CONFIG.FAIL_DECAY_FACTOR
            );
        } else {
            // --- PASS (Good/Easy) ---
            nextReps += 1;

            // Growth Factor with Damping
            let baseMultiplier: number = SRS_CONFIG.MULTIPLIER_HARD;
            if (grade === GRADE.GOOD) baseMultiplier = SRS_CONFIG.MULTIPLIER_GOOD;
            if (grade === GRADE.EASY) baseMultiplier = SRS_CONFIG.MULTIPLIER_EASY;
            if (grade === GRADE.PERFECT) baseMultiplier = SRS_CONFIG.MULTIPLIER_PERFECT;

            const damping = 1 + SRS_CONFIG.DAMPING_COEFFICIENT * Math.log(Math.max(1, nextReps));
            const effectiveMultiplier = baseMultiplier / damping;

            nextHalfLife = currentHalfLife * effectiveMultiplier;
        }
    }

    // Cap Max
    nextHalfLife = Math.min(nextHalfLife, SRS_CONFIG.MAX_HALF_LIFE_HOURS);

    // Calculate Due Date
    const hoursToNextReview = calculateInterval(nextHalfLife, SRS_CONFIG.TARGET_PROBABILITY);

    let dueOffsetHours = hoursToNextReview;
    if (grade < GRADE.GOOD) {
        dueOffsetHours = 0; // Immediate review for failures
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
