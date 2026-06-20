'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { searchPatients, type PatientSearchResult } from '@/services/hospital';
import { Search, Users, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    searchPatients(query).then(setResults).finally(() => setLoading(false));
  };

  return (
    <div>
      <PageHeader title="Patient Search" description="Search for patients by name or email." />

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Search
        </button>
      </form>

      {loading ? <LoadingSpinner className="py-12" /> :
        !searched ? null :
        results.length === 0 ? (
          <EmptyState icon={Users} title="No patients found"
            description="Try a different name or email address." />
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Consent</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map(p => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3">
                      {p.hasConsent
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle className="w-3 h-3" />Active</span>
                        : <span className="flex items-center gap-1 text-muted-foreground text-xs"><XCircle className="w-3 h-3" />None</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.hasConsent ? (
                        <Link href={`${ROUTES.HOSPITAL.PATIENTS}/${p.id}`} className="text-primary hover:underline text-xs font-medium">
                          View Records
                        </Link>
                      ) : (
                        <button className="text-muted-foreground hover:text-primary text-xs font-medium">
                          Request Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
