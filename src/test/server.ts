import { setupServer } from 'msw/node';

// Each test declares the endpoints it needs with server.use(...): an unexpected call fails the test.
export const server = setupServer();
