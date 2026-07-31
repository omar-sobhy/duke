import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@jest/globals';
import { fetchListings, parseListingsPage } from '../src/lib/duke/modules/market/listings.js';

const fixturePath = fileURLToPath(
  new URL('./fixtures/market/dragon_bones_sell.html', import.meta.url),
);

describe('parseListingsPage (static fixture)', () => {
  it('extracts username, price and amount from the embedded listings data', async () => {
    const html = await readFile(fixturePath, 'utf-8');

    const result = parseListingsPage(html);

    expect(result.type).toBe('success');
    expect(result.data).toEqual([
      { username: 'pandie', price: 3300, amount: 500 },
      { username: 'proverbs_3_5', price: 3100, amount: 490 },
    ]);
  });

  it('skips listings with no coins offer', async () => {
    const html = await readFile(fixturePath, 'utf-8');

    const result = parseListingsPage(html);

    expect(result.data).not.toContainEqual(expect.objectContaining({ username: 'runeonly' }));
  });

  it('errors on HTML with no #app data-page attribute', () => {
    const result = parseListingsPage('<html><body>no data here</body></html>');

    expect(result.type).toBe('error');
  });

  it('errors on malformed JSON in data-page', () => {
    const result = parseListingsPage('<div id="app" data-page="not json"></div>');

    expect(result.type).toBe('error');
  });
});

const liveTest = process.env.RUN_LIVE_TESTS ? it : it.skip;

describe('fetchListings (live page)', () => {
  liveTest(
    'fetches and parses real dragon bones sell listings from markets.lostcity.rs',
    async () => {
      const result = await fetchListings('dragon_bones', 'sell');

      expect(result.type).toBe('success');

      if (result.type === 'success') {
        expect(Array.isArray(result.data)).toBe(true);

        for (const listing of result.data) {
          expect(typeof listing.username).toBe('string');
          expect(typeof listing.price).toBe('number');
          expect(typeof listing.amount).toBe('number');
        }
      }
    },
  );
});
