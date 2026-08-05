import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@jest/globals';
import { fetchPlayerXp, parsePlayerHiscores } from '../src/lib/duke/modules/hiscores/xp.js';

const fixturePath = fileURLToPath(new URL('./fixtures/xp/frogdoubler.json', import.meta.url));

describe('parsePlayerHiscores (static fixture)', () => {
  it('extracts level and xp for the requested skill', async () => {
    const json = JSON.parse(await readFile(fixturePath, 'utf-8'));

    const result = parsePlayerHiscores(json, 'attack');

    expect(result.type).toBe('success');
    expect(result.data).toEqual({ skillName: 'Attack', level: 88, xp: 4396783 });
  });

  it('is case-insensitive on the skill name', async () => {
    const json = JSON.parse(await readFile(fixturePath, 'utf-8'));

    const result = parsePlayerHiscores(json, 'MINING');

    expect(result.type).toBe('success');
    expect(result.data).toEqual({ skillName: 'Mining', level: 83, xp: 2707419 });
  });

  it('errors on an unknown skill name', async () => {
    const json = JSON.parse(await readFile(fixturePath, 'utf-8'));

    const result = parsePlayerHiscores(json, 'notaskill');

    expect(result.type).toBe('error');
  });

  it('errors on malformed hiscores data', () => {
    const result = parsePlayerHiscores({ not: 'an array' }, 'attack');

    expect(result.type).toBe('error');
  });
});

const liveTest = process.env.RUN_LIVE_TESTS ? it : it.skip;

describe('fetchPlayerXp (live page)', () => {
  liveTest(
    "fetches and parses frogdoubler's real Attack level/xp from 2004.lostcity.rs",
    async () => {
      const result = await fetchPlayerXp('attack', 'frogdoubler');

      expect(result.type).toBe('success');

      if (result.type === 'success') {
        expect(result.data.skillName).toBe('Attack');
        expect(typeof result.data.level).toBe('number');
        expect(typeof result.data.xp).toBe('number');
      }
    },
  );
});
