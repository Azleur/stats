import {
    Stats,
    Validation,
    Observe,
    GetIngestor,
    Validate,
    NullStats,
    ObserveCovariance,
    GetCovarianceIngestor,
    NullCovarianceStats,
    CovarianceValidate
} from './index';

test("Basic Math.random() example", () => {
    const stats = Observe(Math.random, 10000);
    // console.log(stats);
    const validation: Validation = {
        tolerance: 0.1,
        min: 0,
        max: 1,
        mean: 0.5,
        variance: 1 / 12,
    };

    expect(Validate(stats, validation)).toBe(true);
});

test("Observe() Stats of a source of numbers by calling it a fixed number of times", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const half = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Anonymous lambda serves array. Helper returns Observe() applied to that.
    const helper = (values: Array<number>): Stats => Observe(
        (() => {
            let i = 0;
            return () => values[i++];
        })(),
        values.length
    );

    const zeroStats = helper(zeros);
    expect(zeroStats.min).toBeCloseTo(0);
    expect(zeroStats.max).toBeCloseTo(0);
    expect(zeroStats.mean).toBeCloseTo(0);
    expect(zeroStats.variance).toBeCloseTo(0);

    const oneStats = helper(ones);
    expect(oneStats.min).toBeCloseTo(1);
    expect(oneStats.max).toBeCloseTo(1);
    expect(oneStats.mean).toBeCloseTo(1);
    expect(oneStats.variance).toBeCloseTo(0);

    const halfStats = helper(half);
    expect(halfStats.min).toBeCloseTo(0);
    expect(halfStats.max).toBeCloseTo(1);
    expect(halfStats.mean).toBeCloseTo(0.5);
    expect(halfStats.variance).toBeCloseTo(0.27777);

    const numberStats = helper(numbers);
    expect(numberStats.min).toBeCloseTo(0);
    expect(numberStats.max).toBeCloseTo(9);
    expect(numberStats.mean).toBeCloseTo(4.5);
    expect(numberStats.variance).toBeCloseTo(9.1666);
});

test("ingestor() calculates Stats of a source of numbers by being fed the values", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const half = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Anonymous lambda serves array. Helper returns Observe() applied to that.
    const helper = (values: Array<number>): Stats => {
        const ingestor = GetIngestor();
        let stats: Stats = NullStats();
        for (let entry of values) {
            stats = ingestor(entry);
        }
        return stats;
    }

    const zeroStats = helper(zeros);
    expect(zeroStats.min).toBeCloseTo(0);
    expect(zeroStats.max).toBeCloseTo(0);
    expect(zeroStats.mean).toBeCloseTo(0);
    expect(zeroStats.variance).toBeCloseTo(0);

    const oneStats = helper(ones);
    expect(oneStats.min).toBeCloseTo(1);
    expect(oneStats.max).toBeCloseTo(1);
    expect(oneStats.mean).toBeCloseTo(1);
    expect(oneStats.variance).toBeCloseTo(0);

    const halfStats = helper(half);
    expect(halfStats.min).toBeCloseTo(0);
    expect(halfStats.max).toBeCloseTo(1);
    expect(halfStats.mean).toBeCloseTo(0.5);
    expect(halfStats.variance).toBeCloseTo(0.27777);

    const numberStats = helper(numbers);
    expect(numberStats.min).toBeCloseTo(0);
    expect(numberStats.max).toBeCloseTo(9);
    expect(numberStats.mean).toBeCloseTo(4.5);
});

test("We can abuse Observe() without a performance hit", () => {
    const start = Date.now();
    const stats = Observe(Math.random, 100000);
    const end = Date.now();

    expect(stats.min).toBeCloseTo(0);
    expect(stats.max).toBeCloseTo(1);
    expect(stats.mean).toBeCloseTo(0.5);
    expect(stats.variance).toBeCloseTo(1 / 12);

    const executionTime = (end - start) / 1000;
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(0.1);
});

