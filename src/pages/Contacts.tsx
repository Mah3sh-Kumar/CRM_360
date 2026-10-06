import { PageHeader, DataTable, StatusBadge, Toolbar, NewButton, ImportExport, Mono, ErrorState } from '@/components/shared';
import { Star, Paperclip, StickyNote } from 'lucide-react';
import { useState, useMemo } from 'react';
import ContactModal from '@/components/ContactModal';
import { useCRM } from '@/store/crm';
import type { Contact } from '@/data/mock';

export default function Contacts() {
  const [showModal, setShowModal] = useState(false);
  const { contacts, loading, error, fetchContacts } = useCRM();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let result = contacts;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.account?.toLowerCase().includes(q) || 
        c.email?.toLowerCase().includes(q) || 
        c.phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contacts, search]);

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 23" title="Contacts"
        sub="People linked to accounts. Duplicate detection on email + mobile. Notes and attachments (PDF/DOCX/XLSX/JPG/PNG, max 10 MB) supported."
        action={<><ImportExport /><NewButton label="Create Contact" onClick={() => setShowModal(true)} /></>} />
      <Toolbar placeholder="Search contacts, accounts, email..." searchValue={search} onSearchChange={setSearch} />
      {error.contacts ? (
        <ErrorState title="Failed to load contacts" message={error.contacts} onRetry={fetchContacts} />
      ) : (
        <DataTable<Contact>
          loading={loading.contacts}
          columns={[
            { header: 'Contact', accessorKey: 'name', sortable: true, sortType: 'text', cell: (c) => <span className="flex items-center gap-2 font-medium">{c.name}{(c as any).primary && <Star className="size-3.5 fill-primary text-primary" />}</span> },
            { header: 'Title', accessorKey: 'title', sortable: true, sortType: 'text', cell: (c) => <span className="text-muted-foreground">{c.title}</span> },
            { header: 'Account', accessorKey: 'account', sortable: true, sortType: 'text' },
            { header: 'Email', accessorKey: 'email', sortable: true, sortType: 'text', cell: (c) => <Mono className="text-muted-foreground">{c.email}</Mono> },
            { header: 'Phone', accessorKey: 'phone', sortable: true, sortType: 'text', cell: (c) => <Mono className="text-muted-foreground">{c.phone}</Mono> },
            { header: 'Flags', accessorKey: 'name', sortable: false, cell: () => (
              <span className="flex gap-1.5">
                <StatusBadge label="2 notes" tone="sage" />
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-[2px] font-mono2 text-[10px] text-muted-foreground"><Paperclip className="size-3" />1</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-[2px] font-mono2 text-[10px] text-muted-foreground"><StickyNote className="size-3" />2</span>
              </span>
            )},
          ]}
          data={rows}
          pagination
          defaultPageSize={10}
          emptyMessage="No contacts found."
        />
      )}
      <ContactModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

