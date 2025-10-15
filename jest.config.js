module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/utils/seed.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFiles: ['<rootDir>/tests/jest.env.js']
};