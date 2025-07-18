// Test setup file
// Mock localStorage for browser API tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock sessionStorage for browser API tests
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole);
});

// Mock fetch for API-related tests
global.fetch = jest.fn();

// Mock WebSocket for real-time tests
(global as any).WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock crypto for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
    },
  },
});

// Mock gtag for analytics tests
(global as any).gtag = jest.fn();