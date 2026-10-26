const request = require('supertest');
const { loadAppWith } = require('./testUtils');

const VALID_ID = '695012cde2389e938f922ea0';

describe('GET /api/v1/archive/leads/:id -> 200 when found', () => {
  test('returns 200 and data with matching _id', async () => {
    const fakeDoc = { _id: VALID_ID, deleted: { isDeleted: true } };
    const serviceMock = {
      getArchivedLeadById: jest.fn(async () => fakeDoc),
    };
    const { app } = loadAppWith({ serviceImpl: serviceMock });

    const res = await request(app).get(`/api/v1/archive/leads/${VALID_ID}`);

    expect(res.status).toBe(200);
    expect(res.body && res.body.data && res.body.data._id).toBe(VALID_ID);
    const text = JSON.stringify(res.body || {}).toLowerCase();
    expect(text).toContain('lead');
    expect(serviceMock.getArchivedLeadById).toHaveBeenCalled();
  });
});
