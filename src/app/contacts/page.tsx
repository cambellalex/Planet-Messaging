'use client';

/**
 * Address Book — contact management.
 * Data: GET /api/contacts  POST /api/contacts  DELETE /api/contacts/:id
 */

import { useState } from 'react';
import NavBar from '@/components/nav/NavBar';
import { Search, Plus, Phone, Mail, Trash2, Send } from 'lucide-react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tags: string[];
}

const mockContacts: Contact[] = [
  { id: '1', name: 'Alice Martin', phone: '+1 555 234 5678', email: 'alice@acme.com', tags: ['customer', 'vip'] },
  { id: '2', name: 'Bob Chen', phone: '+44 7700 900 456', email: 'bob@globex.com', tags: ['lead'] },
  { id: '3', name: 'Carol Williams', phone: '+61 400 123 456', tags: ['customer'] },
  { id: '4', name: 'David Park', email: 'david@initech.com', tags: ['partner'] },
  { id: '5', name: 'Eva Rossi', phone: '+39 02 1234 5678', email: 'eva@rossicorp.it', tags: ['customer'] },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const visible = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function addContact(e: React.FormEvent) {
    e.preventDefault();
    const c: Contact = { id: Date.now().toString(), name: newName, phone: newPhone || undefined, email: newEmail || undefined, tags: [] };
    setContacts([c, ...contacts]);
    setNewName(''); setNewPhone(''); setNewEmail('');
    setShowAddForm(false);
    // TODO: POST /api/contacts
  }

  function deleteContact(id: string) {
    setContacts(contacts.filter((c) => c.id !== id));
    // TODO: DELETE /api/contacts/:id
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-4xl mx-auto w-full px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Address Book</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" /> Add contact
          </button>
        </div>

        {/* Add contact form */}
        {showAddForm && (
          <form
            onSubmit={addContact}
            className="mb-6 p-5 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--accent)' }}
          >
            <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name *"
              className="px-4 py-2 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone (E.164)"
              className="px-4 py-2 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email"
              className="px-4 py-2 rounded-xl border text-sm outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-sm font-medium hover:opacity-90"
                style={{ background: 'var(--accent)', color: '#fff' }}>Save</button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
          <input
            type="search"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{visible.length} contact{visible.length !== 1 ? 's' : ''}</p>

        <div className="flex flex-col gap-2">
          {visible.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)' }}>
                {c.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{c.name}</p>
                <div className="flex flex-wrap gap-3 mt-0.5">
                  {c.phone && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                      <Phone className="w-3 h-3" />{c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                      <Mail className="w-3 h-3" />{c.email}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {c.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--muted)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/send?to=${encodeURIComponent(c.phone ?? c.email ?? '')}`}
                  className="p-2 rounded-lg hover:opacity-70 transition-all"
                  title="Send message"
                  style={{ color: 'var(--accent)' }}
                >
                  <Send className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => deleteContact(c.id)}
                  className="p-2 rounded-lg hover:opacity-70 transition-all"
                  title="Delete contact"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
