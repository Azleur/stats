// ---- MIN, MAX, MEAN, VARIANCE ---- //

/** Basic statistical quantities of a sample set (min, max, mean, variance). */
export type Stats = {
    mean: number;
    variance: number;
    min: number;
    max: number;
}

/** Optional expected values to check in Validate(), plus accepted absolute tolerance. */
export type Validation = {
    tolerance?: number;
    mean?: number;
    variance?: number;
    min?: number;
    max?: number;
}

/** Returns a standard Stats object to be used as a null value. */
export function NullStats(): Stats {
    return { min: Number.NaN, max: Number.NaN, mean: Number.NaN, variance: Number.NaN };
}

export type SampleIngestor = (sample: number) => Stats;

/** Progressively calculate min, max, mean, variance of a sample.
 *
 * Returns a function that receives new samples and outputs an updated Stats object with
 * the aggregate information of all provided samples.
 *
 * Uses Welford's algorithm to calculate the mean and variance in a single pass.
 */
export function GetIngestor(): SampleIngestor {
    let mean = 0;
    let squareErrors = 0;
    let min = Number.MAX_VALUE;
    let max = -Number.MAX_VALUE;
    let sampleSize = 0;

    return (sample: number) => {
        sampleSize += 1;
        if (sample < min) min = sample;
        if (sample > max) max = sample;
        const errorPre = sample - mean;
        mean += errorPre / sampleSize;
        const errorPost = sample - mean;
        squareErrors += errorPre * errorPost;

        return {
            mean: mean,
            variance: squareErrors / (sampleSize - 1),
            min: min,
            max: max,
        };
    }
}

/** Calculate min, max, mean, variance of a sequence of numbers given by successive calls to generator().
 *
 * Uses Welford's algorithm to calculate the mean and variance in a single pass.
 */
export function Observe(generator: () => number, sampleSize: number): Stats {
    const ingestor = GetIngestor();
    let stats = NullStats();
    for (let i = 0; i < sampleSize; i++) {
        const sample = generator();
        stats = ingestor(sample);
    }
    return stats;
}

/** Validates the values in 'observed' against the parameters in 'expected'. */
// TODO: TEST OPTIONAL TOLERANCE.
export function Validate(observed: Stats, expected: Validation): boolean {
    const helper = (expected: number | undefined, observed: number, tolerance: number): boolean => {
        return expected == undefined || Math.abs(observed - expected) <= tolerance;
    }
    const tolerance = expected.tolerance || Number.EPSILON;
    return helper(expected.mean, observed.mean, tolerance) &&
        helper(expected.variance, observed.variance, tolerance) &&
        helper(expected.min, observed.min, tolerance) &&
        helper(expected.max, observed.max, tolerance);
}

// ---- COVARIANCE ---- //

/** Basic statistical quantities of a sample set (min, max, mean, variance). */
export type CovarianceStats = {
    x: Stats;
    y: Stats;
    covariance: number;
}

/** Returns a standard CovarianceStats object to be used as a null value. */
export function NullCovarianceStats(): CovarianceStats {
    return { x: NullStats(), y: NullStats(), covariance: Number.NaN, };
}

export type CovarianceIngestor = (x: number, y: number) => CovarianceStats;

/** Progressively calculate individual stats and covariance of two sample sets.
 *
 * Returns a function that receives new sample pairs and outputs an updated CovarianceStats
 * object with the aggregate information of all provided samples.
 *
 * Uses a variant of Welford's algorithm to calculate everything in a single pass.
 */
export function GetCovarianceIngestor(): CovarianceIngestor {
    let meanX = 0;
    let errsX = 0; // Square error sum.
    let minX = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;

    let meanY = 0;
    let errsY = 0; // Square error sum.
    let minY = Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;

    let sampleSize = 0;
    let crossErrors = 0;

    return (x: number, y: number) => {
        sampleSize += 1;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        const errPreX = x - meanX;
        meanX += errPreX / sampleSize;
        const errPostX = x - meanX;
        errsX += errPreX * errPostX;

        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const errPreY = y - meanY;
        meanY += errPreY / sampleSize;
        const errPostY = y - meanY;
        errsY += errPreY * errPostY;

        crossErrors += errPreX * errPostY;

        return {
            x: {
                mean: meanX,
                variance: errsX / (sampleSize - 1),
                min: minX,
                max: maxX,
            },
            y: {
                mean: meanY,
                variance: errsY / (sampleSize - 1),
                min: minY,
                max: maxY,
            },
            covariance: crossErrors / (sampleSize - 1),
        };
    }
}

/** Calculate individual stats and covariance of two sample sets given by successive calls to generator().
 *
 * Uses Welford's algorithm to calculate the means, variances and covariance in a single pass.
 */
export function ObserveCovariance(generator: () => { x: number, y: number }, sampleSize: number): CovarianceStats {
    const ingestor = GetCovarianceIngestor();
    let stats = NullCovarianceStats();
    for (let i = 0; i < sampleSize; i++) {
        const sample = generator();
        stats = ingestor(sample.x, sample.y);
    }
    return stats;
}

/**
 * Optional expected values to check in CovarianceValidate(), plus accepted absolute tolerance.
 *
 * * The individual Validation objects x and y can have their own tolerance, but it's not recommended.
 * * The top-level tolerance takes precedence if present.
 */
export type CovarianceValidation = {
    tolerance?: number;
    x?: Validation;
    y?: Validation;
    covariance?: number;
}

/** Validates the values in 'observed' against the parameters in 'expected'. */
export function CovarianceValidate(observed: CovarianceStats, expected: CovarianceValidation): boolean {
    const isGood = (observed: Stats, expected?: Validation, tolerance?: number): boolean =>
        !expected || Validate(observed, { ...expected, tolerance: tolerance || expected.tolerance });

    const xPass = isGood(observed.x, expected.x, expected.tolerance);
    const yPass = isGood(observed.y, expected.y, expected.tolerance);
    const covPass = (expected.covariance == undefined) ||
            Math.abs(observed.covariance - expected.covariance) <= (expected.tolerance || Number.EPSILON);

    return xPass && yPass && covPass;
}