test("Validate() returns sensible results", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    // Anonymous lambda serves array. Helper returns Observe() applied to that.
    const helper = (values: Array<number>): Stats => Observe(
        (() => {
            let i = 0;
            return () => values[i++];
        })(),
        values.length
    );

    const zeroStats = helper(zeros);
    expect(Validate(zeroStats, { tolerance: 0 })).toBe(true);
    expect(Validate(zeroStats, { tolerance: 0, min: 0 })).toBe(true);
    expect(Validate(zeroStats, { tolerance: 0, min: 1 })).toBe(false);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: 0 })).toBe(true);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: -1 })).toBe(false);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: 0, mean: 0 })).toBe(true);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: 0, mean: 0.5 })).toBe(false);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: 0, mean: 0, variance: 0 })).toBe(true);
    expect(Validate(zeroStats, { tolerance: 0, min: 0, max: 0, mean: 0, variance: 10 })).toBe(false);

    const oneStats = helper(ones);
    expect(Validate(oneStats, { tolerance: 0 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0, min: 1 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0, min: 0 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0.1, min: 0.95 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0.1, min: 0.85 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: 1 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: -3 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1.06 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1.16 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: 1, mean: 1 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: 1, mean: 4.5 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1, mean: 0.91 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1, mean: 1.11 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: 1, mean: 1, variance: 0 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0, min: 1, max: 1, mean: 1, variance: 10 })).toBe(false);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1, mean: 1, variance: 0.03 })).toBe(true);
    expect(Validate(oneStats, { tolerance: 0.1, min: 1, max: 1, mean: 1, variance: 0.13 })).toBe(false);
});

test("ObserveCovariance() does joint observation of two sample sets", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const half = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const supply = (x: number[], y: number[]) => {
        let idx = 0;
        return () => {
            const output = { x: x[idx], y: y[idx] };
            idx++;
            return output;
        };
    }

    const helper = (x: number[], y: number[]) => ObserveCovariance(supply(x, y), 10);

    const zo = helper(zeros, ones);

    // x is stats for first (zeros).
    expect(zo.x.min).toBeCloseTo(0);
    expect(zo.x.max).toBeCloseTo(0);
    expect(zo.x.mean).toBeCloseTo(0);
    expect(zo.x.variance).toBeCloseTo(0);

    // y is stats for second (ones).
    expect(zo.y.min).toBeCloseTo(1);
    expect(zo.y.max).toBeCloseTo(1);
    expect(zo.y.mean).toBeCloseTo(1);
    expect(zo.y.variance).toBeCloseTo(0);

    // Covariance is expected value.
    expect(zo.covariance).toBeCloseTo(0);

    // Everything still true in reverse.
    const oz = helper(ones, zeros);

    expect(oz.x.min).toBeCloseTo(1);
    expect(oz.x.max).toBeCloseTo(1);
    expect(oz.x.mean).toBeCloseTo(1);
    expect(oz.x.variance).toBeCloseTo(0);

    expect(oz.y.min).toBeCloseTo(0);
    expect(oz.y.max).toBeCloseTo(0);
    expect(oz.y.mean).toBeCloseTo(0);
    expect(oz.y.variance).toBeCloseTo(0);

    expect(oz.covariance).toBeCloseTo(0);

    const hn = helper(half, numbers);

    expect(hn.x.min).toBeCloseTo(0);
    expect(hn.x.max).toBeCloseTo(1);
    expect(hn.x.mean).toBeCloseTo(0.5);
    expect(hn.x.variance).toBeCloseTo(0.27777);

    expect(hn.y.min).toBeCloseTo(0);
    expect(hn.y.max).toBeCloseTo(9);
    expect(hn.y.mean).toBeCloseTo(4.5);
    expect(hn.y.variance).toBeCloseTo(9.1666);

    expect(hn.covariance).toBeCloseTo(1.3888);
});

test("GetCovarianceIngestor() returns an {x,y} ingestor that returns CovarianceStats", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const half = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const zoIngestor = GetCovarianceIngestor();
    const hnIngestor = GetCovarianceIngestor();

    let zo = NullCovarianceStats();
    let hn = NullCovarianceStats();

    for (let i = 0; i < 10; i++) {
        zo = zoIngestor(zeros[i], ones[i]);
        hn = hnIngestor(half[i], numbers[i]);
    }

    // x is stats for first (zeros).
    expect(zo.x.min).toBeCloseTo(0);
    expect(zo.x.max).toBeCloseTo(0);
    expect(zo.x.mean).toBeCloseTo(0);
    expect(zo.x.variance).toBeCloseTo(0);

    // y is stats for second (ones).
    expect(zo.y.min).toBeCloseTo(1);
    expect(zo.y.max).toBeCloseTo(1);
    expect(zo.y.mean).toBeCloseTo(1);
    expect(zo.y.variance).toBeCloseTo(0);

    // Covariance is expected value.
    expect(zo.covariance).toBeCloseTo(0);

    expect(hn.x.min).toBeCloseTo(0);
    expect(hn.x.max).toBeCloseTo(1);
    expect(hn.x.mean).toBeCloseTo(0.5);
    // Sample variance = 0.25, N = 10 => Bessel's correction = 0.2777...
    expect(hn.x.variance).toBeCloseTo(0.27777);

    expect(hn.y.min).toBeCloseTo(0);
    expect(hn.y.max).toBeCloseTo(9);
    expect(hn.y.mean).toBeCloseTo(4.5);
    // Sample variance = 8.25, N = 10 => Bessel's correction = 9.1666...
    expect(hn.y.variance).toBeCloseTo(9.1666);

    // Sample covariance = 1.25, N = 10 => Bessel's correction = 1.3888...
    expect(hn.covariance).toBeCloseTo(1.3888);
});

