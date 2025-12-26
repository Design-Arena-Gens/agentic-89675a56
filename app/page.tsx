'use client';

import { useState } from 'react';
import { Search, Mail, Database, Activity, Download } from 'lucide-react';

interface Contact {
  name: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  type: string;
  status: string;
  lastContact?: string;
  responseReceived?: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchCountries, setSearchCountries] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [searchProgress, setSearchProgress] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchProgress('Starting search...');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countries: searchCountries }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
        setSearchProgress(`Found ${data.contacts.length} contacts!`);
      } else {
        setSearchProgress('Search completed with errors.');
      }
    } catch (error) {
      setSearchProgress('Error during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendEmails = async () => {
    setEmailStatus('Sending emails...');

    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contacts.filter(c => c.status === 'pending'),
          emailTemplate,
          senderEmail,
          emailPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailStatus(`Successfully sent ${data.sent} emails!`);
        // Refresh contacts
        const updatedContacts = contacts.map(c =>
          data.sentTo.includes(c.email) ? { ...c, status: 'sent', lastContact: new Date().toISOString() } : c
        );
        setContacts(updatedContacts);
      } else {
        setEmailStatus('Failed to send emails.');
      }
    } catch (error) {
      setEmailStatus('Error sending emails.');
    }
  };

  const handleCheckResponses = async () => {
    try {
      const response = await fetch('/api/check-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderEmail, emailPassword }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedContacts = contacts.map(c => {
          const responded = data.responses.find((r: any) => r.email === c.email);
          return responded ? { ...c, responseReceived: true, status: 'responded' } : c;
        });
        setContacts(updatedContacts);
      }
    } catch (error) {
      console.error('Error checking responses:', error);
    }
  };

  const handleFollowUp = async () => {
    setEmailStatus('Sending follow-up emails...');

    try {
      const noResponseContacts = contacts.filter(c =>
        c.status === 'sent' && !c.responseReceived &&
        c.lastContact &&
        (Date.now() - new Date(c.lastContact).getTime()) > 3 * 24 * 60 * 60 * 1000
      );

      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: noResponseContacts,
          emailTemplate,
          senderEmail,
          emailPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailStatus(`Sent ${data.sent} follow-up emails!`);
        const updatedContacts = contacts.map(c =>
          data.sentTo.includes(c.email) ? { ...c, lastContact: new Date().toISOString() } : c
        );
        setContacts(updatedContacts);
      }
    } catch (error) {
      setEmailStatus('Error sending follow-ups.');
    }
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Website', 'Country', 'Type', 'Status', 'Last Contact', 'Responded'];
    const rows = contacts.map(c => [
      c.name,
      c.email,
      c.phone,
      c.website,
      c.country,
      c.type,
      c.status,
      c.lastContact || '',
      c.responseReceived ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-coaches-${Date.now()}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Chess Coach Finder AI</h1>
          <p className="text-xl text-purple-200">Automated discovery, outreach, and follow-up system</p>
        </header>

        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'search' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            <Search size={20} />
            Search
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'outreach' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            <Mail size={20} />
            Outreach
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'tracking' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            <Activity size={20} />
            Tracking
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'database' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300'
            }`}
          >
            <Database size={20} />
            Database
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Search Chess Academies & Coaches</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 mb-2 font-semibold">Countries (comma-separated)</label>
                <input
                  type="text"
                  value={searchCountries}
                  onChange={(e) => setSearchCountries(e.target.value)}
                  placeholder="USA, UK, India, Germany, Spain..."
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Start Search'}
              </button>

              {searchProgress && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-purple-200">{searchProgress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'outreach' && (
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Email Outreach</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 mb-2 font-semibold">Your Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2 font-semibold">Email Password / App Password</label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Your email password"
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2 font-semibold">Email Template</label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Write your email template here... Use {name}, {country}, {website} as placeholders."
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSendEmails}
                  disabled={!senderEmail || !emailTemplate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
                >
                  Send Emails to All Pending
                </button>

                <button
                  onClick={handleFollowUp}
                  disabled={!senderEmail || !emailTemplate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
                >
                  Send Follow-ups (3+ days)
                </button>
              </div>

              {emailStatus && (
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-purple-200">{emailStatus}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Response Tracking</h2>
            <div className="space-y-4">
              <button
                onClick={handleCheckResponses}
                disabled={!senderEmail || !emailPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
              >
                Check for Responses
              </button>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-700 p-6 rounded-lg text-center">
                  <p className="text-4xl font-bold text-purple-400">{contacts.length}</p>
                  <p className="text-purple-200 mt-2">Total Contacts</p>
                </div>
                <div className="bg-slate-700 p-6 rounded-lg text-center">
                  <p className="text-4xl font-bold text-green-400">
                    {contacts.filter(c => c.status === 'sent').length}
                  </p>
                  <p className="text-purple-200 mt-2">Emails Sent</p>
                </div>
                <div className="bg-slate-700 p-6 rounded-lg text-center">
                  <p className="text-4xl font-bold text-blue-400">
                    {contacts.filter(c => c.responseReceived).length}
                  </p>
                  <p className="text-purple-200 mt-2">Responses</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Contact Database</h2>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-purple-200">Name</th>
                    <th className="px-4 py-3 text-purple-200">Email</th>
                    <th className="px-4 py-3 text-purple-200">Country</th>
                    <th className="px-4 py-3 text-purple-200">Type</th>
                    <th className="px-4 py-3 text-purple-200">Status</th>
                    <th className="px-4 py-3 text-purple-200">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No contacts yet. Start a search to find chess coaches and academies!
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact, idx) => (
                      <tr key={idx} className="border-t border-slate-700 hover:bg-slate-750">
                        <td className="px-4 py-3 text-white">{contact.name}</td>
                        <td className="px-4 py-3 text-purple-300">{contact.email}</td>
                        <td className="px-4 py-3 text-white">{contact.country}</td>
                        <td className="px-4 py-3 text-white">{contact.type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            contact.status === 'pending' ? 'bg-yellow-600' :
                            contact.status === 'sent' ? 'bg-blue-600' :
                            contact.status === 'responded' ? 'bg-green-600' :
                            'bg-gray-600'
                          } text-white`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">
                          {contact.responseReceived ? '✅' : '⏳'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
