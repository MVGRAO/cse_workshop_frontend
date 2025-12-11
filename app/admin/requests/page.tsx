'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  acceptVerifierRequest,
  getAuthToken,
  getUserRole,
  getVerifierRequests,
  rejectVerifierRequest,
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';

interface VerifierRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  status: 'pending' | 'accepted' | 'rejected';
  generatedPassword?: string;
  createdAt: string;
}

export default function VerifierRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<VerifierRequest[]>([]);
  const [accepted, setAccepted] = useState<VerifierRequest[]>([]);
  const [selected, setSelected] = useState<VerifierRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    const role = getUserRole();
    if (!token) {
      router.replace('/admin');
      return;
    }
    if (role && role !== 'admin') {
      router.replace(`/${role}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [pendingRes, acceptedRes] = await Promise.all([
        getVerifierRequests('pending'),
        getVerifierRequests('accepted'),
      ]);
      setPending(pendingRes.data || []);
      setAccepted(acceptedRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load requests',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      setBusyId(id);
      const resp = await acceptVerifierRequest(id);
      const acceptedRequest = pending.find((r) => r._id === id);
      setPending((prev) => prev.filter((r) => r._id !== id));
      if (acceptedRequest) {
        setAccepted((prev) => [
          {
            ...acceptedRequest,
            status: 'accepted',
            generatedPassword: resp.data?.password,
          },
          ...prev,
        ]);
      }
      toast({
        title: 'Accepted',
        description: 'Verifier created and moved to Signed-in list',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setBusyId(id);
      await rejectVerifierRequest(id);
      setPending((prev) => prev.filter((r) => r._id !== id));
      toast({
        title: 'Rejected',
        description: 'Request rejected',
        variant: 'info',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderRow = (request: VerifierRequest, showActions = false) => (
    <tr key={request._id} className="border-b">
      <td className="px-4 py-3 font-medium text-gray-900">{request.name}</td>
      <td className="px-4 py-3 text-gray-700">{request.email}</td>
      <td className="px-4 py-3 text-gray-700">{request.generatedPassword || '—'}</td>
      <td className="px-4 py-3 text-right space-x-2">
        {showActions ? (
          <>
            <button
              onClick={() => setSelected(request)}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
            >
              View details
            </button>
            <button
              onClick={() => handleAccept(request._id)}
              disabled={busyId === request._id}
              className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {busyId === request._id ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={() => handleReject(request._id)}
              disabled={busyId === request._id}
              className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
            >
              Reject
            </button>
          </>
        ) : (
          <button
            onClick={() => setSelected(request)}
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            View details
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verifier Requests</h1>
            <p className="text-gray-600">Manage access for verifiers/employers</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
          >
            Back to Admin
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">Loading requests...</div>
        ) : (
          <>
            <section className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Not Signed In (Pending)</h2>
                <span className="text-sm text-gray-500">{pending.length} request(s)</span>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verifier Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pending.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No pending requests</td>
                    </tr>
                  ) : (
                    pending.map((req) => renderRow(req, true))
                  )}
                </tbody>
              </table>
            </section>

            <section className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Signed In (Approved)</h2>
                <span className="text-sm text-gray-500">{accepted.length} verifier(s)</span>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verifier Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated Password</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accepted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">No approved verifiers yet</td>
                    </tr>
                  ) : (
                    accepted.map((req) => renderRow(req, false))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {selected && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-gray-600">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">College</p>
                <p>{selected.college || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Phone</p>
                <p>{selected.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Status</p>
                <p className="capitalize">{selected.status}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Generated Password</p>
                <p>{selected.generatedPassword || 'Will be available after approval'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


