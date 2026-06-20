'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  userGrowth: { month: string; patients: number; providers: number }[];
  accessByRole: { role: string; count: number }[];
  dataTypeAccess: { type: string; value: number }[];
}

const COLORS = ['#0066CC', '#10B981', '#818CF8', '#F59E0B', '#EF4444'];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Analytics" description="System-wide usage metrics and data trends." />
      {loading ? <LoadingSpinner className="py-12" /> : !data ? (
        <p className="text-muted-foreground">No analytics data available.</p>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#0066CC" strokeWidth={2} />
                <Line type="monotone" dataKey="providers" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Access Volume by Role</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.accessByRole}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066CC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Data Types Accessed</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.dataTypeAccess} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="type" label>
                    {data.dataTypeAccess.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
