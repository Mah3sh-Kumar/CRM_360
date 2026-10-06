// src/pages/Reports.tsx
import { useState, useEffect } from 'react';
import { PageHeader, DataTable, ErrorState, LoadingState, EmptyState, ChartCard, ReportChart } from '@/components/shared';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reportsApi } from '@/services/api/reports';

type Cat = 'Leads' | 'Customers' | 'Opportunities' | 'Activities' | 'Tasks' | 'Meetings' | 'Visits' | 'Attendance' | 'Geo';
const CATS: Cat[] = ['Leads', 'Customers', 'Opportunities', 'Activities', 'Tasks', 'Meetings', 'Visits', 'Attendance', 'Geo'];

const REPORTS: Record<Cat, { name: string; path: string }[]> = {
  Leads: [
    { name: 'Lead Summary', path: '/leads/summary' },
    { name: 'Lead Source Analysis', path: '/leads/source-analysis' },
    { name: 'Lead Conversion', path: '/leads/conversion' },
    { name: 'Lost Lead Analysis', path: '/leads/lost-analysis' },
    { name: 'Employee Lead Performance', path: '/leads/employee-performance' },
  ],
  Customers: [
    { name: 'Customer Directory', path: '/customers/directory' },
    { name: 'Customer Ownership', path: '/customers/ownership' },
    { name: 'Customer Status', path: '/customers/status' },
    { name: 'Customer Industry Analysis', path: '/customers/industry-analysis' },
  ],
  Opportunities: [
    { name: 'Opportunity Pipeline', path: '/opportunities/pipeline' },
    { name: 'Revenue Forecast', path: '/opportunities/revenue-forecast' },
    { name: 'Won Opportunity', path: '/opportunities/won' },
    { name: 'Lost Opportunity', path: '/opportunities/lost' },
    { name: 'Opportunity Aging', path: '/opportunities/aging' },
  ],
  Activities: [
    { name: 'Activity Summary', path: '/activities/summary' },
    { name: 'Employee Activity', path: '/activities/employee' },
    { name: 'Customer Interaction', path: '/activities/customer-interaction' },
    { name: 'Pending Activity', path: '/activities/pending' },
  ],
  Tasks: [
    { name: 'Task Summary', path: '/tasks/summary' },
    { name: 'Pending Task', path: '/tasks/pending' },
    { name: 'Overdue Task', path: '/tasks/overdue' },
    { name: 'Task Completion', path: '/tasks/completion' },
  ],
  Meetings: [
    { name: 'Meeting Summary', path: '/meetings/summary' },
    { name: 'Customer Meeting', path: '/meetings/customer' },
    { name: 'Employee Meeting', path: '/meetings/employee' },
    { name: 'Meeting Outcome', path: '/meetings/outcome' },
  ],
  Visits: [
    { name: 'Daily Visit', path: '/visits/daily' },
    { name: 'Customer Visit', path: '/visits/customer' },
    { name: 'Employee Visit', path: '/visits/employee' },
    { name: 'Visit Outcome', path: '/visits/outcome' },
  ],
  Attendance: [
    { name: 'Daily Attendance', path: '/attendance/daily' },
    { name: 'Working Hours', path: '/attendance/working-hours' },
    { name: 'Monthly Attendance', path: '/attendance/monthly' },
  ],
  Geo: [
    { name: 'Geo Tracking', path: '/geo/tracking' },
  ]
};

export default function Reports() {
  const [cat, setCat] = useState<Cat>('Leads');
  const [active, setActive] = useState<{ name: string; path: string } | null>(null);
  const [apiData, setApiData] = useState<{ head: string[]; rows: React.ReactNode[][]; rawData: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      setApiData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Remove leading slash to prevent double slash in API URL
    const cleanPath = active.path.replace(/^\/+/, '');
    reportsApi.fetchReport(cleanPath)
      .then(res => {
        if (res && res.columns) {
          setApiData({
            head: res.columns,
            rows: res.data.map(row => res.columns.map(c => <span className="font-medium text-[13px]">{String(row[c] ?? '—')}</span>)),
            rawData: res.data
          });
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load report data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [active]);

  const handleDownload = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!active) return;
    try {
      const cleanPath = active.path.replace(/^\/+/, '');
      const url = reportsApi.getDownloadUrl(cleanPath, format);
      const token = localStorage.getItem('crm_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `${active.name.replace(/\\s+/g, '_')}.${format}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download report.');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader kicker="Reports" title="Reports & Analytics" />

      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
        {/* Categories Sidebar */}
        <div className="w-full shrink-0 flex flex-col gap-1 md:w-64 md:border-r md:pr-6 md:h-[calc(100vh-140px)] md:sticky md:top-0 md:overflow-y-auto">
          {CATS.map(c => (
            <div key={c} className="mb-4">
              <button
                onClick={() => setCat(c)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  cat === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {c}
              </button>
              {cat === c && (
                <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-muted pl-2">
                  {REPORTS[c].map(r => (
                    <button
                      key={r.name}
                      onClick={() => setActive(r)}
                      className={cn(
                        "text-left px-3 py-1.5 rounded-md text-[13px] transition-colors",
                        active?.name === r.name ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Report Content */}
        <div className="flex-1 min-w-0">
          {!active ? (
            <div className="h-64 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
              Select a report from the sidebar to view data.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{active.name}</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => handleDownload('csv')} className="h-8 px-3 inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Download className="size-3.5" /> CSV
                  </button>
                  <button onClick={() => handleDownload('xlsx')} className="h-8 px-3 inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                    <Download className="size-3.5" /> XLSX
                  </button>
                  <button onClick={() => handleDownload('pdf')} className="h-8 px-3 inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Download className="size-3.5" /> PDF
                  </button>
                </div>
              </div>

              {loading ? (
                <LoadingState message="Loading report data..." />
              ) : error ? (
                <ErrorState title="Report Error" message={error} />
              ) : apiData && apiData.rows.length > 0 ? (
                <div className="space-y-4">
                  {apiData.head?.length >= 2 && apiData.rawData.length > 0 && (
                    <ChartCard 
                      title={`${active.name} - Visualization`} 
                      onExport={() => handleDownload('pdf')}
                    >
                      <ReportChart columns={apiData.head} data={apiData.rawData} />
                    </ChartCard>
                  )}
                  <div className="rounded-lg border shadow-sm overflow-hidden bg-background">
                    <DataTable
                      head={apiData.head}
                      rows={apiData.rows}
                    />
                  </div>
                </div>
              ) : (
                <EmptyState title="No Data" description="No data found for this report." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
