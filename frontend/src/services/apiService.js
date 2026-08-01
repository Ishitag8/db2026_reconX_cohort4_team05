// TICKET-ADV112-related — fetch wrapper that attaches Bearer JWT from sessionStorage.
const BASE = '/api';

function authHeaders() {
  const token = sessionStorage.getItem('reconx-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
  };
  const options = {
    method,
    headers,
  };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    let errorText = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.message) errorText = errData.message;
    } catch {}
    throw new Error(errorText);
  }
  if (res.status === 204) {
    return null;
  }
  return await res.json();
}

export const api = {
  login: (email, password)   => request('POST', '/auth/login', { email, password }),
  listTrades: (params = '')  => request('GET', '/v1/trades' + params),
  createTrade: (req)         => request('POST', '/v1/trades', req),
  updateStatus: (id, status) => request('PATCH', `/v1/trades/${id}/status`, { status }),
  deleteTrade: (id)          => request('DELETE', `/v1/trades/${id}`),
  runRecon: (req)            => request('POST', '/v1/recon/run', req),
  reconResults: (jobId)      => request('GET', `/v1/recon/jobs/${jobId}/results`),
  audit: (tradeRef)          => request('GET', `/v1/audit/trades/${tradeRef}`),
};
