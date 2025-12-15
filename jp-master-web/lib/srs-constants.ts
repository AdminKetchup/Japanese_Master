/**
 * SRS Algorithm Configuration Constants
 * 
 * Centralized configuration for all magic numbers in the Half-Life SRS algorithm.
 * Adjust these values to tune the learning curve.
 */

export const SRS_CONFIG = {
    // ===== Target & Limits =====
    /** Target retention probability for scheduling (90% = 0.9) */
    TARGET_PROBABILITY: 0.9,

    /** Maximum half-life cap in hours (10 years) */
    MAX_HALF_LIFE_HOURS: 24 * 365 * 10,

    // ===== Initial Half-Lives (hours) =====
    /** Initial half-life for "Again" rating on new cards */
    INITIAL_HL_AGAIN: 4,

    /** Initial half-life for "Hard" rating on new cards */
    INITIAL_HL_HARD: 12,

    /** Initial half-life for "Good" rating on new cards (3 days) */
    INITIAL_HL_GOOD: 72,

    /** Initial half-life for "Easy" rating on new cards (7 days) */
    INITIAL_HL_EASY: 168,

    // ===== Failure Penalties =====
    /** Minimum half-life floor in hours */
    MIN_HALF_LIFE_HOURS: 2,

    /** Decay factor for failed reviews (reduces to 40% of current) */
    FAIL_DECAY_FACTOR: 0.4,

    // ===== Growth Multipliers =====
    /** Base multiplier for hard reviews (grade 2) */
    MULTIPLIER_HARD: 2.0,

    /** Base multiplier for good reviews (grade 3) */
    MULTIPLIER_GOOD: 2.5,

    /** Base multiplier for easy reviews (grade 4) */
    MULTIPLIER_EASY: 3.5,

    /** Base multiplier for perfect reviews (grade 5) */
    MULTIPLIER_PERFECT: 4.5,

    // ===== Damping =====
    /** Coefficient for diminishing returns on repetitions */
    DAMPING_COEFFICIENT: 0.1,
} as const;

/** Grade thresholds */
export const GRADE = {
    AGAIN: 1,
    HARD: 2,
    GOOD: 3,
    EASY: 4,
    PERFECT: 5,
} as const;
