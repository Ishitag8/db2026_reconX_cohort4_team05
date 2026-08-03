// // TICKET-ADV112-related — fetch wrapper that attaches Bearer JWT from sessionStorage.
// const BASE = '/api';

// function authHeaders() {
//   // TODO(TICKET-ADV112): read 'reconx-token' from sessionStorage and return
//   //                     { Authorization: `Bearer <token>` }. Return {} when
//   //                     no token is set (login + signup endpoints).
//   return {};
// }

// async function request(method, path, body) {
//   // TODO(TICKET-ADV112): fetch(`${BASE}${path}`, { method, headers, body }).
//   //   - headers must include Content-Type: application/json and ...authHeaders()
//   //   - serialise `body` via JSON.stringify when present
//   //   - on !res.ok throw new Error(`HTTP ${res.status}: ${detail}`)
//   //   - status 204 -> return null, otherwise return await res.json()
//   throw new Error('TICKET-ADV112 not implemented');
// }

// export const api = {
//   login: (email, password)   => {
//     // TODO(TICKET-ADV072): POST /auth/login with { email, password }.
//     throw new Error('TICKET-ADV072 not implemented');
//   },
//   listTrades: (params = '')  => {
//     // TODO(TICKET-ADV114): GET /v1/trades + `params` query string.
//     throw new Error('TICKET-ADV114 not implemented');
//   },
//   createTrade: (req)         => {
//     // TODO(TICKET-ADV123): POST /v1/trades with the form payload.
//     throw new Error('TICKET-ADV123 not implemented');
//   },
//   updateStatus: (id, status) => {
//     // TODO(TICKET-ADV119): PATCH /v1/trades/{id}/status with { status }.
//     throw new Error('TICKET-ADV119 not implemented');
//   },
//   deleteTrade: (id)          => {
//     // TODO(TICKET-ADV119): DELETE /v1/trades/{id}.
//     throw new Error('TICKET-ADV119 not implemented');
//   },
//   runRecon: (req)            => {
//     // TODO(TICKET-ADV121): POST /v1/recon/run to enqueue a recon job.
//     throw new Error('TICKET-ADV121 not implemented');
//   },
//   reconResults: (jobId)      => {
//     // TODO(TICKET-ADV121): GET /v1/recon/jobs/{jobId}/results.
//     throw new Error('TICKET-ADV121 not implemented');
//   },
//   audit: (tradeRef)          => {
//     // TODO(TICKET-ADV121): GET /v1/audit/trades/{tradeRef}.
//     throw new Error('TICKET-ADV121 not implemented');
//   },
// };
// TICKET-ADV112 — Fetch wrapper + JWT auth

const BASE = '/api';

function authHeaders() {
  const token = sessionStorage.getItem('reconx-token');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = '';

    try {
      const err = await res.json();
      detail =
        err.detail ||
        err.message ||
        err.error ||
        JSON.stringify(err);
    } catch {
      detail = await res.text();
    }

    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  login: async (email, password) => {
    const result = await request('POST', '/auth/login', {
      email,
      password,
    });

    if (result.token) {
      sessionStorage.setItem('reconx-token', result.token);
    }

    return result;
  },

  listTrades: (params = '') =>
    request('GET', `/v1/trades${params}`),

  createTrade: (req) =>
    request('POST', '/v1/trades', req),

  updateStatus: (id, status) =>
    request('PATCH', `/v1/trades/${id}/status`, {
      status,
    }),

  deleteTrade: (id) =>
    request('DELETE', `/v1/trades/${id}`),

  runRecon: (req) =>
    request('POST', '/v1/recon/run', req),

  reconResults: (jobId) =>
    request('GET', `/v1/recon/jobs/${jobId}/results`),

  audit: (tradeRef) =>
    request('GET', `/v1/audit/trades/${tradeRef}`),
};