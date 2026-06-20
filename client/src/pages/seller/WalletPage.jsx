import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSellerWallet } from '../../store/slices/sellerSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../lib/helpers';

export default function SellerWallet() {
  const dispatch = useDispatch();
  const { wallet, isLoading } = useSelector(state => state.seller);

  useEffect(() => {
    dispatch(fetchSellerWallet());
  }, [dispatch]);

  if (isLoading && !wallet) return <PageLoader />;

  return (
    <>
      <Helmet><title>Wallet - Seller Dashboard | Zalnio</title></Helmet>

      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-500 mt-1">Manage your earnings wallet</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-primary-600 text-white border-primary-600">
            <CardBody>
              <p className="text-primary-100 text-sm">Current Balance</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(wallet?.balance || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(wallet?.totalEarned || 0)}</p>
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
              <p className="text-gray-500 text-sm">Pending Balance</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(wallet?.pendingBalance || 0)}</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-3 mb-8">
          <Link to="/seller/withdrawals">
            <Button>Withdraw Funds</Button>
          </Link>
          <Link to="/seller/earnings">
            <Button variant="outline">View Earnings</Button>
          </Link>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {wallet?.recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {wallet.recentTransactions.map(txn => (
                <div key={txn._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{txn.type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.amount > 0 ? '+' : ''}{formatPrice(txn.amount || 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No transactions yet. Your earnings will appear here once you start selling.</p>
          )}
        </Card>
      </div>
    </>
  );
}
