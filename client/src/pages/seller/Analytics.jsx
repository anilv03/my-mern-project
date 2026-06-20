import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerAnalytics } from '../../store/slices/sellerSlice';
import Card, { CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice } from '../../lib/helpers';

const dateRangeOptions = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
];

export default function SellerAnalytics() {
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector(state => state.seller);
  const [days, setDays] = useState(30);

  useEffect(() => {
    dispatch(fetchSellerAnalytics({ days }));
  }, [dispatch, days]);

  if (isLoading && !analytics) return <PageLoader />;

  const data = analytics || {};

  const maxRevenue = data.revenueChart?.length > 0
    ? Math.max(...data.revenueChart.map(d => d.revenue || 0), 1)
    : 1;

  return (
    <>
      <Helmet><title>Analytics - Seller Dashboard | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Track your store performance</p>
          </div>
          <div className="flex items-center gap-2">
            {dateRangeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  days === opt.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardBody>
                  <p className="text-gray-500 text-sm">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {(data.totalViews || 0).toLocaleString()}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-gray-500 text-sm">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {(data.totalSales || 0).toLocaleString()}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {formatPrice(data.totalRevenue || 0)}
                  </p>
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last {days} Days)</h2>
                {data.revenueChart?.length > 0 ? (
                  <div className="h-64 flex items-end gap-1.5 pb-1">
                    {data.revenueChart.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full bg-primary-100 rounded-t relative" style={{ height: `${Math.max((d.revenue || 0) / maxRevenue * 100, 1)}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                            {formatPrice(d.revenue || 0)}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 rotate-45 origin-left whitespace-nowrap">
                          {d.label || d.date ? new Date(d.date || d.label).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-8 text-center">No revenue data for this period</p>
                )}
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
                {data.categoryBreakdown?.length > 0 ? (
                  <div className="space-y-4">
                    {data.categoryBreakdown.map((cat, i) => {
                      const totalCat = data.categoryBreakdown.reduce((s, c) => s + (c.count || 0), 0) || 1;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700">{cat.name || cat.category?.name || 'Unknown'}</span>
                            <span className="font-medium text-gray-900">{cat.count || 0}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all"
                              style={{ width: `${(cat.count || 0) / totalCat * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-8 text-center">No category data</p>
                )}
              </Card>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
              {data.topProducts?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Sold</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.topProducts.map((item, i) => (
                        <tr key={item._id || i} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                {item.product?.images?.[0]?.url ? (
                                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-gray-900 truncate max-w-[250px]">
                                {item.product?.title || item.title || 'Product'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.product?.category?.name || item.category || '-'}</td>
                          <td className="py-3 px-4 text-right font-medium">{item.count || item.sold || 0}</td>
                          <td className="py-3 px-4 text-right font-medium text-green-600">{formatPrice(item.revenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-8 text-center">No product sales data</p>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}
