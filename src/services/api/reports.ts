const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetcher<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  employee_id?: number;
  company_id?: number;
  status?: string;
}

export interface ReportResponse {
  title: string;
  columns: string[];
  data: Record<string, any>[];
}

const buildQueryString = (filters?: ReportFilter, format: string = 'json') => {
  const params = new URLSearchParams();
  params.append('format', format);
  if (filters) {
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters.company_id) params.append('company_id', filters.company_id.toString());
    if (filters.status) params.append('status', filters.status);
  }
  return params.toString();
};

export const reportsApi = {
  fetchReport: (path: string, filters?: ReportFilter) => 
    fetcher<ReportResponse>(`/reports/${path}?${buildQueryString(filters)}`),

  getDownloadUrl: (endpoint: string, format: 'csv' | 'xlsx' | 'pdf', filters?: ReportFilter) => {
    return `${API_URL}/reports/${endpoint}?${buildQueryString(filters, format)}`;
  }
};
