const request = require('supertest');
const path = require('path');
require('./testUtils'); // sets the placeholder env the app needs to load

describe('Authorization unchanged — archived lead detail is protected', () => {
  test('without auth, endpoint is not accessible (401/403)', async () => {
    jest.resetModules();
    const implRoot = path.resolve(__dirname, '../..');
    const app = require(path.join(implRoot, 'app.js'));

    const VALID_ID = '695012cde2389e938f922ea0';
    const res = await request(app).get(`/api/v1/archive/leads/${VALID_ID}`);

    expect([401, 403]).toContain(res.status);
  });
});
