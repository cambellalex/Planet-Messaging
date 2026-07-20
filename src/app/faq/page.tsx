'use client';

import { useState } from 'react';
import NavBar from '@/components/nav/NavBar';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

const FAQS: { section: string; items: FAQItem[] }[] = [
  {
    section: 'Getting started',
    items: [
      {
        q: 'What is Planet Messaging?',
        a: 'Planet Messaging is a multi-channel business messaging platform. You can send SMS, WhatsApp, RCS, and email messages to your contacts, run campaigns, and track delivery and spend — all from one place.',
      },
      {
        q: 'Which messaging channels are supported?',
        a: 'SMS, WhatsApp, RCS (Rich Communication Services), and Email. Connect your own Twilio account under Channels to activate each one.',
      },
      {
        q: 'How do I connect a channel?',
        a: 'Go to Channels in the navigation, click "Add channel", choose the channel type, and enter your Twilio credentials. Once connected the channel status turns green and you can start sending.',
      },
    ],
  },
  {
    section: 'Contacts & groups',
    items: [
      {
        q: 'How do I import contacts?',
        a: 'On the Contacts page click "Upload Contacts". You can upload a CSV or Excel file, or paste data directly. Each import is tagged with a Group Name so you can filter and target groups later. The limit is 2,000 contacts per upload.',
      },
      {
        q: 'What format should my CSV be in?',
        a: (
          <>
            At minimum your file should have a <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>name</code> column. Optional columns: <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>phone</code>, <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>email</code>, <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--background)' }}>tags</code> (comma-separated). Any extra columns are saved as custom fields.
          </>
        ),
      },
      {
        q: 'What phone number format is required?',
        a: 'Numbers must be in E.164 format — for example +447911123456 for a UK mobile. If you upload numbers starting with 07, Planet Messaging will offer to convert them to +44 automatically.',
      },
      {
        q: 'What is a Group Name?',
        a: 'A Group Name tags every contact in a bulk upload so you can identify where they came from (e.g. "Trade Show June 2026", "Newsletter subscribers"). You can filter contacts by group and send campaigns to specific groups.',
      },
    ],
  },
  {
    section: 'Sending & campaigns',
    items: [
      {
        q: 'What is a campaign?',
        a: 'A campaign is a bulk send to one or more recipients — individual contacts, groups, or a list you upload at send time. Every campaign is tracked in Reports so you can see send counts, delivery rates, and spend.',
      },
      {
        q: 'Can I send to a mix of contacts and groups?',
        a: 'Yes. On the Send page use the Contacts tab to pick individuals, the Groups tab to pick whole groups, or the Upload tab to bring in a one-off list. Your selections accumulate and duplicates are automatically removed before sending.',
      },
      {
        q: 'How are SMS messages counted?',
        a: 'SMS messages are split into segments of up to 160 characters. A 300-character message uses 2 segments. Cost is charged per segment, so longer messages cost proportionally more.',
      },
    ],
  },
  {
    section: 'Reports & spend',
    items: [
      {
        q: 'How is spend calculated?',
        a: 'Each outbound message is costed based on its channel and length. Rates are set in Settings. The default rates include a 12% markup on standard Twilio UK pricing. You can adjust rates to match your own Twilio plan.',
      },
      {
        q: 'Can I filter reports by campaign?',
        a: 'Yes. The campaign dropdown at the top of the Reports page filters all charts — daily sends, delivery breakdown, network distribution, and monthly spend — to a single campaign.',
      },
      {
        q: 'Can I export report data?',
        a: 'Every chart has a CSV and Excel export button. The files include the raw data behind the chart so you can analyse it further in a spreadsheet.',
      },
      {
        q: 'Why does the monthly spend chart show £0 even though I have sent messages?',
        a: 'Only outbound messages that are not in a "failed" status are included in spend calculations. Check that your channel is connected and messages are reaching "sent" or "delivered" status.',
      },
    ],
  },
  {
    section: 'Account & billing',
    items: [
      {
        q: 'How do I change the currency for spend reports?',
        a: 'Go to Settings and choose a currency from the dropdown. All spend figures in Reports will update to use the selected currency.',
      },
      {
        q: 'Where can I see my invoice history?',
        a: 'Invoice history and subscription management are available on the Billing page.',
      },
      {
        q: 'How do I upgrade my plan?',
        a: 'Visit the Billing page to see available plans and upgrade options.',
      },
    ],
  },
];

function FAQItem({ q, a }: FAQItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <button
        type="button"
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:opacity-80 transition-opacity"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />}
      </button>
      {open && (
        <p className="text-sm pb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar variant="app" />

      <main className="max-w-2xl mx-auto w-full px-4 pt-24 pb-12">
        <h1 className="text-2xl font-bold mb-2">Frequently asked questions</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
          Can&apos;t find what you&apos;re looking for? Contact us and we&apos;ll be happy to help.
        </p>

        <div className="flex flex-col gap-8">
          {FAQS.map((section) => (
            <div key={section.section}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                {section.section}
              </h2>
              <div
                className="rounded-2xl border px-5"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                {section.items.map((item) => (
                  <FAQItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
