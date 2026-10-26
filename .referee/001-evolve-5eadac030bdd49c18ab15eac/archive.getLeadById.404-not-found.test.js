const request = require('supertest');
const { loadAppWith } = require('./testUtils');

const VALID_ID = '695012cde2389e938f922ea0';

describe('GET /api/v1/archive/leads/:id -> 404 when not found', () => {
  test('returns 404 and a not-found message', async () => {
    const serviceMock = {
      getArchivedLeadById: jest.fn(async () => null),
    };
    const { app } = loadAppWith({ serviceImpl: serviceMock });

    const res = await request(app).get(`/api/v1/archive/leads/${VALID_ID}`);

    expect(res.status).toBe(404);
    const msg = JSON.stringify(res.body || {}).toLowerCase();
    expect(msg).toContain('not');
    expect(msg).toContain('found');
    expect(serviceMock.getArchivedLeadById).toHaveBeenCalled();
  });
});
