import { ZodError } from 'zod';
import { GeolocationResponse, zGeolocationResponse } from '../../types/duke/mapbox/geolocation';
import { Result, Ok, Err } from '../../types/result.type';
import { WeatherResponse, zWeatherResponse } from '../../types/duke/openweathermap/weather';

export async function geolocate(
  query: string,
  apiKey: string,
): Promise<Result<GeolocationResponse, ZodError<GeolocationResponse> | string>> {
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&access_token=${apiKey}`;

    const data = await fetch(url);

    const result = zGeolocationResponse.safeParse(data);

    if (result.success) {
      return Ok(result.data);
    }

    return Err('validation error', result.error);
  } catch (error) {
    return Err('unkown error', JSON.stringify(error));
  }
}

export async function weather(opts: {
  latitude: number;
  longitude: number;
  apiKey: string;
}): Promise<Result<WeatherResponse, ZodError<WeatherResponse> | string>> {
  const { apiKey, latitude, longitude } = opts;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    const data = await fetch(url);

    const result = zWeatherResponse.safeParse(data);

    if (result.success) {
      return Ok(result.data);
    }

    return Err('validation error', result.error);
  } catch (error) {
    return Err('unknown error', JSON.stringify(error));
  }
}
