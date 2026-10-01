export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('h-8 rounded-md border px-3 text-[12px] font-medium transition-colors',
      active ? 'border-[#09352e] bg-[#09352e] text-white' : 'border-input bg-card text-muted-foreground hover:text-foreground')}>
      {label}
    </button>
  );
}
