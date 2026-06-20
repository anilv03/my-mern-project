import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSellerEarnings } from '../../store/slices/sellerSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../lib/helpers';

export default function SellerEarnings() {
  const dispatch = useDispatch();
  const { earnings, isLoading } = useSelector(state => state.seller);

  useEffect(() => {
    dispatch(fetchSellerEarnings());
  }, [dispatch]);

  if (isLoading && !earnings) return <PageLoader />;

  const data = earnings || {};

  return (
    <>
      <Helmet><title>Earnings - Seller Dashboard | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-500 mt-1">Track your earnings and payouts</p>
          </div>
          <Link to="/seller/withdrawals"><Button>Request Payout</Button></Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatPrice(data.totalEarnings || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Sales</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{(data.totalSales || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{(data.totalOrders || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{formatPrice(data.walletBalance || 0)}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
          </div>
          {data.payouts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.payouts.map(payout => (
                    <tr key={payout._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{formatPrice(payout.amount)}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{payout.method || payout.paymentMethod || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          payout.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payout.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(payout.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No payouts yet</p>
          )}
        </Card>
      </div>
    </>
  );
}
