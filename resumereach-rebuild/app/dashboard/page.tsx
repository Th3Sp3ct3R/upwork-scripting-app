'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalApplications: number;
  submitted: number;
  pending: number;
  rejected: number;
  approved: number;
}

interface RecentApplication {
  id: string;
  job: {
    title: string;
    company: string;
  };
  status: string;
  appliedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appRes, statsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/applications/stats'),
      ]);

      if (appRes.ok) {
        const apps = await appRes.json();
        setApplications(apps.slice(0, 5));
      }

      if (statsRes.ok) {
        const appStats = await statsRes.json();
        setStats(appStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container-main py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's your job application overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600">Total Applications</div>
          <div className="text-3xl font-bold mt-2">{stats?.totalApplications || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Submitted</div>
          <div className="text-3xl font-bold mt-2 text-blue-600">{stats?.submitted || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="text-3xl font-bold mt-2 text-yellow-600">{stats?.pending || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold mt-2 text-red-600">{stats?.rejected || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-3xl font-bold mt-2 text-green-600">{stats?.approved || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{app.job.title}</p>
                      <p className="text-sm text-gray-600">{app.job.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{app.status}</p>
                      <p className="text-xs text-gray-600">{new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No applications yet</p>
            )}
            <Link href="/dashboard/applications" className="text-primary-600 hover:text-primary-700 text-sm mt-4 inline-block">
              View all applications →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/jobs" className="block btn-primary w-full text-center">
                Find Jobs
              </Link>
              <Link href="/dashboard/preferences" className="block btn-outline w-full text-center">
                Set Preferences
              </Link>
              <Link href="/dashboard/resumes" className="block btn-outline w-full text-center">
                Manage Resumes
              </Link>
              <Link href="/dashboard/billing" className="block btn-outline w-full text-center">
                Billing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
