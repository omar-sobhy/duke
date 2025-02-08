import * as cheerio from 'cheerio';
import { Err, Ok, Result } from '../../../types/result.type.js';
import { Player } from '../../database/models/player.model.js';
import { CommandHandler, Duke } from '../duke.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import { Colour, FormattingBuilder } from '../../irc/formatting.js';

const selector =
  'body > table > tbody > tr > td > center > div > table:nth-child(2) > tbody > tr > td > center > table:nth-child(6) > tbody > tr > td > p > table > tbody > tr:not(:first-child)';

export async function lookup(name: string): Promise<Result<Player>> {
  try {
    const url = `https://2004.lostcity.rs/hiscores/player/${name}`;

    const $ = await cheerio.fromURL(url);

    if ($.text().includes('No player')) {
      return Err('Player not found');
    }

    const rows = $(selector);

    const skills = Array.from(rows).map((row) => {
      const columns = $('td', row);

      const skillName = $('a', columns[2]).text().trim();
      const level = $(columns[4]).text().trim();
      const xp = $(columns[5]).text().trim();

      return {
        skillName,
        level,
        xp,
      };
    });

    return Ok({
      name,
      skills,
    });
  } catch {
    return Err('');
    // TODO
  }
}

export function formatPlayerSkills(player: Player) {
  const { name, skills } = player;

  const reply = new FormattingBuilder('')
    .colour('[04Scape] ', Colour.LIGHT_GREEN)
    .colour(`${name} `, Colour.RED)
    .normal(':: ');

  const skillsMap: Record<string, string> = {
    Attack: '⚔️',
    Defence: '🛡️',
    Strength: '💪',
    Hitpoints: '♥️',
    Ranged: '🏹',
    Prayer: '⛪',
    Magic: '🧙',
    Cooking: '🍳',
    Woodcutting: '🪓',
    Fishing: '🐟',
    Firemaking: '🔥',
    Crafting: '⚒️',
    Smithing: '🔨',
    Mining: '⛏️',
    Runecrafting: '🔁',
  };

  skills.forEach((s) => {
    if (s.skillName === 'Overall') {
      reply.normal(`Total level ${s.level} `);
    } else {
      reply.normal(`${skillsMap[s.skillName]} ${s.level} `);
    }
  });

  return reply.text;
}

export class LookupHandler implements CommandHandler {
  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === 'lookup';
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (command.params.length === 0) {
      command.privmsg.reply('Usage: !lookup <user>');
      return;
    }

    const result = await lookup(command.params[0]);

    if (result.type === 'error') {
      command.privmsg.reply(`An error occurred: ${result.message}`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    command.privmsg.reply(formatPlayerSkills(result.data!));
  }
}
