import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerReferrals } from '../../store/slices/sellerSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../lib/helpers';

export default function SellerReferrals() {
  const dispatch = useDispatch();
  const { sellerReferrals, isLoading } = useSelector(state => state.seller);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerReferrals());
  }, [dispatch]);

  if (isLoading && !sellerReferrals) return <PageLoader />;

  const data = sellerReferrals || {};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Helmet><title>Referrals - Seller Dashboard | Zalnio</title></Helmet>

      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Seller Referral Program</h1>
          <p className="text-gray-500 mt-1">Refer other sellers and earn multi-level commission on their sales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Referred</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{data.totalReferred || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Commission Earned</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatPrice(data.totalCommission || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Commission</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{formatPrice(data.pendingCommission || 0)}</p>
            </CardBody>
          </Card>
        </div>

        {data.referralLink && (
          <Card className="mb-6 bg-gray-50">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Referral Link</p>
                  <p className="text-sm text-gray-500 mt-1 break-all">{data.referralLink}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(data.referralLink)}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader><h2 className="text-lg font-semibold">Commission Levels</h2></CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-4">When a seller you referred makes a sale, you earn a percentage of their sales amount. The deeper your referral chain, the more levels you earn from.</p>
            <div className="grid grid-cols-5 gap-3">
              {(data.levels || []).map((level) => (
                <Card key={level.level} padding={false}>
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Level {level.level}</p>
                    <p className="text-2xl font-bold text-primary-600">{level.commissionRate}%</p>
                  </div>
                </Card>
              ))}
            </div>
            {(data.earningsByLevel || []).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Your Earnings by Level</h3>
                <div className="space-y-2">
                  {(data.earningsByLevel || []).map(e => (
                    <div key={e._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Level {e._id}</span>
                      <span className="font-medium text-green-600">{formatPrice(e.total)} ({e.count} sales)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Recent Referral Earnings</h2></CardHeader>
          <CardBody padding={false}>
            {(data.earnings || []).length > 0 ? (
              <div className="divide-y">
                {(data.earnings || []).map(ref => (
                  <div key={ref._id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {ref.commissionType === 'first_purchase_reward' ? 'Referral Bonus' : `Level ${ref.level} Commission`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ref.status === 'credited' ? 'bg-green-100 text-green-700' :
                          ref.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{ref.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{ref.source?.description || 'Commission from sale'}</p>
                      {ref.referred?.name && (
                        <p className="text-xs text-gray-400">Referred seller: {ref.referred.name}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(ref.createdAt)}</p>
                    </div>
                    <p className="font-semibold text-green-600">+{formatPrice(ref.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <svg className="w-12 h-12 mx-auto text-primary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-gray-500 text-sm">No referral earnings yet. Share your link to refer other sellers!</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
