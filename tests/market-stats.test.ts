import { describe, expect, it } from '@jest/globals';
import { calculateListingStats } from '../src/lib/duke/modules/market/stats.js';
import type { MarketListing } from '../src/lib/duke/modules/market/listings.js';

function listing(price: number): MarketListing {
  return { username: 'someone', price, amount: 1 };
}

describe('calculateListingStats', () => {
  it('returns undefined for an empty list', () => {
    expect(calculateListingStats([])).toBeUndefined();
  });

  it('returns the same value for min, max and average with a single listing', () => {
    expect(calculateListingStats([listing(3300)])).toEqual({
      average: 3300,
      min: 3300,
      max: 3300,
    });
  });

  it('computes average, min and max across multiple listings', () => {
    const listings = [listing(3300), listing(3100), listing(3000)];

    expect(calculateListingStats(listings)).toEqual({
      average: 3133.3333333333335,
      min: 3000,
      max: 3300,
    });
  });
});
