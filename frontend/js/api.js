/**
 * api.js
 * Single place that knows how to talk to the backend. Every other
 * module calls api.get/post/patch/delete/postForm/patchForm instead
 * of using fetch() directly, so the base URL only lives in one spot.
 *
 * `credentials: 'include'` on every call is what makes the browser
 * send/receive the httpOnly auth cookie the backend sets on login —
 * without it, every request would look logged-out.
 */

class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || null; // { fieldName: "message" } from express-validator
  }
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function handleResponse(res) {
  const data = await parseJsonSafely(res);
  if (!res.ok) {
    const error = new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.errors);
    error.data = data; // full body — e.g. checkout's { shortages: [...] } on a 409
    throw error;
  }
  return data;
}

const api = {
  baseUrl: `${window.location.protocol}//${window.location.hostname}:3000/api`,

  /** Uploaded photos are stored as "/uploads/xyz.png" — that path lives on the
   *  backend (:3000), not on the page's own origin, so prefix it here. */
  assetUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//.test(path)) return path;
    return `${this.baseUrl.replace(/\/api$/, '')}${path}`;
  },

  async get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async patch(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  async delete(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  /** For endpoints that accept a photo/logo file — pass a FormData object.
   *  No Content-Type header here on purpose: the browser sets the right
   *  multipart boundary itself when you let it. */
  async postForm(path, formData) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  },

  async patchForm(path, formData) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData
    });
    return handleResponse(res);
  }
};

window.api = api;
window.ApiError = ApiError;