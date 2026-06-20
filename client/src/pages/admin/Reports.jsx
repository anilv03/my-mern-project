import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const tabs = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'products', label: 'Products' },
  { id: 'users', label: 'Users' },
  { id: 'financial', label: 'Financial' },
];

const dateRanges = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [financialData, setFinancialData] = useState(null);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, dateRange]);

  const fetchTabData = async () => {
    setIsLoading(true);
    try {
      const params = { days: dateRange };
      switch (activeTab) {
        case 'revenue': {
          const res = await adminService.getReportsRevenue(params);
          setRevenueData(res);
          break;
        }
        case 'products': {
          const res = await adminService.getReportsProducts(params);
          setProductsData(res);
          break;
        }
        case 'users': {
          const res = await adminService.getReportsUsers(params);
          setUsersData(res);
          break;
        }
        case 'financial': {
          const res = await adminService.getReportsFinancial(params);
          setFinancialData(res);
          break;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const TabButton = ({ tab }) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={classNames(
        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
        activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {tab.label}
    </button>
  );

  const ChartBars = ({ data, dataKey = 'value', labelKey = 'label' }) => {
    if (!data?.length) return <p className="text-center py-8 text-gray-500 text-sm">No data available</p>;
    const maxVal = Math.max(...data.map(d => d[dataKey] || 0), 1);
    return (
      <div className="flex items-end gap-2 h-48 mt-4">
        {data.map((item, i) => {
          const height = (item[dataKey] || 0) / maxVal * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{item[dataKey]?.toLocaleString?.() || item[dataKey]}</span>
              <div className="w-full bg-primary-200 rounded-t" style={{ height: `${Math.max(height, 4)}%` }}>
                <div className="w-full bg-primary-600 rounded-t transition-all duration-500" style={{ height: `${height}%` }} />
              </div>
              <span className="text-xs text-gray-500 text-center truncate w-full">{item[labelKey] || ''}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Helmet><title>Reports - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 mt-1">Analytics and performance reports</p>
          </div>
          <div className="flex items-center gap-2">
            {dateRanges.map(r => (
              <button
                key={r.value}
                onClick={() => setDateRange(r.value)}
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  dateRange === r.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(revenueData?.totalRevenue || 0)}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{(revenueData?.totalOrders || 0).toLocaleString()}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(revenueData?.avgOrderValue || 0)}</p>
                  </Card>
                </div>
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Revenue Over Time</h2></CardHeader>
                  <CardBody>
                    <ChartBars data={revenueData?.dailyRevenue || revenueData?.chartData} dataKey="revenue" labelKey="date" />
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2></CardHeader>
                  <CardBody>
                    {productsData?.topProducts?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {productsData.topProducts.map((p, i) => (
                              <tr key={p._id || i} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.title || p.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.sold || p.sales || 0}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(p.revenue || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500 text-sm">No product data available</p>
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2></CardHeader>
                  <CardBody>
                    {productsData?.categoryBreakdown?.length > 0 ? (
                      <div className="space-y-3">
                        {productsData.categoryBreakdown.map((cat, i) => (
                          <div key={cat._id || cat.category || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{cat.category || cat.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">{cat.count || 0} products</span>
                              <span className="text-sm font-semibold text-gray-900">{formatPrice(cat.revenue || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500 text-sm">No category data available</p>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{(usersData?.totalUsers || 0).toLocaleString()}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-500">New Users</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{(usersData?.newUsers || 0).toLocaleString()}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-500">Customers</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{(usersData?.byRole?.customer || 0).toLocaleString()}</p>
                  </Card>
                  <Card>
                    <p className="text-sm text-gray-500">Sellers</p>
                    <p className="text-2xl font-bold text-accent-600 mt-1">{(usersData?.byRole?.seller || 0).toLocaleString()}</p>
                  </Card>
                </div>
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Daily Signups</h2></CardHeader>
                  <CardBody>
                    <ChartBars data={usersData?.dailySignups || usersData?.chartData} dataKey="count" labelKey="date" />
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Transaction Breakdown</h2></CardHeader>
                  <CardBody>
                    {financialData?.transactionBreakdown?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {financialData.transactionBreakdown.map((tx, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <Badge variant={tx.type === 'credit' ? 'success' : 'danger'} size="xs">{tx.type}</Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{tx.count || 0}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(tx.total || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500 text-sm">No transaction data available</p>
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-gray-900">Daily Credits & Debits</h2></CardHeader>
                  <CardBody>
                    {financialData?.dailyTransactions?.length > 0 ? (
                      <div className="flex items-end gap-2 h-48 mt-4">
                        {financialData.dailyTransactions.map((item, i) => {
                          const maxVal = Math.max(item.credits || 0, item.debits || 0, 1);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="flex gap-1 w-full h-full items-end">
                                <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${((item.credits || 0) / maxVal) * 100}%` }} title={`Credits: ${formatPrice(item.credits)}`} />
                                <div className="flex-1 bg-red-400 rounded-t" style={{ height: `${((item.debits || 0) / maxVal) * 100}%` }} title={`Debits: ${formatPrice(item.debits)}`} />
                              </div>
                              <span className="text-xs text-gray-500">{item.date || item.label || ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500 text-sm">No daily transaction data available</p>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
