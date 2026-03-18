import { ZodError } from 'zod';
import {
  GeolocationResponse,
  zGeolocationResponse,
} from '../../../types/duke/mapbox/geolocation.js';
import { Result, Ok, Err } from '../../../types/result.type.js';
import { WeatherResponse, zWeatherResponse } from '../../../types/duke/openweathermap/weather.js';

export async function geolocate(
  query: string,
  apiKey: string,
): Promise<Result<GeolocationResponse, ZodError<GeolocationResponse> | string>> {
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&access_token=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

    const result = zGeolocationResponse.safeParse(data);

    if (result.success) {
      return Ok(result.data);
    }

    return Err('validation error', result.error);
  } catch (error) {
    return Err('unkown error', JSON.stringify(error));
  }
}

export interface WeatherOpts {
  latitude: string;
  longitude: string;
  apiKey: string;
}

export async function weather(
  opts: WeatherOpts,
): Promise<Result<WeatherResponse, ZodError<WeatherResponse> | string>> {
  const { apiKey, latitude, longitude } = opts;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

    const result = zWeatherResponse.safeParse(data);

    if (result.success) {
      return Ok(result.data);
    }

    return Err('validation error', result.error);
  } catch (error) {
    return Err('unknown error', JSON.stringify(error));
  }
}
