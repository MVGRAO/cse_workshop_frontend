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
import PrivateRoute from '@/components/PrivateRoute';
import styles from '@/styles/adminrequests.module.scss';

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

export default function AdminRequests() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<VerifierRequest[]>([]);
  const [accepted, setAccepted] = useState<VerifierRequest[]>([]);
  const [selected, setSelected] = useState<VerifierRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = getAuthToken('admin');
    const role = getUserRole('admin');
    if (!token || role !== 'admin') {
      router.replace('/admin');
      return;
    }
    load();
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

  const filteredPending = pending.filter(req =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccepted = accepted.filter(req =>
    req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <PrivateRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Verifier Requests</h1>
              <p className={styles.subtitle}>Manage access for verifiers/employers</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className={styles.backButton}
            >
              Back to Admin
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading requests...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    width: '100%',
                    maxWidth: '400px'
                  }}
                />
              </div>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Not Signed In (Pending)</h2>
                  <span className={styles.count}>{filteredPending.length} request(s)</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Verifier Name</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPending.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={styles.emptyText}>No pending requests</td>
                        </tr>
                      ) : (
                        filteredPending.map((request) => (
                          <tr key={request._id}>
                            <td>{request.name}</td>
                            <td>{request.email}</td>
                            <td>—</td>
                            <td className={styles.actions}>
                              <button
                                onClick={() => setSelected(request)}
                                className={styles.viewButton}
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleAccept(request._id)}
                                disabled={busyId === request._id}
                                className={styles.acceptButton}
                              >
                                {busyId === request._id ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleReject(request._id)}
                                disabled={busyId === request._id}
                                className={styles.rejectButton}
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Signed In (Approved)</h2>
                  <span className={styles.count}>{filteredAccepted.length} verifier(s)</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Verifier Name</th>
                        <th>Email</th>
                        <th>Generated Password</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccepted.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={styles.emptyText}>No approved verifiers yet</td>
                        </tr>
                      ) : (
                        filteredAccepted.map((request) => (
                          <tr key={request._id}>
                            <td>{request.name}</td>
                            <td>{request.email}</td>
                            <td>{request.generatedPassword || '—'}</td>
                            <td className={styles.actions}>
                              <button
                                onClick={() => setSelected(request)}
                                className={styles.viewButton}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {selected && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <div>
                    <h3 className={styles.modalTitle}>{selected.name}</h3>
                    <p className={styles.modalSubtitle}>{selected.email}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className={styles.closeButton}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.modalGrid}>
                  <div>
                    <p className={styles.labelText}>College</p>
                    <p>{selected.college || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className={styles.labelText}>Phone</p>
                    <p>{selected.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className={styles.labelText}>Status</p>
                    <p className={styles.capitalize}>{selected.status}</p>
                  </div>
                  <div>
                    <p className={styles.labelText}>Generated Password</p>
                    <p>{selected.generatedPassword || 'Will be available after approval'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PrivateRoute >
  );
}
