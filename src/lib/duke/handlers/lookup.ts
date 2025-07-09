import { Err, Ok, Result } from '../../../types/result.type.js';
import { Player } from '../../database/models/player.model.js';
import { CommandHandler, Duke } from '../duke.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import { Colour, FormattingBuilder } from '../../irc/formatting.js';
import { Skills } from '../../../types/skills.type.js';

export async function lookup(name: string): Promise<Result<Player>> {
  try {
    const url = `https://2004.lostcity.rs/api/hiscores/player/${name}`;
    const response = await fetch(url);
    const data: {
      type: number;
      level: number;
      value: number;
      date: string;
      rank: number;
    }[] = await response.json();

    const skills = data.map((skill) => {
      return {
        skillName: Skills[skill.type],
        level: skill.level.toString(),
        xp: (skill.value / 10).toFixed(),
      };
    });

    return Ok({
      name,
      skills,
    });
  } catch {
    // TODO
    return Err('');
  }
}

export function formatPlayerSkills(player: Player): string {
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
    Runecrafting: '⚡',
    Fletching: '🪶',
    Agility: '🏃',
    Herblore: '🌿',
    Thieving: '💰',
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

    const result = await lookup(command.params.join(' '));

    if (result.type === 'error') {
      command.privmsg.reply(`An error occurred: ${result.message}`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    command.privmsg.reply(formatPlayerSkills(result.data!));
  }
}
