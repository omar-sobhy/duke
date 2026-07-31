import type { MarketListing } from './listings.js';

export interface ListingStats {
  average: number;
  min: number;
  max: number;
}

/**
 * Computes price stats (average, minimum, maximum) across a set of listings.
 * Returns undefined for an empty list, since there's no meaningful min/max/average.
 */
export function calculateListingStats(listings: MarketListing[]): ListingStats | undefined {
  if (listings.length === 0) {
    return undefined;
  }

  const prices = listings.map((listing) => listing.price);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return { average, min, max };
}
