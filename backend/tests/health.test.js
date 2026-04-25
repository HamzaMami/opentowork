import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';

describe('Health endpoints', () => {
  it('returns ok from /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('status', 'ok');
    expect(response.body).to.have.property('mongodb');
  });

  it('returns metrics from /metrics', async () => {
    const response = await request(app).get('/metrics');

    expect(response.status).to.equal(200);
    expect(response.headers['content-type']).to.include('text/plain');
    expect(response.text).to.include('nodejs_');
  });
});