const jestConfig = {
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
//# sourceMappingURL=jest.config.js.map