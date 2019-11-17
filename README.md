# Statistics library

Statistics library written in TypeScript.

This module offers a set of utilities to calculate the min, max, mean and variance of a sample set in a single pass, with `O(1)` memory complexity, thanks to [Welford's algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm).

## Batch processing

`Observe()` allows easy sampling from a generator function. The results can be checked against an absolute tolerance threshold with `Validate()`.

```typescript
const stats: Stats = Observe(Math.random, 10000);
/* Example run:
stats == {
    mean: 0.5043444454272914,
    variance: 0.08365224363741369,
    min: 0.00006183111645019501,
    max: 0.9999845572175807,
}; */

const validation = {
    tolerance: 0.01,
    min: 0,
    max: 1,
    mean: 0.5,
    variance: 1 / 12,
};

const good = Validate(stats, validation); // good == true (all values within tolerance).
```

## Yielding

`GetIngestor()` can be fed one piece at a time. It returns `Stats` objects at every step, just like `Observe()`.

If you need a dummy `Stats` object, you can use `NullStats()`.

```typescript
const ingestor = GetIngestor();
const someData = [...];
let stats = NullStats();
for(datum of someData) {
    // Slowly building up:
    stats = ingestor(datum);
}
const good = Validate(stats, {...});
```

## Covariance

All the single-variable functions are replicated in a two-variable version that provides covariance calculation and validation. They have the same names, with the `Covariance` prefix:

```typescript
const ingestor = GetCovarianceIngestor();
const firstSample = [...];
const secondSample = [...];

let stats = NullCovarianceStats();
for(let i = 0; i < N; i++) {
    stats = ingestor(firstSample[i], secondSample[i]);
}

/* stats = {
    x: { min: ... } // Stats for firstSample.
    y: { min: ... } // Stats for secondSample.
    covariance: 23.5 // (e.g.)
} */

const good = CovarianceValidate(stats, {...});
```
