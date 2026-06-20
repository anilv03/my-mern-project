import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchWallet, fetchTransactions, fetchWithdrawals, addMoney, requestWithdrawal, cancelWithdrawal, resetWalletSuccess } from '../../store/slices/walletSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

const WITHDRAWAL_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const TXN_TYPES = {
  add_money: { label: 'Add Money', color: 'text-green-600' },
  order_purchase: { label: 'Purchase', color: 'text-red-600' },
  order_refund: { label: 'Refund', color: 'text-green-600' },
  cashback_credit: { label: 'Cashback', color: 'text-green-600' },
  referral_commission: { label: 'Referral Commission', color: 'text-green-600' },
  creator_reward: { label: 'Creator Reward', color: 'text-green-600' },
  withdrawal: { label: 'Withdrawal', color: 'text-red-600' },
  withdrawal_reversal: { label: 'Withdrawal Reversal', color: 'text-green-600' },
  admin_credit: { label: 'Admin Credit', color: 'text-green-600' },
  admin_debit: { label: 'Admin Debit', color: 'text-red-600' },
};

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'withdrawals', label: 'Withdrawals' },
];

export default function Wallet() {
  const dispatch = useDispatch();
  const { wallet, transactions, withdrawals, isLoading, isSuccess, pagination } = useSelector(state => state.wallet);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState({ accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' });
  const [upiId, setUpiId] = useState('');
  const [userNote, setUserNote] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchTransactions({ page, limit: 10 }));
    dispatch(fetchWithdrawals({ page: 1, limit: 10 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (isSuccess) {
      setShowAddMoney(false);
      setShowWithdraw(false);
      dispatch(resetWalletSuccess());
    }
  }, [isSuccess, dispatch]);

  const handleAddMoney = (e) => {
    e.preventDefault();
    dispatch(addMoney({ amount: parseFloat(amount), paymentMethod }));
    setShowAddMoney(false);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const data = {
      amount: parseFloat(amount),
      paymentMethod: withdrawMethod,
      userNote,
    };
    if (withdrawMethod === 'bank_transfer') data.bankDetails = bankDetails;
    if (withdrawMethod === 'upi') data.upiDetails = { upiId };
    dispatch(requestWithdrawal(data));
    setShowWithdraw(false);
  };

  const handleCancelWithdrawal = (id) => {
    if (window.confirm('Cancel this withdrawal request?')) {
      dispatch(cancelWithdrawal(id));
    }
  };

  if (!wallet && isLoading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Wallet | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-500 mt-1">Manage your wallet and transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-primary-600 text-white border-primary-600">
            <CardBody>
              <p className="text-primary-100 text-sm">Balance</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(wallet?.balance || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Credited</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(wallet?.totalCredited || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Withdrawn</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatPrice(wallet?.totalWithdrawn || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Withdrawal</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(wallet?.pendingWithdrawal || 0)}</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-3 mb-6">
          <Button onClick={() => { setAmount(''); setShowAddMoney(true); }}>Add Money</Button>
          <Button variant="outline" onClick={() => { setAmount(''); setShowWithdraw(true); }}>Withdraw</Button>
        </div>

        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={classNames('px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.value ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && wallet && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Wallet Summary</h2></CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <div><dt className="text-gray-500 text-sm">Balance</dt><dd className="font-semibold">{formatPrice(wallet.balance)}</dd></div>
                <div><dt className="text-gray-500 text-sm">Total Credited</dt><dd className="font-semibold">{formatPrice(wallet.totalCredited)}</dd></div>
                <div><dt className="text-gray-500 text-sm">Total Debited</dt><dd className="font-semibold">{formatPrice(wallet.totalDebited)}</dd></div>
                <div><dt className="text-gray-500 text-sm">Total Withdrawn</dt><dd className="font-semibold">{formatPrice(wallet.totalWithdrawn)}</dd></div>
                <div><dt className="text-gray-500 text-sm">Pending Withdrawal</dt><dd className="font-semibold">{formatPrice(wallet.pendingWithdrawal)}</dd></div>
                <div><dt className="text-gray-500 text-sm">Last Activity</dt><dd className="font-semibold">{wallet.lastTransactionAt ? formatDate(wallet.lastTransactionAt) : 'N/A'}</dd></div>
              </dl>
            </CardBody>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <Card><CardBody><p className="text-gray-500 text-center py-4">No transactions yet</p></CardBody></Card>
            ) : (
              transactions.map(txn => {
                const txnType = TXN_TYPES[txn.type] || { label: txn.type, color: 'text-gray-600' };
                return (
                  <Card key={txn._id} padding={false} hover={false}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={classNames('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                          txn.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        )}>
                          {txn.amount > 0 ? '+' : '-'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{txnType.label}</p>
                          <p className="text-sm text-gray-500">{txn.description}</p>
                          <p className="text-xs text-gray-400">{formatDate(txn.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={classNames('font-semibold', txnType.color)}>
                          {txn.amount > 0 ? '+' : '-'}{formatPrice(Math.abs(txn.amount))}
                        </p>
                        <p className="text-xs text-gray-400">Balance: {formatPrice(txn.balanceAfter)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
            {pagination?.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={classNames('px-3 py-1 rounded text-sm', page === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700')}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <Card><CardBody><p className="text-gray-500 text-center py-4">No withdrawal requests</p></CardBody></Card>
            ) : (
              withdrawals.map(w => (
                <Card key={w._id} padding={false} hover={false}>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{formatPrice(w.amount)} via {w.paymentMethod}</p>
                      <p className="text-sm text-gray-500">{formatDate(w.createdAt)}</p>
                      {w.rejectionReason && <p className="text-sm text-red-500 mt-1">Reason: {w.rejectionReason}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={classNames('px-2 py-1 rounded-full text-xs font-medium', WITHDRAWAL_STATUS_COLORS[w.status])}>{w.status}</span>
                      {w.status === 'pending' && (
                        <Button size="xs" variant="ghost" onClick={() => handleCancelWithdrawal(w._id)}>Cancel</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} title="Add Money">
        <form onSubmit={handleAddMoney} className="space-y-4">
          <Input label="Amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="input-field w-full">
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
          <Button type="submit" fullWidth isLoading={isLoading}>Add {formatPrice(parseFloat(amount || 0))}</Button>
        </form>
      </Modal>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds" size="lg">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <Input label="Amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Method</label>
            <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)} className="input-field w-full">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          {withdrawMethod === 'bank_transfer' && (
            <>
              <Input label="Account Holder Name" value={bankDetails.accountHolderName} onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })} required />
              <Input label="Account Number" value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} required />
              <Input label="IFSC Code" value={bankDetails.ifscCode} onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value })} required />
              <Input label="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })} />
            </>
          )}
          {withdrawMethod === 'upi' && (
            <Input label="UPI ID" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="example@upi" required />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea value={userNote} onChange={e => setUserNote(e.target.value)} rows={2} className="input-field w-full" />
          </div>
          <Button type="submit" fullWidth isLoading={isLoading}>Submit Withdrawal Request</Button>
        </form>
      </Modal>
    </>
  );
}
