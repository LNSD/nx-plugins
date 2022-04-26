module.exports = {
  displayName: 'playwright',

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/playwright',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx,js,jsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  preset: '../../jest.preset.ts',
};
