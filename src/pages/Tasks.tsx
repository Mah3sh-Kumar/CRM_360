import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { tasks } from '@/data/mock';
import type { TaskStatus, TaskPriority } from '@/data/mock';

const pTone = (p: TaskPriority): Tone => p === 'Critical' ? 'red' : p === 'High' ? 'amber' : p === 'Medium' ? 'blue' : 'gray';
const sTone = (s: TaskStatus): Tone => s === 'Completed' ? 'ink' : s === 'Cancelled' ? 'red' : s === 'In Progress' ? 'green' : 'sage';

export default function Tasks() {
  const [f, setF] = useState('All');
  const rows = tasks.filter(t => f === 'All' || t.status === f);
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 26" title="Tasks"
        sub="Lifecycle: Open → In Progress → Completed (or Cancelled). Reassignment retains previous assignee in history and notifies the new one."
        action={<NewButton label="Create Task" />} />
      <Toolbar placeholder="Search tasks…">
        {['All', 'Open', 'In Progress', 'Completed', 'Cancelled'].map(s => <span key={s} onClick={() => setF(s)}><FilterChip label={s} active={f === s} /></span>)}
      </Toolbar>
      <DataTable
        head={['Task', 'Linked To', 'Assignee', 'Priority', 'Status', 'Due', 'Action']}
        rows={rows.map(t => [
          <span className="font-medium">{t.title}</span>,
          <Mono className="text-muted-foreground">{t.related}</Mono>,
          t.assignee,
          <StatusBadge label={t.priority} tone={pTone(t.priority)} />,
          <StatusBadge label={t.status} tone={sTone(t.status)} />,
          <Mono className={t.status !== 'Completed' && t.due <= '2026-10-02' ? 'font-semibold text-[#b03a26]' : 'text-muted-foreground'}>{t.due.slice(5)}</Mono>,
          t.status === 'Completed'
            ? <Mono className="text-muted-foreground">done</Mono>
            : <button className="rounded-md border border-input px-2 py-1 font-mono2 text-[10px] font-medium hover:border-[#007f24] hover:text-[#007f24] transition-colors">MARK COMPLETE</button>,
        ])}
      />
    </div>
  );
}
