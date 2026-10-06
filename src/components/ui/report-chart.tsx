import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { CATEGORICAL_COLORS, getStatusColor } from './chart-card';

interface ReportChartProps {
  columns: string[];
  data: any[];
}

export function ReportChart({ columns, data }: ReportChartProps) {
  const chartConfig = useMemo(() => {
    if (!data || data.length === 0 || columns.length < 2) return null;

    // Detect categorical column (usually the first column)
    const catCol = columns[0];
    
    // Detect numerical columns
    const numCols = columns.slice(1).filter(col => 
      data.some(row => typeof row[col] === 'number' || !isNaN(Number(row[col])))
    );

    if (numCols.length === 0) return null;

    // Check if it's time series
    const isTimeSeries = catCol.toLowerCase().includes('date') || 
                         (data.length > 0 && typeof data[0][catCol] === 'string' && !isNaN(Date.parse(data[0][catCol])));

    return {
      catCol,
      numCols,
      isTimeSeries
    };
  }, [columns, data]);

  if (!chartConfig) return null;

  const { catCol, numCols, isTimeSeries } = chartConfig;

  // Format data for chart
  const chartData = data.map(row => {
    const newRow: any = { ...row };
    // Shorten long labels
    if (typeof row[catCol] === 'string' && row[catCol].length > 15 && !isTimeSeries) {
      newRow[catCol] = row[catCol].substring(0, 15) + '...';
    }
    // Parse numbers
    numCols.forEach(col => {
      newRow[col] = Number(row[col]) || 0;
    });
    return newRow;
  });

  const isPie = numCols.length === 1 && !isTimeSeries && chartData.length <= 8;

  return (
    <div className="h-[300px] w-full mb-6">
      <ResponsiveContainer width="100%" height="100%">
        {isTimeSeries ? (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={catCol} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
              labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            {numCols.map((col, i) => (
              <Line key={col} type="monotone" dataKey={col} stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        ) : isPie ? (
          <PieChart>
            <Pie data={chartData} dataKey={numCols[0]} nameKey={catCol} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={catCol.toLowerCase().includes('status') ? getStatusColor(entry[catCol]) : CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={catCol} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} 
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            {numCols.map((col, i) => (
              <Bar key={col} dataKey={col} radius={[4, 4, 0, 0]} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]}>
                {numCols.length === 1 && chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={catCol.toLowerCase().includes('status') ? getStatusColor(entry[catCol]) : CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
