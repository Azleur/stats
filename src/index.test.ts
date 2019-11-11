import { Stats, Validation, Observe, GetIngestor, Validate, NullStats } from './index';

test("Hi, I'm an example", () => {
    const stats = Observe(Math.random, 10000);
    console.log(stats);
    const validation: Validation = {
        tolerance: 0.01,
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
    expect(zeroStats.min).toBe(0);
    expect(zeroStats.max).toBe(0);
    expect(zeroStats.mean).toBe(0);
    expect(zeroStats.variance).toBe(0);

    const oneStats = helper(ones);
    expect(oneStats.min).toBe(1);
    expect(oneStats.max).toBe(1);
    expect(oneStats.mean).toBe(1);
    expect(oneStats.variance).toBe(0);

    const halfStats = helper(half);
    expect(halfStats.min).toBe(0);
    expect(halfStats.max).toBe(1);
    expect(halfStats.mean).toBe(0.5);
    expect(halfStats.variance).toBe(0.25);

    const numberStats = helper(numbers);
    expect(numberStats.min).toBe(0);
    expect(numberStats.max).toBe(9);
    expect(numberStats.mean).toBe(4.5);
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
    expect(zeroStats.min).toBe(0);
    expect(zeroStats.max).toBe(0);
    expect(zeroStats.mean).toBe(0);
    expect(zeroStats.variance).toBe(0);

    const oneStats = helper(ones);
    expect(oneStats.min).toBe(1);
    expect(oneStats.max).toBe(1);
    expect(oneStats.mean).toBe(1);
    expect(oneStats.variance).toBe(0);

    const halfStats = helper(half);
    expect(halfStats.min).toBe(0);
    expect(halfStats.max).toBe(1);
    expect(halfStats.mean).toBe(0.5);
    expect(halfStats.variance).toBe(0.25);

    const numberStats = helper(numbers);
    expect(numberStats.min).toBe(0);
    expect(numberStats.max).toBe(9);
    expect(numberStats.mean).toBe(4.5);
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
