import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'processing', 'completed', 'failed'];

const statusBadgeVariant = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'danger',
};

export default function AdminSettlements() {
  const [summary, setSummary] = useState({ totalPaid: 0, totalPending: 0, sellersPending: 0 });
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ sellerId: '', amount: '', period: '' });
  const [showProcessModal, setShowProcessModal] = useState(null);
  const [processAction, setProcessAction] = useState('approve');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    fetchSummary();
    fetchPayouts();
  }, [page, statusFilter]);

  const fetchSummary = async () => {
    try {
      const res = await adminService.getSettlementSummary();
      if (res) setSummary(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPayouts({ page, limit: perPage, status: statusFilter || undefined });
      setPayouts(res.payouts || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!createForm.sellerId || !createForm.amount || !createForm.period) return;
    setSubmitting(true);
    try {
      await adminService.createPayout(createForm);
      setShowCreateModal(false);
      setCreateForm({ sellerId: '', amount: '', period: '' });
      fetchPayouts();
      fetchSummary();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!showProcessModal) return;
    setSubmitting(true);
    try {
      const status = processAction === 'approve' ? 'completed' : 'failed';
      await adminService.processPayout(showProcessModal, {
        status,
        transactionRef: processAction === 'approve' ? transactionRef : undefined,
      });
      setShowProcessModal(null);
      setTransactionRef('');
      fetchPayouts();
      fetchSummary();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Settlements - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Settlements</h1>
            <p className="text-gray-500 mt-1">Manage seller payouts and settlements</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Payout
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(summary.totalPaid || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{formatPrice(summary.totalPending || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sellers Pending</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{summary.sellersPending || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : payouts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No payouts yet</h3>
              <p className="text-gray-500">Create your first payout to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payouts.map(payout => (
                      <tr key={payout._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{payout.seller?.store?.name || payout.seller?.name || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(payout.amount || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(payout.commission || 0)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(payout.netAmount || (payout.amount - payout.commission) || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[payout.status] || 'secondary'} size="xs">{payout.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{payout.period || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payout.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {payout.status === 'pending' && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => { setShowProcessModal(payout._id); setProcessAction('approve'); setTransactionRef(''); }} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setShowProcessModal(payout._id); setProcessAction('reject'); setTransactionRef(''); }} title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Payout" size="md">
        <div className="space-y-4">
          <Input label="Seller ID *" value={createForm.sellerId} onChange={(e) => setCreateForm({ ...createForm, sellerId: e.target.value })} placeholder="Enter seller ID" />
          <Input label="Amount *" type="number" min="0" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} />
          <Input label="Period *" value={createForm.period} onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })} placeholder="e.g. June 2026" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePayout} isLoading={submitting} disabled={!createForm.sellerId || !createForm.amount || !createForm.period}>Create Payout</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showProcessModal} onClose={() => { setShowProcessModal(null); setTransactionRef(''); }} title={processAction === 'approve' ? 'Approve Payout' : 'Reject Payout'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {processAction === 'approve' ? 'Enter the transaction reference to confirm this payout.' : 'Are you sure you want to reject this payout?'}
          </p>
          {processAction === 'approve' && (
            <Input label="Transaction Reference *" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="TXN ID or reference" />
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setShowProcessModal(null); setTransactionRef(''); }}>Cancel</Button>
            <Button variant={processAction === 'approve' ? 'primary' : 'danger'} onClick={handleProcessPayout} isLoading={submitting} disabled={processAction === 'approve' && !transactionRef}>
              {processAction === 'approve' ? 'Approve & Complete' : 'Reject Payout'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
