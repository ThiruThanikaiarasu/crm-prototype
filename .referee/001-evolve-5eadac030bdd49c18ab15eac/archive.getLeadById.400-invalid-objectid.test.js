const request = require('supertest');
const { loadAppWith } = require('./testUtils');

describe('GET /api/v1/archive/leads/:id -> 400 on invalid ObjectId', () => {
  test('returns 400 and does not call service when id is invalid', async () => {
    const serviceMock = { getArchivedLeadById: jest.fn() };
    const { app } = loadAppWith({ serviceImpl: serviceMock });

    const res = await request(app).get('/api/v1/archive/leads/abc');

    expect(res.status).toBe(400);
    const body = res.body || {};
    expect(JSON.stringify(body).toLowerCase()).toContain('invalid');
    expect(serviceMock.getArchivedLeadById).not.toHaveBeenCalled();
  });
});
