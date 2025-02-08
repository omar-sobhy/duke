import { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  // [...]
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(mt|t)s$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/', '(.*)\\.js'],
};

export default jestConfig;
