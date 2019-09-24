export interface Stats {
    mean: number;
    variance: number; // What about Bessel's correction?
    min: number;
    max: number;
}

export interface Validation {
    tolerance: number;
    mean?: number;
    variance?: number;
    min?: number;
    max?: number;
}

/** Calculate min, max, mean, variance of a sequence of numbers given by successive calls to generator().
 *
 * Uses Welford's algorithm to calculate the mean and variance in a single pass.
 */
export function observe(generator: () => number, sampleSize: number): Stats {
    let mean = 0; // Rolling mean.
    let squareErrors = 0; // Sum of square errors with respect to the current mean.
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    for (let i = 0; i < sampleSize; i++) {
        const x = generator();
        if (x < min) min = x;
        if (x > max) max = x;
        const errorPre = x - mean; // Sample error with old mean.
        mean += errorPre / (i + 1); // Update mean.
        const errorPost = x - mean; // Sample error with new mean.
        squareErrors += errorPre * errorPost; // Welford's party trick.
    }
    return {
        mean: mean,
        variance: squareErrors / sampleSize,
        min: min,
        max: max,
    };
}

/** Pass any number of statistics attributes to be checked in a Stats object. */
export function validate(observed: Stats, expected: Validation): boolean {
    const helper = (expected: number | undefined, observed: number, tolerance: number): boolean => {
        return expected == undefined || Math.abs(observed - expected) <= tolerance;
    }
    return helper(expected.mean, observed.mean, expected.tolerance) &&
        helper(expected.variance, observed.variance, expected.tolerance) &&
        helper(expected.min, observed.min, expected.tolerance) &&
        helper(expected.max, observed.max, expected.tolerance);
}
