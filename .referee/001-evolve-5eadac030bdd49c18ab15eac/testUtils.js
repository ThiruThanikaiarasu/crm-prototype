const path = require('path');

// The app refuses to start without these (configurations/env.config.js), and a fresh checkout has no .env.
// Inert placeholders so the app can load under test; nothing here connects anywhere or is a credential.
Object.entries({
  DB_URI: 'mongodb://127.0.0.1:27017/referee-test',
  JWT_ACCESS_SECRET: 'referee-test',
  JWT_REFRESH_SECRET: 'referee-test',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '7d',
  EMAIL_USER: 'referee@example.test',
  EMAIL_PASS: 'referee-test',
  CORS_ORIGIN_URL: 'http://localhost:3000',
}).forEach(([key, value]) => {
  if (!process.env[key]) process.env[key] = value;
});

const implRoot = path.resolve(__dirname, '../..');
const appPath = path.join(implRoot, 'app.js');
const servicePath = path.join(implRoot, 'services', 'archive.service.js');
const authMwPath = path.join(implRoot, 'middlewares', 'auth.middleware.js');

function makeAuthStubs() {
  return {
    verifyUser: jest.fn((req, _res, next) => {
      req.user = { tenantId: 't1', role: 'super_admin', _id: 'u1' };
      next();
    }),
    allowRoles: jest.fn(() => (req, _res, next) => next()),
  };
}

function loadAppWith({ serviceImpl } = {}) {
  jest.resetModules();

  // Stub auth to avoid 401/403 during behavior tests
  jest.doMock(authMwPath, () => ({ ...jest.requireActual(authMwPath), ...makeAuthStubs() }), { virtual: false });

  // Patch service exports as needed for tests
  if (serviceImpl) {
    const realService = require(servicePath);
    if (typeof serviceImpl.getArchivedLeadById === 'function') {
      realService.getArchivedLeadById = serviceImpl.getArchivedLeadById;
    }
  }

  const app = require(appPath);
  return { app };
}

function getPaths() {
  return { implRoot, appPath, servicePath, authMwPath };
}

module.exports = { loadAppWith, getPaths };
