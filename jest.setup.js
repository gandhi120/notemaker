import '@testing-library/jest-native/extend-expect';

// Mock console warnings/errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
