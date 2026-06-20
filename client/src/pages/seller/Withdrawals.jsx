import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchSellerWallet, fetchSellerWithdrawals, requestSellerWithdrawal,
  cancelSellerWithdrawal, resetSellerSuccess,
  fetchSellerBankAccounts, createSellerBankAccount,
  updateSellerBankAccount, deleteSellerBankAccount, setDefaultSellerBankAccount,
} from '../../store/slices/sellerSlice';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusVariants = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function SellerWithdrawals() {
  const dispatch = useDispatch();
  const { wallet, withdrawals, bankAccounts, isLoading, isSuccess, withdrawalPagination } = useSelector(state => state.seller);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' });
  const [upiId, setUpiId] = useState('');

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [bankForm, setBankForm] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '', upiId: '', isDefault: false });

  useEffect(() => {
    dispatch(fetchSellerWallet());
    dispatch(fetchSellerBankAccounts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSellerWithdrawals({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    if (isSuccess) {
      setShowModal(false);
      setAmount('');
      dispatch(resetSellerSuccess());
    }
  }, [isSuccess, dispatch]);

  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedAccountId) {
      const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0];
      setSelectedAccountId(defaultAccount._id);
    }
  }, [bankAccounts, selectedAccountId]);

  const selectedAccount = bankAccounts.find(a => a._id === selectedAccountId);

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    const data = { amount: parseFloat(amount), paymentMethod: method };
    if (method === 'bank_transfer') {
      if (selectedAccount) {
        data.bankDetails = {
          accountHolderName: selectedAccount.accountHolderName,
          accountNumber: selectedAccount.accountNumber,
          ifscCode: selectedAccount.ifscCode,
          bankName: selectedAccount.bankName,
          branchName: selectedAccount.branchName,
        };
      } else {
        data.bankDetails = bankDetails;
      }
    }
    if (method === 'upi') {
      if (selectedAccount?.upiId) {
        data.upiDetails = { upiId: selectedAccount.upiId };
      } else {
        data.upiDetails = { upiId };
      }
    }
    dispatch(requestSellerWithdrawal(data));
  };

  const handleOpenBankModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setBankForm({
        accountHolderName: account.accountHolderName || '',
        accountNumber: account.accountNumber || '',
        ifscCode: account.ifscCode || '',
        bankName: account.bankName || '',
        branchName: account.branchName || '',
        upiId: account.upiId || '',
        isDefault: account.isDefault || false,
      });
    } else {
      setEditingAccount(null);
      setBankForm({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '', upiId: '', isDefault: false });
    }
    setShowBankModal(true);
  };

  const handleSaveBankAccount = (e) => {
    e.preventDefault();
    if (editingAccount) {
      dispatch(updateSellerBankAccount({ id: editingAccount._id, data: bankForm }));
    } else {
      dispatch(createSellerBankAccount(bankForm));
    }
    setShowBankModal(false);
    setEditingAccount(null);
  };

  const handleDeleteBankAccount = (id) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      dispatch(deleteSellerBankAccount(id));
    }
  };

  const handleSetDefault = (id) => {
    dispatch(setDefaultSellerBankAccount(id));
  };

  const maskAccountNumber = (num) => {
    if (!num) return '';
    const s = String(num);
    if (s.length <= 4) return s;
    return 'XXXX' + s.slice(-4);
  };

  if (isLoading && withdrawals.length === 0 && !wallet) return <PageLoader />;

  return (
    <>
      <Helmet><title>Withdrawals - Seller Dashboard | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Withdrawals</h1>
            <p className="text-gray-500 mt-1">Request and track your withdrawals</p>
          </div>
          <Button onClick={() => setShowModal(true)} disabled={!wallet || wallet?.balance <= 0}>
            Request Withdrawal
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{formatPrice(wallet?.balance || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(wallet?.pendingBalance || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Withdrawn</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(wallet?.totalWithdrawn || 0)}</p>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Saved Bank Accounts</h2>
              <Button variant="outline" size="sm" onClick={() => handleOpenBankModal()}>
                + Add Bank Account
              </Button>
            </div>
            {bankAccounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No bank accounts saved yet. Add one to withdraw faster.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map(account => (
                  <div
                    key={account._id}
                    className={classNames(
                      'border rounded-lg p-4 relative transition-all',
                      account.isDefault ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                    )}
                  >
                    {account.isDefault && (
                      <span className="absolute top-2 right-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    <p className="font-medium text-gray-900 text-sm">{account.accountHolderName}</p>
                    <p className="text-gray-600 text-sm mt-1">{account.bankName}</p>
                    <p className="text-gray-500 text-xs mt-1 font-mono">{maskAccountNumber(account.accountNumber)}</p>
                    <p className="text-gray-500 text-xs font-mono">{account.ifscCode}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleOpenBankModal(account)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDeleteBankAccount(account._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      {!account.isDefault && (
                        <button onClick={() => handleSetDefault(account._id)} className="text-gray-600 hover:text-gray-800 text-xs font-medium">Set Default</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {statusFilters.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : withdrawals.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No withdrawals found</h3>
            <p className="text-gray-500">Withdrawal requests will appear here once you submit them</p>
          </Card>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fee</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Net Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Admin Note</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {withdrawals.map(w => (
                        <tr key={w._id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{formatPrice(w.amount)}</td>
                          <td className="py-3 px-4 text-gray-600">{w.fee ? formatPrice(w.fee) : '-'}</td>
                          <td className="py-3 px-4 font-medium">{w.netAmount ? formatPrice(w.netAmount) : '-'}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{w.paymentMethod?.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-4">
                            <span className={classNames('px-2 py-1 rounded-full text-xs font-medium', statusVariants[w.status] || 'bg-gray-100 text-gray-800')}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(w.createdAt)}</td>
                          <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{w.adminNote || '-'}</td>
                          <td className="py-3 px-4">
                            {w.status === 'pending' && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to cancel this withdrawal request?')) {
                                    dispatch(cancelSellerWithdrawal(w._id));
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>

            {withdrawalPagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {withdrawalPagination.totalPages}</span>
                <Button variant="ghost" disabled={page >= withdrawalPagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Withdrawal" size="lg">
        <form onSubmit={handleRequestWithdrawal} className="space-y-4">
          <div className="bg-primary-50 rounded-lg p-4 mb-2">
            <p className="text-sm text-primary-700">
              Available Balance: <span className="font-bold">{formatPrice(wallet?.balance || 0)}</span>
            </p>
          </div>

          <Input
            label="Amount"
            type="number"
            min="1"
            max={wallet?.balance || 0}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="input-field w-full">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {bankAccounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saved Bank Account</label>
              <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="input-field w-full">
                <option value="">-- Enter new details below --</option>
                {bankAccounts.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.bankName} - {maskAccountNumber(a.accountNumber)} {a.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {method === 'bank_transfer' && !selectedAccountId && (
            <>
              <Input label="Account Holder Name" value={bankDetails.accountHolderName} onChange={e => setBankDetails(bd => ({ ...bd, accountHolderName: e.target.value }))} required />
              <Input label="Account Number" value={bankDetails.accountNumber} onChange={e => setBankDetails(bd => ({ ...bd, accountNumber: e.target.value }))} required />
              <Input label="IFSC Code" value={bankDetails.ifscCode} onChange={e => setBankDetails(bd => ({ ...bd, ifscCode: e.target.value }))} required />
              <Input label="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails(bd => ({ ...bd, bankName: e.target.value }))} />
            </>
          )}

          {method === 'upi' && !selectedAccount?.upiId && (
            <Input label="UPI ID" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="example@upi" required />
          )}

          {selectedAccount && method === 'bank_transfer' && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium">{selectedAccount.accountHolderName}</p>
              <p>{selectedAccount.bankName} - {maskAccountNumber(selectedAccount.accountNumber)}</p>
              <p>IFSC: {selectedAccount.ifscCode}</p>
            </div>
          )}

          {selectedAccount?.upiId && method === 'upi' && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p>UPI ID: {selectedAccount.upiId}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" fullWidth isLoading={isLoading} disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (wallet?.balance || 0)}>
              Submit Request
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showBankModal} onClose={() => setShowBankModal(false)} title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'} size="md">
        <form onSubmit={handleSaveBankAccount} className="space-y-4">
          <Input label="Account Holder Name" value={bankForm.accountHolderName} onChange={e => setBankForm(f => ({ ...f, accountHolderName: e.target.value }))} required />
          <Input label="Account Number" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} required />
          <Input label="IFSC Code" value={bankForm.ifscCode} onChange={e => setBankForm(f => ({ ...f, ifscCode: e.target.value }))} required />
          <Input label="Bank Name" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} required />
          <Input label="Branch Name (Optional)" value={bankForm.branchName} onChange={e => setBankForm(f => ({ ...f, branchName: e.target.value }))} />
          <Input label="UPI ID (Optional)" value={bankForm.upiId} onChange={e => setBankForm(f => ({ ...f, upiId: e.target.value }))} placeholder="example@upi" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={bankForm.isDefault} onChange={e => setBankForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Set as default account
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" fullWidth isLoading={isLoading}>
              {editingAccount ? 'Update Account' : 'Add Account'}
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setShowBankModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
