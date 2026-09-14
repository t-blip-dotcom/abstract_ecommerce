/**
 * api.js
 * Single place that knows how to talk to the backend.
 * Every other module calls `api.get(...)` / `api.post(...)` instead
 * of using fetch() directly, so the base URL only lives in one spot.
 *
 * NOTE: the backend isn't built yet, so USE_MOCK_DATA is on.
 * Once the Express API is up, set it to false and these calls
 * will hit the real endpoints below.
 */

const api = {
  baseUrl: 'http://localhost:3000/api',
  useMockData: true,

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  },

  async patch(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  }
};
