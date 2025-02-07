import * as cheerio from 'cheerio';
import { Err, Ok, Result } from '../types/result.type';
import { Player } from './database/models/player.model';

const selector =
  'body > table > tbody > tr > td > center > div > table:nth-child(2) > tbody > tr > td > center > table:nth-child(6) > tbody > tr > td > p > table > tbody > tr:not(:first-child)';

export async function lookup(name: string): Promise<Result<Player>> {
  try {
    const url = `https://2004.lostcity.rs/hiscores/player/${name}`;

    const $ = await cheerio.fromURL(url);

    const rows = $(selector);

    const skills = Array.from(rows).map((row) => {
      const columns = $('td', row);

      const skillName = $('a', columns[2]).text().trim();
      const level = $(columns[4]).text().trim();

      return {
        skillName,
        level,
      };
    });

    return Ok({
      name,
      skills,
    });
  } catch {
    return Err('');
  }
}
