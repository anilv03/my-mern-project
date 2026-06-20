import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const levelColors = ['primary', 'blue', 'accent', 'purple', 'green'];

export default function AdminReferralAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getReferralAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) return <PageLoader />;

  const d = data || {};
  const maxSignup = d.dailySignups ? Math.max(...d.dailySignups.map(s => s.count || 0), 1) : 1;

  return (
    <>
      <Helmet><title>Referral Analytics - Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Referral Analytics</h1>
          <p className="text-gray-500 mt-1">Track referral program performance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{(d.totalReferrals || 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Referrals</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{(d.activeReferrals || 0).toLocaleString()}</p>
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
                <p className="text-sm text-gray-500">Total Commission</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatPrice(d.totalCommission || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Commission</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{formatPrice(d.pendingCommission || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Referral Level Breakdown</h2>
            </CardHeader>
            <CardBody>
              {d.levelStats?.length > 0 ? (
                <div className="space-y-3">
                  {(d.levelStats || []).map((level, i) => (
                    <div key={level.level || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-${levelColors[i % levelColors.length]}-100 flex items-center justify-center text-${levelColors[i % levelColors.length]}-700 text-sm font-bold`}>
                          L{level.level || i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Level {level.level || i + 1}</p>
                          <p className="text-xs text-gray-500">{level.count || 0} referrals</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatPrice(level.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 text-sm">No level data available</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Daily Signups</h2>
            </CardHeader>
            <CardBody>
              {d.dailySignups?.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-end gap-2 h-40">
                    {(d.dailySignups || []).map((item, i) => {
                      const height = (item.count || 0) / maxSignup * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">{item.count || 0}</span>
                          <div className="w-full bg-accent-200 rounded-t" style={{ height: `${Math.max(height, 4)}%` }}>
                            <div className="w-full bg-accent-500 rounded-t transition-all duration-500" style={{ height: `${height}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 rotate-45 origin-left whitespace-nowrap">{item.date ? formatDate(item.date) : item.label || ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 text-sm">No signup data available</p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Recent Referral Earnings</h2>
          </CardHeader>
          <CardBody>
            {d.recentEarnings?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(d.recentEarnings || []).map((earning, i) => (
                      <tr key={earning._id || i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{earning.referrer?.name || earning.referrerName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{earning.referred?.name || earning.referredName || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatPrice(earning.amount || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="xs">Level {earning.level || 1}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(earning.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 text-sm">No referral earnings yet</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
