import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchReferralInfo, fetchTeamTree, fetchReferralEarnings, fetchReferralStats } from '../../store/slices/referralSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'team', label: 'Team' },
  { value: 'earnings', label: 'Earnings' },
];

export default function Referral() {
  const dispatch = useDispatch();
  const { info, teamTree, earnings, stats, isLoading, pagination } = useSelector(state => state.referral);
  const [activeTab, setActiveTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchReferralInfo());
    dispatch(fetchReferralStats());
    dispatch(fetchTeamTree());
    dispatch(fetchReferralEarnings({ page, limit: 10 }));
  }, [dispatch, page]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!info && isLoading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Referrals | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-500 mt-1">Refer a friend and earn ₹50 when they place their first order above ₹100</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-primary-600 text-white border-primary-600">
            <CardBody>
              <p className="text-primary-100 text-sm">Total Earned</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(info?.totalEarned || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold mt-1">{info?.totalReferrals || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Pending Earnings</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatPrice(info?.pendingEarnings || 0)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-gray-500 text-sm">Referral Code</p>
              <p className="text-2xl font-bold mt-1 font-mono">{info?.referralCode || '--'}</p>
            </CardBody>
          </Card>
        </div>

        {info?.referralLink && (
          <Card className="mb-6 bg-gray-50">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Referral Link</p>
                  <p className="text-sm text-gray-500 mt-1 break-all">{info.referralLink}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(info.referralLink)}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mb-8 bg-green-50 border-green-200">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold">₹</div>
              <div>
                <p className="font-semibold text-green-800">Referral Bonus: ₹50</p>
                <p className="text-sm text-green-700 mt-1">Share your referral link with friends. When they sign up and make their first purchase of ₹100 or more, you earn ₹50 as a referral bonus. The bonus will be credited to your wallet after admin approval.</p>
              </div>
            </div>
          </CardBody>
        </Card>

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

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><h2 className="text-lg font-semibold">How It Works</h2></CardHeader>
              <CardBody>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="font-medium text-gray-900">Share Your Link</p>
                      <p className="text-sm text-gray-500">Copy your unique referral link above and share it with friends.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="font-medium text-gray-900">Friend Signs Up</p>
                      <p className="text-sm text-gray-500">They create an account using your referral link.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="font-medium text-gray-900">First Purchase</p>
                      <p className="text-sm text-gray-500">They place their first order of ₹100 or more.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <div>
                      <p className="font-medium text-gray-900">Earn ₹50</p>
                      <p className="text-sm text-gray-500">You get ₹50 credited to your wallet after admin approval.</p>
                    </div>
                  </li>
                </ol>
              </CardBody>
            </Card>
            <Card>
              <CardHeader><h2 className="text-lg font-semibold">Your Referrals</h2></CardHeader>
              <CardBody>
                {stats?.levelCounts?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.levelCounts.map(l => (
                      <div key={l._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Referred Users</span>
                        <span className="font-medium">{l.count}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">No referrals yet. Share your link to start earning!</p>}
              </CardBody>
            </Card>
            {info?.recentEarnings?.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader><h2 className="text-lg font-semibold">Recent Earnings</h2></CardHeader>
                <CardBody>
                  <div className="space-y-2">
                    {info.recentEarnings.map(e => (
                      <div key={e._id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{e.referred?.name || 'Unknown'}</span>
                        <span className="font-medium text-green-600">+{formatPrice(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-2">
            {teamTree.length === 0 ? (
              <Card><CardBody><p className="text-gray-500 text-center py-4">No referrals yet. Share your referral link to get started!</p></CardBody></Card>
            ) : (
              <div className="grid gap-3">
                {teamTree.map(node => (
                  <Card key={node.user?._id} padding={false} hover={false}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                        {node.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{node.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">Joined {node.joinedAt ? formatDate(node.joinedAt) : 'N/A'}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">{formatPrice(node.totalEarned)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-3">
            {earnings.length === 0 ? (
              <Card><CardBody><p className="text-gray-500 text-center py-4">No earnings yet</p></CardBody></Card>
            ) : (
              earnings.map(e => (
                <Card key={e._id} padding={false} hover={false}>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {e.commissionType === 'first_purchase_reward' ? 'Referral Bonus' : 'Referral Commission'}
                        </span>
                        <span className={classNames('px-2 py-0.5 rounded-full text-xs font-medium',
                          e.status === 'credited' ? 'bg-green-100 text-green-700' : e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        )}>{e.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{e.source?.description || 'Referral earning'}</p>
                      <p className="text-xs text-gray-400">{e.referred?.name && `From: ${e.referred.name} · `}{formatDate(e.createdAt)}</p>
                    </div>
                    <p className="font-semibold text-green-600">+{formatPrice(e.amount)}</p>
                  </div>
                </Card>
              ))
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
      </div>
    </>
  );
}
