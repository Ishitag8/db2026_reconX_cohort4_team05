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
    if (res.status === 401) {
      sessionStorage.removeItem('reconx-token');
      sessionStorage.removeItem('reconx-role');
      sessionStorage.setItem('reconx-auth-message', 'Session expired. Please log in again.');
      window.location.href = '/login';
    }

    let detail = '';
    const clone = res.clone();

    try {
      const err = await res.json();
      const title = err.title ? `${err.title}: ` : '';
      detail =
        (title + (err.detail || err.message || err.error || '')) ||
        JSON.stringify(err);
    } catch {
      detail = await clone.text();
    }

    throw new Error(`Error ${res.status}: ${detail}`);
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
  searchTrade: (tradeRef)    => request('GET', `/v1/trades/search?tradeRef=` + encodeURIComponent(tradeRef)),
  getStats: ()               => request('GET', '/v1/trades/stats'),
};
