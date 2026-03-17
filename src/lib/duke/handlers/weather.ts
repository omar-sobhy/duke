import { Duke } from '../duke';
import { PrivmsgCommand } from '../privmsgCommand';
import { CommandHandler } from './CommandHandler';
import { geolocate } from '../../weather/geolocate';

export class WeatherHandler extends CommandHandler {
  public override readonly commandName = 'weather';

  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;

    return `Refreshes the user list. Usage: ${p}${this.commandName}`;
  }

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    const lower = command.command.toLowerCase();

    return this.commandName.startsWith(lower);
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    const { openWeatherMapKey, mapBoxKey } = duke.config;

    if (command.params[0].toLowerCase() === 'set') {
      //
    }

    const geolocateResult = await geolocate('', mapBoxKey);
  }

  async setLocation(duke: Duke, location: string): Promise<void> {
    const { openWeatherMapKey, mapBoxKey } = duke.config;

    const geolocateResult = await geolocate(location, mapBoxKey);
  }
}
