import { PageHeader, DataTable, StatusBadge, Toolbar, NewButton, ImportExport, Mono, ErrorState } from '@/components/shared';
import { Star, Paperclip, StickyNote } from 'lucide-react';
import { useState } from 'react';
import ContactModal from '@/components/ContactModal';
import { useCRM } from '@/store/crm';

export default function Contacts() {
  const [showModal, setShowModal] = useState(false);
  const { contacts, loading, error, fetchContacts } = useCRM();
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 23" title="Contacts"
        sub="People linked to accounts. Duplicate detection on email + mobile. Notes and attachments (PDF/DOCX/XLSX/JPG/PNG, max 10 MB) supported."
        action={<><ImportExport /><NewButton label="Create Contact" onClick={() => setShowModal(true)} /></>} />
      <Toolbar placeholder="Search contacts, accounts…" />
      {error.contacts ? (
        <ErrorState title="Failed to load contacts" message={error.contacts} onRetry={fetchContacts} />
      ) : (
        <DataTable
          loading={loading.contacts}
          head={['Contact', 'Title', 'Account', 'Email', 'Phone', 'Flags']}
          rows={contacts.map(c => [
            <span className="flex items-center gap-2 font-medium">{c.name}{(c as any).primary && <Star className="size-3.5 fill-primary text-primary" />}</span>,
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
      )}
      <ContactModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
