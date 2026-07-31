import * as z from 'zod';
import superagent from 'superagent';
import { Err, Ok, type Result } from '../../../../types/result.type.js';

/**
 * The base URL for the item search API.
 */
export const itemsSearchApiBaseUrl = 'https://markets.lostcity.rs/api/items';

export const zItemsSearchResponse = z.array(
  z.object({
    isFavorite: z.boolean(),
    id: z.number(),
    game_id: z.number(),
    name: z.string(),
    slug: z.string(),
    cost: z.number(),
    isSet: z.boolean(),
  }),
);

export type ItemsSearchResponse = z.infer<typeof zItemsSearchResponse>;

export async function searchItem(itemName: string): Promise<Result<ItemsSearchResponse>> {
  try {
    const response = await superagent(itemsSearchApiBaseUrl).query({ q: itemName });

    const parsedBody = zItemsSearchResponse.safeParse(response.body);

    if (!parsedBody.success) {
      return Err('Received invalid response from search API.', parsedBody);
    }

    return Ok(parsedBody.data);
  } catch (e) {
    return Err('An unknown error occurred while fetching search results.', e);
  }
}
