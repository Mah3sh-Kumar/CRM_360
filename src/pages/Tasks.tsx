import { useState, useEffect, useMemo } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, Mono, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import type { TaskStatus, TaskPriority } from '@/data/mock';
import { useCRM } from '@/store/crm';
import TaskModal from '@/components/TaskModal';
import ReassignTaskModal from '@/components/ReassignTaskModal';
import { Edit2, UserPlus, XCircle, Trash2, CheckCircle2 } from 'lucide-react';

const pTone = (p: TaskPriority): Tone => p === 'Critical' ? 'red' : p === 'High' ? 'amber' : p === 'Medium' ? 'blue' : 'gray';
const sTone = (s: TaskStatus): Tone => s === 'Completed' ? 'ink' : s === 'Cancelled' ? 'red' : s === 'In Progress' ? 'green' : 'sage';

export default function Tasks() {
  const { tasks, fetchTasks, completeTask, cancelTask, deleteTask, can, user, loading, error } = useCRM();
  const [f, setF] = useState('All');
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskIdToEdit, setTaskIdToEdit] = useState<string | undefined>(undefined);
  
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [taskIdToReassign, setTaskIdToReassign] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = () => {
    setTaskIdToEdit(undefined);
    setTaskModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setTaskIdToEdit(id);
    setTaskModalOpen(true);
  };

  const handleReassign = (id: string) => {
    setTaskIdToReassign(id);
    setReassignModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this task?')) {
      await cancelTask(id);
    }
  };

  const [search, setSearch] = useState('');
  const rows = useMemo(() => {
    let res = tasks.filter(t => f === 'All' || t.status === f);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(t => t.title.toLowerCase().includes(q) || t.related?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q));
    }
    return res;
  }, [tasks, f, search]);
  
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 26" title="Tasks"
        sub="Lifecycle: Open → In Progress → Completed (or Cancelled). Reassignment retains previous assignee in history and notifies the new one."
        action={can('CREATE', 'TASK') && <NewButton label="Create Task" onClick={handleCreate} />} />
      
      <Toolbar placeholder="Search tasks, assignee, related..." searchValue={search} onSearchChange={setSearch}>
        {['All', 'Open', 'In Progress', 'Completed', 'Cancelled'].map(s => (
          <span key={s} onClick={() => setF(s)}>
            <FilterChip label={s} active={f === s} />
          </span>
        ))}
      </Toolbar>
      
      {error.tasks ? (
        <ErrorState title="Failed to load tasks" message={error.tasks} onRetry={fetchTasks} />
      ) : (
        <DataTable<any>
          loading={loading.tasks}
          columns={[
            { header: 'Task', accessorKey: 'title', sortable: true, sortType: 'text', cell: (t) => <span className="font-medium">{t.title}</span> },
            { header: 'Linked To', accessorKey: 'related', sortable: true, sortType: 'text', cell: (t) => <Mono className="text-muted-foreground">{t.related}</Mono> },
            { header: 'Assignee', accessorKey: 'assignee', sortable: true, sortType: 'text' },
            { header: 'Priority', accessorKey: 'priority', sortable: true, sortType: 'text', cell: (t) => <StatusBadge label={t.priority as TaskPriority} tone={pTone(t.priority as TaskPriority)} /> },
            { header: 'Status', accessorKey: 'status', sortable: true, sortType: 'text', cell: (t) => <StatusBadge label={t.status as TaskStatus} tone={sTone(t.status as TaskStatus)} /> },
            { header: 'Due', accessorKey: 'due', sortable: true, sortType: 'date', cell: (t) => {
              const isClosed = t.status === 'Completed' || t.status === 'Cancelled';
              return <Mono className={!isClosed && t.due <= new Date().toISOString().split('T')[0] ? 'font-semibold text-destructive' : 'text-muted-foreground'}>{t.due.slice(5) || '—'}</Mono>;
            } },
            { header: 'Actions', sortable: false, cell: (t) => {
              const isClosed = t.status === 'Completed' || t.status === 'Cancelled';
              return (
                <div className="flex items-center gap-1.5">
                  {!isClosed && can('EDIT', 'TASK', t) && (
                    <button title="Edit" onClick={() => handleEdit(t.id)} className="text-muted-foreground hover:text-foreground">
                      <Edit2 className="size-3.5" />
                    </button>
                  )}
                  {!isClosed && can('EDIT', 'TASK', t) && user?.role !== 'Employee' && (
                    <button title="Reassign" onClick={() => handleReassign(t.id)} className="text-muted-foreground hover:text-foreground">
                      <UserPlus className="size-3.5" />
                    </button>
                  )}
                  {!isClosed && can('EDIT', 'TASK', t) && (
                    <button title="Complete" onClick={() => completeTask(t.id, "Completed")} className="text-muted-foreground hover:text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </button>
                  )}
                  {!isClosed && can('EDIT', 'TASK', t) && user?.role !== 'Employee' && (
                    <button title="Cancel" onClick={() => handleCancel(t.id)} className="text-muted-foreground hover:text-destructive">
                      <XCircle className="size-3.5" />
                    </button>
                  )}
                  {can('DELETE', 'TASK', t) && user?.role === 'Super Admin' && (
                    <button title="Delete" onClick={() => handleDelete(t.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  {isClosed && (
                    <Mono className="text-[10px] text-muted-foreground uppercase">{t.status}</Mono>
                  )}
                </div>
              );
            } },
          ]}
          data={rows}
          pagination
          defaultPageSize={10}
          emptyMessage="No tasks found."
        />
      )}

      <TaskModal 
        open={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        taskId={taskIdToEdit} 
      />
      
      <ReassignTaskModal 
        open={reassignModalOpen} 
        onClose={() => setReassignModalOpen(false)} 
        taskId={taskIdToReassign} 
      />
    </div>
  );
}
