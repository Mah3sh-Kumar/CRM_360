export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function getApiUrl(path: string): string {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = cleanPath.replace(/\/+/g, '/');
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(path);
  const token = localStorage.getItem('crm_token');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
     headers.set('Content-Type', 'application/json');
  }
  
  let res;
  try {
      res = await fetch(url, { ...options, headers });
  } catch (err) {
      throw { detail: "Network error. Is the backend running?" };
  }
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {}
    
    if (res.status === 403) {
      throw { detail: errorData.detail || "Access Denied: You do not have permission to perform this action.", status: 403 };
    }
    
    throw { detail: errorData.detail || errorData.message || `API Error: ${res.status}`, status: res.status, validation: errorData };
  }
  
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
