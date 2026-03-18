import * as z from 'zod';
import { capitalize } from '../../../lib/util.js';
import { FormattingBuilder, Colour } from '../../../lib/irc/formatting.js';

export const zWeatherResponse = z.object({
  coord: z.object({ lon: z.number(), lat: z.number() }),
  weather: z.array(
    z.object({
      id: z.number(),
      main: z.string(),
      description: z.string(),
      icon: z.string(),
    }),
  ),
  base: z.string(),
  main: z
    .object({
      temp: z.number(),
      feels_like: z.number(),
      temp_min: z.number(),
      temp_max: z.number(),
      pressure: z.number(),
      humidity: z.number(),
      sea_level: z.number(),
      grnd_level: z.number(),
    })
    .transform((main) => {
      return {
        temp: main.temp,
        feelsLike: main.feels_like,
        tempMin: main.temp_min,
        tempMax: main.temp_max,
        pressure: main.pressure,
        humidity: main.humidity,
        seaLevel: main.sea_level,
        groundLevel: main.grnd_level,
      };
    }),
  visibility: z.number(),
  wind: z.object({
    speed: z.number().optional(),
    deg: z.number().optional(),
    gust: z.number().optional(),
  }),
  rain: z
    .object({
      '1h': z.number(),
    })
    .optional(),
  clouds: z.object({ all: z.number() }),
  dt: z.number(),
  sys: z.object({
    type: z.number(),
    id: z.number(),
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
  timezone: z.number(),
  id: z.number(),
  name: z.string(),
  cod: z.number(),
});

export type WeatherResponse = z.infer<typeof zWeatherResponse>;

export function formatWeatherResponse(response: WeatherResponse) {
  const weather = response.weather[0];

  const data = [
    { name: `${response.name}, ${response.sys.country}` },
    { name: '', value: weather.description.split(' ').map(capitalize).join(' ') },
    { name: 'Temperature', value: formatTemperature(response.main.temp) },
    { name: 'Pressure', value: `${response.main.pressure}mb` },
    { name: 'Humidity', value: `${response.main.humidity}%` },
    { name: 'Rain', value: response.rain?.['1h'] ?? 'No data available' },
  ];

  const builder = new FormattingBuilder('');

  data.forEach(({ name, value }, index) => {
    builder.bold(name);

    if (value) {
      builder.normal(` ${value}`);
    }

    if (index !== data.length - 1) {
      builder.normal(' :: ');
    }
  });

  return builder.text;
}

function formatTemperature(kelvin: number): string {
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

  const celsius = kelvinToCelsius(kelvin);
  const fahrenheit = kelvinToFahrenheit(kelvin);

  const ranges = [
    { min: -300, max: -20, color: Colour.BLUE, bold: true },
    { min: -20, max: -10, color: Colour.LIGHT_BLUE, bold: false },
    { min: -10, max: 0, color: Colour.LIGHT_CYAN, bold: true },
    { min: 0, max: 15, color: Colour.CYAN, bold: false },
    { min: 15, max: 20, color: Colour.ORANGE, bold: false },
    { min: 20, max: 30, color: Colour.ORANGE, bold: true },
    { min: 30, max: 1000, color: Colour.RED, bold: true },
  ] as const;

  for (const { min, max, color, bold } of ranges) {
    if (celsius >= min && celsius <= max) {
      return new FormattingBuilder('').colour(
        `${formatter.format(celsius)}C / ${formatter.format(fahrenheit)}F`,
        color,
        {
          bold,
        },
      ).text;
    }
  }

  return 'Unknown temperature';
}

function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

function kelvinToFahrenheit(kelvin: number): number {
  return (kelvin - 273.15) * 1.8 + 32;
}
