export interface SM2Result {
    next_review: string; // ISO Date YYYY-MM-DD
    interval: number;
    repetitions: number;
    easiness: number;
}

export function calculateNextReview(
    quality: number,
    lastInterval: number,
    lastRepetitions: number,
    lastEasiness: number
): SM2Result {
    let interval = 0;
    let repetitions = lastRepetitions;
    let easiness = lastEasiness;

    // Update Easiness Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Update Repetitions & Interval
    if (quality < 3) {
        repetitions = 0;
        interval = 1;
    } else {
        repetitions += 1;
        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(lastInterval * easiness);
        }
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
        next_review: nextReviewDate.toISOString().split('T')[0],
        interval,
        repetitions,
        easiness,
    };
}
