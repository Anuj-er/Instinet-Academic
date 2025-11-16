const request = require('supertest');
const app = require('../app');

describe('Basic app smoke tests', () => {
  it('GET /health -> 200 JSON', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET / -> 200 HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    // EJS renders HTML, so content-type should include text/html
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});