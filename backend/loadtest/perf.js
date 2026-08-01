import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  iterations: 100,
  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const TOKEN = __ENV.TOKEN;

export function setup() {
  if (!TOKEN) {
    throw new Error('TOKEN environment variable is required');
  }
  return { token: TOKEN };
}

export default function (data) {
  const tradeRef = `PERF-${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    tradeRef,
    instrumentId: 1,
    counterpartyId: 1,
    assetClass: 'EQUITY',
    side: 'BUY',
    quantity: 100.0,
    price: 245.5,
    tradeDate: '2026-06-02'
  });

  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };

  const res = http.post(`${BASE_URL}/api/v1/trades`, payload, { headers });
  check(res, {
    'status is 201': (r) => r.status === 201
  });
}
