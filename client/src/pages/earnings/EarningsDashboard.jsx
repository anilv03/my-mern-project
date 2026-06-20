import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchEarningDashboard, fetchAllTransactions } from '../../store/slices/earningSlice';
import { fetchWallet } from '../../store/slices/walletSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

export default function EarningsDashboard() {
  const dispatch = useDispatch();
  const { dashboard, transactions, isLoading, pagination } = useSelector(state => state.earning);

  useEffect(() => {
    dispatch(fetchEarningDashboard());
    dispatch(fetchWallet());
    dispatch(fetchAllTransactions({ limit: 5 }));
  }, [dispatch]);

  if (!dashboard && isLoading) return <PageLoader />;

  const statCards = [
    { label: 'Wallet Balance', value: formatPrice(dashboard?.wallet?.balance || 0), color: 'bg-primary-600 text-white', link: '/wallet' },
    { label: 'Referral Earnings', value: formatPrice(dashboard?.referral?.totalEarned || 0), color: 'bg-green-600 text-white', link: '/referrals' },
    { label: 'Cashback Earned', value: formatPrice(dashboard?.cashback?.total || 0), color: 'bg-blue-600 text-white', link: '/cashback' },
    { label: 'Creator Rewards', value: formatPrice(dashboard?.creatorRewards?.totalApprovedAmount || 0), color: 'bg-purple-600 text-white', link: '/creator-rewards' },
  ];

  return (
    <>
      <Helmet><title>Earnings | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-500 mt-1">Track all your earnings in one place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <Link key={i} to={stat.link}>
              <Card className={`${stat.color} border-0 hover:shadow-lg transition-shadow`}>
                <CardBody>
                  <p className="text-white/80 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Wallet Overview</h2>
                <Link to="/wallet" className="text-sm text-primary-600 hover:underline">View All</Link>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-gray-500">Balance</dt><dd className="font-semibold">{formatPrice(dashboard?.wallet?.balance || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Total Credited</dt><dd className="font-semibold text-green-600">{formatPrice(dashboard?.wallet?.totalCredited || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Total Withdrawn</dt><dd className="font-semibold text-red-600">{formatPrice(dashboard?.wallet?.totalWithdrawn || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Pending Withdrawal</dt><dd className="font-semibold text-orange-600">{formatPrice(dashboard?.wallet?.pendingWithdrawal || 0)}</dd></div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Referral Summary</h2>
                <Link to="/referrals" className="text-sm text-primary-600 hover:underline">View All</Link>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-gray-500">Total Earned</dt><dd className="font-semibold text-green-600">{formatPrice(dashboard?.referral?.totalEarned || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Pending</dt><dd className="font-semibold text-orange-600">{formatPrice(dashboard?.referral?.pendingEarnings || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Total Referrals</dt><dd className="font-semibold">{dashboard?.referral?.totalReferrals || 0}</dd></div>
                {dashboard?.referral?.referralLink && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Referral Link</p>
                    <p className="text-xs text-gray-700 truncate">{dashboard.referral.referralLink}</p>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Cashback & Creator Rewards</h2>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                <div className="flex justify-between"><dt className="text-gray-500">Cashback Earned</dt><dd className="font-semibold text-green-600">{formatPrice(dashboard?.cashback?.total || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Cashback Transactions</dt><dd className="font-semibold">{dashboard?.cashback?.count || 0}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Creator Rewards</dt><dd className="font-semibold text-green-600">{formatPrice(dashboard?.creatorRewards?.totalApprovedAmount || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Approved Submissions</dt><dd className="font-semibold">{dashboard?.creatorRewards?.totalApproved || 0}</dd></div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <Link to="/wallet" className="text-sm text-primary-600 hover:underline">View All</Link>
              </div>
            </CardHeader>
            <CardBody>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(txn => (
                    <div key={txn._id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{txn.type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                      </div>
                      <span className={classNames('font-medium', txn.amount > 0 ? 'text-green-600' : 'text-red-600')}>
                        {txn.amount > 0 ? '+' : '-'}{formatPrice(Math.abs(txn.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
