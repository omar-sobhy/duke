import { Err, Ok, type Result } from '../../../types/result.type.js';
import type { Duke } from '../duke.js';
import type { PrivmsgCommand } from '../privmsgCommand.js';
import { geolocate, weather } from '../weather/geolocate.js';
import { CommandHandler } from './CommandHandler.js';
import type { Location } from '../../../types/database/location.database.type.js';
import { formatWeatherResponse } from '../../../types/duke/openweathermap/weather.js';
import { logErrorAndReply } from '../../util.js';

export class WeatherHandler extends CommandHandler {
  public override readonly commandName = 'weather';

  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;

    return `${p}weather [[set <location>] | location]`;
  }

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    const lower = command.command.toLowerCase();

    return this.commandName.startsWith(lower);
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    const coordinatesResult = await this.getOrSetLocation(command);

    if (coordinatesResult.type === 'error') {
      return logErrorAndReply(coordinatesResult.data, command, duke.config.logger);
    }

    if (!coordinatesResult.data) {
      const p = this.duke.config.privmsgCommandPrefix;

      return void (await command.privmsg.reply(
        `Set your location first: ${p}weather set <location>`,
      ));
    }

    const { openWeatherMapKey } = this.duke.config;

    const { longitude, latitude } = coordinatesResult.data;

    const response = await weather({ apiKey: openWeatherMapKey, longitude, latitude });

    if (response.type === 'error') {
      return logErrorAndReply(response.data, command, duke.config.logger);
    }

    await command.privmsg.reply(formatWeatherResponse(response.data));
  }

  async getOrSetLocation(
    command: PrivmsgCommand,
  ): Promise<Result<{ longitude: string; latitude: string } | undefined>> {
    if (command.params.length === 0) {
      const table = this.duke.config.database('locations');

      const location = await table.where({ nick: command.privmsg.sender.nickname }).first();

      return Ok(location);
    }

    const first = command.params[0].toLowerCase();

    if (first === 'set') {
      const location = await this.setLocation(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        command.privmsg.sender.nickname!,
        command.params.slice(1).join(' '),
      );

      return location;
    }

    const locationName = command.params.join(' ');

    const { mapBoxKey } = this.duke.config;

    const geolocateResult = await geolocate(locationName, mapBoxKey);

    if (geolocateResult.type === 'success') {
      const { coordinates } = geolocateResult.data.features[0].properties;

      const { latitude, longitude } = coordinates;

      return Ok({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
    }

    return geolocateResult;
  }

  async setLocation(nick: string, location: string): Promise<Result<Location, unknown>> {
    const { mapBoxKey } = this.duke.config;

    const geolocateResult = await geolocate(location, mapBoxKey);

    if (geolocateResult.type !== 'success') {
      return geolocateResult;
    }

    const { coordinates, fullAddress } = geolocateResult.data.features[0].properties;

    const { latitude, longitude } = coordinates;

    return this.duke.config.database
      .transaction((transaction) => {
        return transaction
          .into('locations')
          .insert({
            nick,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            displayName: fullAddress,
          })
          .onConflict('nick')
          .merge()
          .returning('*');
      })
      .then((r) => Ok(r[0]))
      .catch((e) => Err(e));
  }
}
