import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchSellerDashboard } from '../../store/slices/sellerSlice';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate, classNames } from '../../lib/helpers';

const colorStyles = {
  primary: { text: 'text-primary-600', bg: 'bg-primary-100', icon: 'text-primary-600', light: 'bg-primary-50', dark: 'bg-primary-600', border: 'border-primary-500' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-600', light: 'bg-blue-50', dark: 'bg-blue-600', border: 'border-blue-500' },
  green: { text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-600', light: 'bg-green-50', dark: 'bg-green-600', border: 'border-green-500' },
  accent: { text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-600', light: 'bg-purple-50', dark: 'bg-purple-600', border: 'border-purple-500' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-100', icon: 'text-amber-600', light: 'bg-amber-50', dark: 'bg-amber-600', border: 'border-amber-500' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-100', icon: 'text-teal-600', light: 'bg-teal-50', dark: 'bg-teal-600', border: 'border-teal-500' },
  red: { text: 'text-red-600', bg: 'bg-red-100', icon: 'text-red-600', light: 'bg-red-50', dark: 'bg-red-600', border: 'border-red-500' },
};

const MetricCard = ({ title, value, icon, color = 'primary', link, subtitle, trend }) => {
  const s = colorStyles[color] || colorStyles.primary;

  return (
    <div className={classNames(
      'relative bg-white rounded-xl border border-gray-100 p-4 sm:p-5',
      'hover:shadow-lg hover:border-gray-200 transition-all duration-200',
      'group overflow-hidden'
    )}>
      <div className={classNames('absolute top-0 left-0 right-0 h-1', s.dark)} />
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate mb-1">{title}</p>
          <p className={classNames('text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight', s.text)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={classNames('text-xs mt-1.5 flex items-center gap-1 font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={trend >= 0 ? 'M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z' : 'M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
              </svg>
              {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={classNames('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', s.light, 'group-hover:scale-110 transition-transform duration-200')}>
          <svg className={classNames('w-5 h-5 sm:w-6 sm:h-6', s.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      {link && (
        <Link to={link} className="inline-flex items-center gap-1 mt-3 sm:mt-4 text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors">
          View details
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      )}
    </div>
  );
};

const QuickActionCard = ({ to, icon, label, color = 'primary' }) => {
  const s = colorStyles[color] || colorStyles.primary;

  return (
    <Link
      to={to}
      className={classNames(
        'relative p-3 sm:p-4 rounded-xl border border-transparent transition-all duration-200',
        s.light, 'hover:scale-[1.02] active:scale-[0.98]',
        'hover:shadow-md group'
      )}
    >
      <div className={classNames('w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3', s.bg, 'group-hover:scale-110 transition-transform')}>
        <svg className={classNames('w-4 h-4 sm:w-5 sm:h-5', s.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <p className={classNames('text-xs sm:text-sm font-semibold', s.text)}>{label}</p>
    </Link>
  );
};

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { dashboard, isLoading } = useSelector(state => state.seller);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchSellerDashboard());
  }, [dispatch]);

  if (isLoading && !dashboard) return <PageLoader />;

  const stats = dashboard || { totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalEarnings: 0, pendingOrders: 0, lowStockProducts: 0 };

  const maxRevenue = stats.revenueChart?.length > 0
    ? Math.max(...stats.revenueChart.map(d => d.revenue || 0), 1)
    : 1;

  const hasAlerts = (stats.pendingOrders || 0) > 0 || (stats.lowStockProducts || 0) > 0;

  return (
    <>
      <Helmet><title>Seller Dashboard | Zalnio</title></Helmet>

      <div className="space-y-5 sm:space-y-6 lg:space-y-8">
        {isLoading && (
          <div className="flex items-center gap-2 p-3 sm:p-4 bg-primary-50 text-primary-700 rounded-xl text-sm border border-primary-100">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Refreshing data...
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-gray-900 truncate">
              Welcome back, {user?.name || 'Seller'}!
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Here's what's happening with your store today.</p>
          </div>
          <Link
            to="/seller/products/add"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add Product</span>
          </Link>
        </div>

        {/* Alert Banner */}
        {hasAlerts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(stats.pendingOrders || 0) > 0 && (
              <Link to="/seller/orders" className="flex items-center gap-3 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-amber-800">{stats.pendingOrders} Pending Order{stats.pendingOrders > 1 ? 's' : ''}</p>
                  <p className="text-xs sm:text-sm text-amber-600">Requires your attention</p>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:text-amber-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
            {(stats.lowStockProducts || 0) > 0 && (
              <Link to="/seller/products" className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-red-800">{stats.lowStockProducts} Low Stock Product{stats.lowStockProducts > 1 ? 's' : ''}</p>
                  <p className="text-xs sm:text-sm text-red-600">Restock soon</p>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <MetricCard title="Total Products" value={stats.totalProducts?.toLocaleString()} color="primary" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" link="/seller/products" />
          <MetricCard title="Total Orders" value={stats.totalOrders?.toLocaleString()} color="blue" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" link="/seller/orders" />
          <MetricCard title="Revenue (30d)" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="green" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <MetricCard title="Total Earnings" value={`₹${(stats.totalEarnings || 0).toLocaleString()}`} color="accent" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </div>

        {/* Charts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <Card className="overflow-hidden">
            <div className="p-4 sm:p-5 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">Revenue</h2>
              <p className="text-xs text-gray-400 mb-4 sm:mb-5">Last 30 days performance</p>
              {stats.revenueChart?.length > 0 ? (
                <div className="h-40 sm:h-48 lg:h-56 flex items-end gap-px sm:gap-0.5 pb-1 overflow-x-auto scrollbar-hide">
                  {stats.revenueChart.map((d, i) => {
                    const pct = (d.revenue || 0) / maxRevenue * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-[16px] sm:min-w-[20px]">
                        <div className="w-full rounded-t-sm transition-all duration-300 relative" style={{ height: `${Math.max(pct, 2)}%` }}>
                          <div className={classNames(
                            'w-full h-full rounded-t-sm transition-all duration-300',
                            i === stats.revenueChart.length - 1 ? 'bg-primary-500' : 'bg-primary-200 hover:bg-primary-400'
                          )} />
                          <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-10 shadow-lg pointer-events-none">
                            {formatPrice(d.revenue || 0)}
                          </div>
                        </div>
                        <span className="text-[8px] sm:text-[10px] text-gray-400 mt-1 truncate max-w-full">
                          {d.label || d.date ? new Date(d.date || d.label).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-400">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <p className="text-sm font-medium">No revenue data yet</p>
                  <p className="text-xs mt-1">Data will appear once you start selling</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-5 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1">Quick Actions</h2>
              <p className="text-xs text-gray-400 mb-4 sm:mb-5">Frequently used tools</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <QuickActionCard to="/seller/products/add" icon="M12 6v6m0 0v6m0-6h6m-6 0H6" label="Add Product" color="primary" />
                <QuickActionCard to="/seller/products" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" label="Products" color="blue" />
                <QuickActionCard to="/seller/orders" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" label="Orders" color="green" />
                <QuickActionCard to="/seller/analytics" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" label="Analytics" color="accent" />
                <QuickActionCard to="/seller/wallet" icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" label="Wallet" color="amber" />
                <QuickActionCard to="/seller/earnings" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Earnings" color="teal" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-xs text-gray-400 mt-0.5">Latest {stats.recentOrders?.length || 0} transactions</p>
              </div>
              <Link to="/seller/orders" className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0 ml-2">
                View All
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            {stats.recentOrders?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentOrders.map((order, idx) => (
                  <Link
                    key={order._id}
                    to={`/seller/orders`}
                    className="flex items-center justify-between py-3 sm:py-3.5 first:pt-0 last:pb-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-500">#{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">#{order._id?.slice(-8)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900">{formatPrice(order.total || 0)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-400">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="text-sm font-medium">No orders yet</p>
                <p className="text-xs mt-1">Orders will appear here once customers purchase</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
