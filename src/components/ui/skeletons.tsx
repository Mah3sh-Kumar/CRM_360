import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function SkeletonKPI({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card p-4 rounded-lg border border-border flex flex-col gap-2", className)}>
      <Skeleton className="h-3 w-1/2 bg-muted-foreground/20" />
      <Skeleton className="h-7 w-2/3 mt-2 bg-muted-foreground/20" />
      <Skeleton className="h-3 w-1/3 mt-2 bg-muted-foreground/20" />
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card p-4 rounded-lg border border-border", className)}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-3 w-1/4 bg-muted-foreground/20" />
        <Skeleton className="h-3 w-1/6 bg-muted-foreground/20" />
      </div>
      <Skeleton className="h-[190px] w-full bg-muted-foreground/20 rounded-md" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("rounded-md border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border p-3 flex gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-muted-foreground/20" />
        ))}
      </div>
      <div className="divide-y divide-border/50">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-3 flex gap-4 items-center">
             {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className={cn("h-3 bg-muted-foreground/20", j === 0 ? "w-1/4" : "flex-1")} />
             ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-lg border border-border bg-card space-y-3", className)}>
       <div className="flex justify-between">
          <Skeleton className="h-4 w-1/3 bg-muted-foreground/20" />
          <Skeleton className="h-4 w-1/6 bg-muted-foreground/20" />
       </div>
       <Skeleton className="h-3 w-1/4 bg-muted-foreground/20" />
       <div className="pt-2 flex justify-between items-center">
          <Skeleton className="h-8 w-24 bg-muted-foreground/20 rounded-md" />
       </div>
    </div>
  );
}

export function SkeletonList({ rows = 3, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
       <div className="border-b border-border px-4 py-3 flex justify-between items-center">
          <Skeleton className="h-3 w-1/3 bg-muted-foreground/20" />
       </div>
       {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
             <Skeleton className="size-8 rounded-full bg-muted-foreground/20" />
             <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3 bg-muted-foreground/20" />
                <Skeleton className="h-2 w-1/3 bg-muted-foreground/20" />
             </div>
          </div>
       ))}
    </div>
  );
}
