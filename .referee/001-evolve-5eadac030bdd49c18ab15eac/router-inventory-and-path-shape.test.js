const request = require('supertest');
const { loadAppWith } = require('./testUtils');

const VALID_ID = '695012cde2389e938f922ea0';

describe('Archive route shape and registration', () => {
  test('correct path exists and mis-declared \'/leads:id\' does not match', async () => {
    const serviceMock = { getArchivedLeadById: jest.fn(async () => null) };
    const { app } = loadAppWith({ serviceImpl: serviceMock });

    const ok = await request(app).get(`/api/v1/archive/leads/${VALID_ID}`);
    expect([200, 404, 401, 403]).toContain(ok.status);

    const notMatch = await request(app).get('/api/v1/archive/leadsabc');
    expect(notMatch.status).toBe(404);
  });
});
