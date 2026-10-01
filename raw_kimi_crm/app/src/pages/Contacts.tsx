import { PageHeader, DataTable, StatusBadge, Toolbar, NewButton, ImportExport, Mono } from '@/components/shared';
import { contacts } from '@/data/mock';
import { Star, Paperclip, StickyNote } from 'lucide-react';

export default function Contacts() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 23" title="Contacts"
        sub="People linked to accounts. Duplicate detection on email + mobile. Notes and attachments (PDF/DOCX/XLSX/JPG/PNG, max 10 MB) supported."
        action={<><ImportExport /><NewButton label="Create Contact" /></>} />
      <Toolbar placeholder="Search contacts, accounts…" />
      <DataTable
        head={['Contact', 'Title', 'Account', 'Email', 'Phone', 'Flags']}
        rows={contacts.map(c => [
          <span className="flex items-center gap-2 font-medium">{c.name}{c.primary && <Star className="size-3.5 fill-[#007f24] text-[#007f24]" />}</span>,
          <span className="text-muted-foreground">{c.title}</span>,
          c.account,
          <Mono className="text-muted-foreground">{c.email}</Mono>,
          <Mono className="text-muted-foreground">{c.phone}</Mono>,
          <span className="flex gap-1.5">
            <StatusBadge label="2 notes" tone="sage" />
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-[2px] font-mono2 text-[10px] text-muted-foreground"><Paperclip className="size-3" />1</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-[2px] font-mono2 text-[10px] text-muted-foreground"><StickyNote className="size-3" />2</span>
          </span>,
        ])}
      />
    </div>
  );
}
