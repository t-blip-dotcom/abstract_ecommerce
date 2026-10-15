
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
    error.data = data; 
    throw error;
  }
  return data;
}

const api = {
  baseUrl: `${window.location.protocol}//${window.location.host}/api`,

  assetUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//.test(path)) return path;
    return `${this.baseUrl.replace(/\/api$/, '')}${path}`;
  },

  async get(path) {
     const res = await fetch(`${this.baseUrl}${path}`, { 
        credentials: 'include',
        headers: {
         'ngrok-skip-browser-warning': 'true' // <--- Add this header
       }
      });
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