import * as z from 'zod';
import { Err, Ok, type Result } from '../../../../types/result.type.js';
import { Skills } from '../../../../types/skills.type.js';
import { capitalize } from '../../../util.js';

export const hiscoresBaseUrl = 'https://2004.lostcity.rs/api/hiscores/player';

const zHiscoreEntry = z.object({
  type: z.number(),
  level: z.number(),
  value: z.number(),
  rank: z.number(),
});

const zHiscoresResponse = z.array(zHiscoreEntry);

export interface SkillXp {
  skillName: string;
  level: number;
  xp: number;
}

function skillNameToType(skillName: string): number | undefined {
  const normalized = capitalize(skillName.toLowerCase());
  const value = Skills[normalized as keyof typeof Skills];

  return typeof value === 'number' ? value : undefined;
}

/**
 * Parses a hiscores API response and extracts the level/xp for a single skill.
 */
export function parsePlayerHiscores(json: unknown, skillName: string): Result<SkillXp> {
  const parsed = zHiscoresResponse.safeParse(json);

  if (!parsed.success) {
    return Err('Received invalid response from hiscores API.', parsed);
  }

  const skillType = skillNameToType(skillName);

  if (skillType === undefined) {
    return Err(`Unknown skill: ${skillName}`);
  }

  const entry = parsed.data.find((e) => e.type === skillType);

  if (!entry) {
    return Err(`No hiscores entry found for skill ${skillName}.`);
  }

  return Ok({ skillName: Skills[skillType], level: entry.level, xp: Math.round(entry.value / 10) });
}

export async function fetchPlayerXp(
  skillName: string,
  playerName: string,
): Promise<Result<SkillXp>> {
  const url = `${hiscoresBaseUrl}/${playerName}`;

  let json: unknown;

  try {
    const response = await fetch(url);
    json = await response.json();
  } catch (e) {
    return Err('An unknown error occurred while fetching hiscores.', e);
  }

  return parsePlayerHiscores(json, skillName);
}