test("CovarianceValidate(observed, expected) validates a CovarianceStats object (observed) against a CovarianceValidation object (expected", () => {
    const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const half = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const zoIngestor = GetCovarianceIngestor();
    const hnIngestor = GetCovarianceIngestor();

    let zoStats = NullCovarianceStats();
    let hnStats = NullCovarianceStats();

    for (let i = 0; i < 10; i++) {
        zoStats = zoIngestor(zeros[i], ones[i]);
        hnStats = hnIngestor(half[i], numbers[i]);
    }

    const zVal = { min: 0, max: 0, mean: 0, variance: 0 };
    const oVal = { min: 1, max: 1, mean: 1, variance: 0 };

    const zoVal1 = {};
    const zoVal2 = { tolerance: 0.05 };
    const zoVal3 = { tolerance: 0.05, x: zVal }; // Pass.
    const zoVal4 = { tolerance: 0.05, x: oVal }; // Fail.
    const zoVal5 = { tolerance: 0.05, y: oVal }; // Pass.
    const zoVal6 = { tolerance: 0.05, y: zVal }; // Fail.
    const zoVal7 = { tolerance: 0.05, x: zVal, y: oVal }; // Pass.
    const zoVal8 = { tolerance: 0.05, x: oVal, y: zVal }; // Fail.
    const zoVal9 = { tolerance: 0.05, x: zVal, y: oVal, covariance: 0 }; // Pass.

    expect(CovarianceValidate(zoStats, zoVal1)).toBe(true);
    expect(CovarianceValidate(zoStats, zoVal2)).toBe(true);
    expect(CovarianceValidate(zoStats, zoVal3)).toBe(true);
    expect(CovarianceValidate(zoStats, zoVal4)).toBe(false);
    expect(CovarianceValidate(zoStats, zoVal5)).toBe(true);
    expect(CovarianceValidate(zoStats, zoVal6)).toBe(false);
    expect(CovarianceValidate(zoStats, zoVal7)).toBe(true);
    expect(CovarianceValidate(zoStats, zoVal8)).toBe(false);
    expect(CovarianceValidate(zoStats, zoVal9)).toBe(true);

    const hVal = { min: 0, max: 1, mean: 0.5, variance: 0.27777 };
    const nVal = { min: 0, max: 9, mean: 4.5 };

    const hnVal1 = {};
    const hnVal2 = { tolerance: 0.05 };
    const hnVal3 = { tolerance: 0.05, x: hVal }; // Pass.
    const hnVal4 = { tolerance: 0.05, x: nVal }; // Fail.
    const hnVal5 = { tolerance: 0.05, y: nVal }; // Pass.
    const hnVal6 = { tolerance: 0.05, y: hVal }; // Fail.
    const hnVal7 = { tolerance: 0.05, x: hVal, y: nVal }; // Pass.
    const hnVal8 = { tolerance: 0.05, x: nVal, y: hVal }; // Fail.
    const hnVal9 = { tolerance: 0.05, x: hVal, y: nVal, covariance: 1.38888 }; // Pass.

    expect(CovarianceValidate(hnStats, hnVal1)).toBe(true);
    expect(CovarianceValidate(hnStats, hnVal2)).toBe(true);
    expect(CovarianceValidate(hnStats, hnVal3)).toBe(true);
    expect(CovarianceValidate(hnStats, hnVal4)).toBe(false);
    expect(CovarianceValidate(hnStats, hnVal5)).toBe(true);
    expect(CovarianceValidate(hnStats, hnVal6)).toBe(false);
    expect(CovarianceValidate(hnStats, hnVal7)).toBe(true);
    expect(CovarianceValidate(hnStats, hnVal8)).toBe(false);
    expect(CovarianceValidate(hnStats, hnVal9)).toBe(true);
});
