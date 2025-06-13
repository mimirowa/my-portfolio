module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-tests.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{js,ts,jsx,tsx}'],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
};
