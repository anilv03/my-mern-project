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

const typeTabs = ['', 'credit', 'debit', 'withdrawal'];

const typeBadgeVariant = {
  credit: 'success',
  debit: 'danger',
  withdrawal: 'warning',
};

export default function AdminWalletManagement() {
  const [stats, setStats] = useState({ totalBalance: 0, totalCredited: 0, totalDebited: 0, totalWithdrawn: 0, count: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('credit');
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    fetchStats();
    fetchTransactions();
  }, [page, typeFilter]);

  const fetchStats = async () => {
    try {
      const res = await adminService.getWalletStats();
      if (res) setStats(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getWalletTransactions({ page, limit: perPage, type: typeFilter || undefined });
      setTransactions(res.transactions || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userEmail || !amount || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      if (modalType === 'credit') {
        await adminService.creditWallet({ email: userEmail, amount: Number(amount), description });
      } else {
        await adminService.debitWallet({ email: userEmail, amount: Number(amount), description });
      }
      setShowModal(false);
      setUserEmail('');
      setAmount('');
      setDescription('');
      fetchStats();
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setUserEmail('');
    setAmount('');
    setDescription('');
  };

  return (
    <>
      <Helmet><title>Wallet Management - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Wallet Management</h1>
            <p className="text-gray-500 mt-1">Manage user wallets and transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openModal('debit')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Deduct
            </Button>
            <Button onClick={() => openModal('credit')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Credit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{formatPrice(stats.totalBalance || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Credited</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(stats.totalCredited || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Debited</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatPrice(stats.totalDebited || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Withdrawn</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(stats.totalWithdrawn || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {typeTabs.map(type => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                typeFilter === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions</h3>
              <p className="text-gray-500">No wallet transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{tx.user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{tx.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={typeBadgeVariant[tx.type] || 'secondary'} size="xs">{tx.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(tx.amount || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(tx.balance || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={tx.description}>{tx.description || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'credit' ? 'Add Credit to Wallet' : 'Deduct from Wallet'} size="md">
        <div className="space-y-4">
          <Input label="User Email *" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter user email" />
          <Input label={`Amount to ${modalType === 'credit' ? 'Credit' : 'Debit'} *`} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason for transaction" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!userEmail || !amount || Number(amount) <= 0}>
              {modalType === 'credit' ? 'Add Credit' : 'Deduct'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
