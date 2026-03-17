import * as z from 'zod';

export const zGeolocationResponse = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      id: z.string(),
      geometry: z.object({
        type: z.literal('Point'),
        coordinates: z.array(z.number()),
      }),
      properties: z
        .object({
          mapbox_id: z.string(),
          feature_type: z.string(),
          full_address: z.string(),
          name: z.string(),
          name_preferred: z.string(),
          coordinates: z.object({
            longitude: z.number(),
            latitude: z.number(),
          }),
          place_formatted: z.string(),
        })
        .transform((property) => {
          return {
            mapboxId: property.mapbox_id,
            featureType: property.feature_type,
            fullAddress: property.full_address,
            name: property.name,
            namePreferred: property.name_preferred,
            coordinates: property.coordinates,
            placeFormatted: property.place_formatted,
          };
        }),
    }),
  ),
});

export type GeolocationResponse = z.infer<typeof zGeolocationResponse>;
