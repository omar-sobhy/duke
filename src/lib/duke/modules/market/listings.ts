import * as z from 'zod';
import superagent from 'superagent';
import * as cheerio from 'cheerio';
import { Err, Ok, type Result } from '../../../../types/result.type.js';

/**
 * The base URL for the item listings page.
 */
export const itemsBaseUrl = 'https://markets.lostcity.rs/items';

export const zListingsPage = z.object({
  props: z.object({
    listings: z.object({
      data: z.array(
        z.object({
          username: z.string(),
          quantity: z.number(),
          offers: z.array(
            z.object({
              items: z.array(
                z.object({
                  quantity: z.number(),
                  item: z.object({ slug: z.string() }),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  }),
});

export interface MarketListing {
  username: string;
  price: number;
  amount: number;
}

/**
 * Parses the item listings page HTML (an Inertia/Vue page whose table rows
 * are only populated client-side) by reading the listings data embedded in
 * the `data-page` attribute instead of the rendered table markup.
 */
export function parseListingsPage(html: string): Result<MarketListing[]> {
  const $ = cheerio.load(html);

  const pageData = $('#app').attr('data-page');

  if (!pageData) {
    return Err('Could not find listings data on the page.');
  }

  let json: unknown;

  try {
    json = JSON.parse(pageData);
  } catch (e) {
    return Err('Could not parse listings data on the page.', e);
  }

  const parsedPageData = zListingsPage.safeParse(json);

  if (!parsedPageData.success) {
    return Err('Received invalid response from listings page.', parsedPageData);
  }

  const listings = parsedPageData.data.props.listings.data.flatMap((listing) => {
    const coinsOffer = listing.offers
      .flatMap((offer) => offer.items)
      .find((offerItem) => offerItem.item.slug === 'coins');

    if (!coinsOffer) {
      return [];
    }

    return [{ username: listing.username, price: coinsOffer.quantity, amount: listing.quantity }];
  });

  return Ok(listings);
}

export async function fetchListings(
  itemSlug: string,
  type: 'buy' | 'sell',
): Promise<Result<MarketListing[]>> {
  const listingsUrl = new URL(`${itemsBaseUrl}/${itemSlug}`);

  listingsUrl.searchParams.append('type', type);

  try {
    const response = await superagent.get(listingsUrl.toString());

    return parseListingsPage(response.text);
  } catch (e) {
    return Err('An unknown error occurred while fetching listings.', e);
  }
}
