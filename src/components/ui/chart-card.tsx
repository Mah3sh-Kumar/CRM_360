import type { ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { SkeletonChart } from '@/components/shared';

export interface ChartCardProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void;
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  description,
  isLoading,
  error,
  onRefresh,
  onExport,
  children,
  empty,
  emptyMessage = "No data available",
}: ChartCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm h-full">
      <div className="flex items-start justify-between border-b border-border/50 px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onExport && (
            <div className="flex items-center bg-muted/50 rounded-md border border-border/50 p-0.5">
              <button
                onClick={() => onExport('csv')}
                className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-sm transition-colors"
                title="Export CSV"
              >
                CSV
              </button>
              <button
                onClick={() => onExport('xlsx')}
                className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-sm transition-colors"
                title="Export Excel"
              >
                XLSX
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-5 min-h-[250px] flex flex-col justify-center">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <SkeletonChart className="w-full h-[220px] border-0" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-6 h-full">
            <AlertCircle className="size-8 text-destructive/80 mb-3" />
            <h4 className="text-sm font-medium text-foreground">Unable to load report</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-4 px-4 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center text-center p-6 h-full text-muted-foreground">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <AlertCircle className="size-5 opacity-50" />
            </div>
            <p className="text-sm font-medium">{emptyMessage}</p>
            <p className="text-xs mt-1">Try changing the selected date range or filters.</p>
          </div>
        ) : (
          <div className="w-full h-full min-h-[250px]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--neutral))',
  info: 'hsl(var(--info))',
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
};

// Reusable color array for categorical charts
export const CATEGORICAL_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.chart2,
  CHART_COLORS.chart3,
  CHART_COLORS.chart4,
  CHART_COLORS.chart5,
];

export const STATUS_COLORS: Record<string, string> = {
  'Completed': CHART_COLORS.success,
  'Won': CHART_COLORS.success,
  'Active': CHART_COLORS.success,
  
  'Pending': CHART_COLORS.warning,
  'Open': CHART_COLORS.warning,
  'In Progress': CHART_COLORS.warning,
  
  'Lost': CHART_COLORS.danger,
  'Overdue': CHART_COLORS.danger,
  'Cancelled': CHART_COLORS.neutral,
  
  'Scheduled': CHART_COLORS.info,
  'New': CHART_COLORS.info,
};

export const getStatusColor = (status: string) => STATUS_COLORS[status] || CHART_COLORS.neutral;
