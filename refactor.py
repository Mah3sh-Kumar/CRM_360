import re

def main():
    with open('src/store/crm.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    custom_fetch_code = '''
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const customFetch = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('crm_token');
  const headers = new Headers(options?.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options?.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Replace hardcoded localhost API prefix with actual env API prefix
  let cleanUrl = url.replace('http://localhost:8000/api', API_BASE_URL);
  
  try {
    const res = await window.fetch(cleanUrl, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return res;
  } catch (e) {
    throw e;
  }
};
'''

    # Inject `customFetch` after the imports (line 6 usually)
    if 'customFetch =' not in content:
        content = content.replace("export type Role = 'Super Admin' | 'Company Admin' | 'Manager' | 'Employee';", custom_fetch_code + "\nexport type Role = 'Super Admin' | 'Company Admin' | 'Manager' | 'Employee';")

    # Replace fetch with customFetch, but be careful not to replace `window.fetch` or `customFetch` or `apiFetch`.
    # `fetch(` usually preceded by space or await or return.
    content = re.sub(r'(?<!window\.)(?<!custom)(?<!api)fetch\(', 'customFetch(', content)
    
    # Let's also fix Tracking.tsx and Dashboard.tsx to use customFetch or apiFetch directly.
    # Actually, Tracking.tsx can just use `fetch` and we can replace it there too, or we can just import `apiFetch`.
    
    with open('src/store/crm.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

    print("crm.tsx updated with customFetch.")

if __name__ == "__main__":
    main()
