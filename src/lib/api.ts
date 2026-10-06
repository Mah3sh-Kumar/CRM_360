export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function getApiUrl(path: string): string {
  // Ensure we don't have double slashes
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Replace multiple slashes inside the path (e.g. /reports//leads -> /reports/leads)
  const normalizedPath = cleanPath.replace(/\/+/g, '/');
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(path);
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.detail || `API Error: ${res.status}`);
  }
  
  // Try to parse json, if empty return empty object or text
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
