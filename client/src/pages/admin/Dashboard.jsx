import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchAdminDashboard } from '../../store/slices/adminSlice';
import { formatPrice, formatDate, getTimeAgo, classNames } from '../../lib/helpers';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';

const colorStyles = {
  primary: { text: 'text-primary-600', bg: 'bg-primary-100', icon: 'text-primary-600', light: 'bg-primary-50', hover: 'hover:bg-primary-100', label: 'text-primary-700' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100', icon: 'text-blue-600', light: 'bg-blue-50', hover: 'hover:bg-blue-100', label: 'text-blue-700' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100', icon: 'text-indigo-600', light: 'bg-indigo-50', hover: 'hover:bg-indigo-100', label: 'text-indigo-700' },
  accent: { text: 'text-purple-600', bg: 'bg-purple-100', icon: 'text-purple-600', light: 'bg-purple-50', hover: 'hover:bg-purple-100', label: 'text-purple-700' },
  green: { text: 'text-green-600', bg: 'bg-green-100', icon: 'text-green-600', light: 'bg-green-50', hover: 'hover:bg-green-100', label: 'text-green-700' },
  warning: { text: 'text-yellow-600', bg: 'bg-yellow-100', icon: 'text-yellow-600', light: 'bg-yellow-50', hover: 'hover:bg-yellow-100', label: 'text-yellow-700' },
};

const quickActions = [
  { label: 'Create Coupon', path: '/admin/coupons', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'primary' },
  { label: 'Send Notification', path: '/admin/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'blue' },
  { label: 'View Orders', path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'indigo' },
  { label: 'Manage Sellers', path: '/admin/sellers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'accent' },
  { label: 'Manage Roles', path: '/admin/roles', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'warning' },
];

const statCards = [
  { key: 'totalUsers', label: 'Total Users', color: 'primary', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', link: '/admin/users' },
  { key: 'totalSellers', label: 'Total Sellers', color: 'blue', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', link: '/admin/sellers' },
  { key: 'totalProducts', label: 'Total Products', color: 'accent', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', link: '/admin/products' },
  { key: 'totalOrders', label: 'Total Orders', color: 'indigo', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', link: '/admin/orders' },
  { key: 'totalRevenue', label: 'Total Revenue', color: 'green', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'pendingApprovals', label: 'Pending Approvals', color: 'warning', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', link: '/admin/sellers' },
];

const StatCard = ({ label, value, icon, color, trend, link }) => {
  const styles = colorStyles[color] || colorStyles.primary;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className={classNames('text-2xl font-bold mt-1', styles.text)}>{value}</p>
          {trend !== undefined && (
            <p className={classNames('text-xs mt-1 flex items-center gap-1', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={trend >= 0 ? 'M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z' : 'M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
              </svg>
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', styles.bg)}>
          <svg className={classNames('w-6 h-6', styles.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
        </div>
      </div>
      {link && (
        <Link to={link} className="block mt-3 text-xs text-primary-600 hover:underline font-medium">View details</Link>
      )}
    </Card>
  );
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { dashboard, isLoading } = useSelector(state => state.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (isLoading && !dashboard) return <PageLoader />;

  const d = dashboard || {};

  const getValue = (key) => {
    const val = d[key];
    if (val && typeof val === 'object') {
      if (key === 'totalRevenue') return formatPrice(val.revenue ?? val.count ?? 0);
      return (val.count ?? 0).toLocaleString();
    }
    if (key === 'totalRevenue') return formatPrice(val || 0);
    if (typeof val === 'number') return val.toLocaleString();
    return val ?? 0;
  };

  const maxRevenue = d.revenueData ? Math.max(...d.revenueData.map(r => r.revenue || r.value || 0), 1) : 1;

  return (
    <>
      <Helmet><title>Dashboard | Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Overview of your marketplace</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {statCards.map(s => (
            <StatCard key={s.key} label={s.label} value={getValue(s.key)} icon={s.icon} color={s.color} trend={d[`${s.key}Trend`]} link={s.link} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Overview (Last 30 Days)</h2>
              </CardHeader>
              <CardBody>
                {d.revenueData?.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
                      {d.revenueData.map((item, i) => {
                        const height = (item.revenue || item.value || 0) / maxRevenue * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{formatPrice(item.revenue || item.value || 0)}</span>
                            <div
                              className="w-full bg-primary-200 rounded-t"
                              style={{ height: `${Math.max(height, 4)}%` }}
                            >
                              <div
                                className="w-full bg-primary-600 rounded-t transition-all duration-500"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-full">{item.label || item.month || ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500 text-sm">No revenue data available</p>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map(action => {
                    const s = colorStyles[action.color] || colorStyles.primary;
                    return (
                      <Link key={action.label} to={action.path}>
                        <div className={classNames('flex flex-col items-center gap-2 p-3 rounded-xl transition-colors text-center', s.light, s.hover)}>
                          <svg className={classNames('w-6 h-6', s.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
                          </svg>
                          <span className={classNames('text-xs font-medium', s.label)}>{action.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Top Selling Products</h2>
              </CardHeader>
              <CardBody>
                {d.topProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {d.topProducts.slice(0, 5).map((product, i) => (
                      <div key={product._id || i} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title || product.name}</p>
                          <p className="text-xs text-gray-500">{typeof product.sales === 'object' ? (product.sales.count ?? 0) : (product.sales || product.sold || 0)} sold</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatPrice(product.revenue || product.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500 text-sm">No data yet</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline flex-shrink-0 ml-2">View All</Link>
              </div>
            </CardHeader>
            <CardBody>
              {d.recentOrders?.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {d.recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">#{order._id?.slice(-8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">{order.user?.name || order.customerName || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap hidden sm:table-cell">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatPrice(order.total)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'} size="xs">
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 text-sm">No recent orders</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Users</h2>
                  <p className="text-xs text-gray-400 mt-0.5">By role: {d.roleDistribution ? Object.entries(d.roleDistribution).map(([role, count]) => `${role}: ${count}`).join(' | ') : ''}</p>
                </div>
                <Link to="/admin/users" className="text-sm text-primary-600 hover:underline flex-shrink-0 ml-2">View All</Link>
              </div>
            </CardHeader>
            <CardBody>
              {d.recentUsers?.length > 0 ? (
                <div className="space-y-3">
                  {d.recentUsers.slice(0, 5).map((u, i) => {
                    const roleColors = {
                      admin: { variant: 'primary', label: 'Admin', dot: 'bg-primary-500' },
                      seller: { variant: 'accent', label: 'Seller', dot: 'bg-purple-500' },
                      user: { variant: 'secondary', label: 'User', dot: 'bg-gray-500' },
                      customer: { variant: 'secondary', label: 'Customer', dot: 'bg-gray-500' },
                    };
                    const rc = roleColors[u.role] || { variant: 'secondary', label: u.role || 'Customer', dot: 'bg-gray-500' };
                    return (
                      <div key={u._id || i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0 group-hover:scale-105 transition-transform">
                          {u.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{u.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email || ''}</p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <span className={classNames(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium',
                            rc.variant === 'primary' ? 'bg-primary-50 text-primary-700' :
                            rc.variant === 'accent' ? 'bg-purple-50 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            <span className={classNames('w-1.5 h-1.5 rounded-full', rc.dot)} />
                            {rc.label}
                          </span>
                          <p className="text-[10px] text-gray-400 hidden sm:block">{getTimeAgo(u.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <p className="text-sm font-medium">No user data available</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
