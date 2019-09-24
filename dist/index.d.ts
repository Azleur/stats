export interface Stats {
    mean: number;
    variance: number;
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
export declare function observe(generator: () => number, sampleSize: number): Stats;
/** Pass any number of statistics attributes to be checked in a Stats object. */
export declare function validate(observed: Stats, expected: Validation): boolean;
