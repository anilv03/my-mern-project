import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../store/slices/adminSlice';
import { formatDate, formatDateTime, formatPrice, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const statusTabs = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const typeTabs = ['', 'digital', 'physical'];

const statusVariant = {
  pending: 'warning', confirmed: 'info', processing: 'primary',
  shipped: 'purple', delivered: 'success', cancelled: 'danger', refunded: 'secondary', failed: 'danger',
};

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function exportToCsv(orders, filename) {
  const headers = ['Order#', 'Customer', 'Email', 'Date', 'Type', 'Items', 'Total', 'Payment', 'Status', 'Shipping Name', 'Shipping Phone', 'City', 'State'];
  const rows = orders.map(o => [
    o.orderNumber || o._id?.slice(-8),
    o.user?.name || o.shippingAddress?.name || '',
    o.user?.email || '',
    formatDate(o.createdAt),
    o.orderType || (o.items?.some(i => ['new_book', 'used_book'].includes(i.product?.productType)) ? 'physical' : 'digital'),
    o.items?.length || 0,
    o.total || o.pricing?.total || 0,
    o.payment?.status || o.paymentStatus || '',
    o.status,
    o.shippingAddress?.name || '',
    o.shippingAddress?.phone || '',
    o.shippingAddress?.city || '',
    o.shippingAddress?.state || '',
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { orders, orderTypeStats, isLoading, pagination } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusMenu, setStatusMenu] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchAdminOrders({
      page,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }));
  }, [dispatch, page, statusFilter, typeFilter, search, startDate, endDate]);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const getNextStatuses = (current) => {
    const idx = statusFlow.indexOf(current);
    if (idx === -1 || idx >= statusFlow.length - 1) return [];
    return statusFlow.slice(idx + 1);
  };

  const totalOrders = Object.values(orderTypeStats).reduce((a, b) => a + b, 0);

  return (
    <>
      <Helmet><title>Orders | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500 mt-1">Manage all platform orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportToCsv(orders, `orders-export-${Date.now()}`)} disabled={orders.length === 0}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-3"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold">{totalOrders}</p></Card>
          <Card className="p-3"><p className="text-xs text-gray-500">Digital</p><p className="text-lg font-bold text-blue-600">{orderTypeStats.digital || 0}</p></Card>
          <Card className="p-3"><p className="text-xs text-gray-500">Physical</p><p className="text-lg font-bold text-purple-600">{orderTypeStats.physical || 0}</p></Card>
          <Card className="p-3"><p className="text-xs text-gray-500">Mixed</p><p className="text-lg font-bold text-gray-600">{orderTypeStats.mixed || 0}</p></Card>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1 bg-white border rounded-lg px-3 py-1.5 flex-1 min-w-[200px] max-w-sm">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by order#, customer name, email..."
              className="flex-1 border-0 outline-none text-sm py-1"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="input-field text-sm" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="input-field text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {typeTabs.map(type => (
            <button key={type} onClick={() => { setTypeFilter(type); setPage(1); }}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                typeFilter === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All Types'}
            </button>
          ))}
          <span className="w-px h-6 bg-gray-200 mx-1" />
          {statusTabs.map(status => (
            <button key={status} onClick={() => { setStatusFilter(status); setPage(1); }}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map(order => {
                      const orderType = order.orderType || (order.items?.some(i => ['new_book', 'used_book'].includes(i.product?.productType)) ? 'physical' : 'digital');
                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedOrder(order)} className="text-sm font-medium text-primary-600 hover:underline">
                              #{order.orderNumber || order._id?.slice(-8)}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.user?.name || order.shippingAddress?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={orderType === 'physical' ? 'purple' : 'info'} size="xs">{orderType}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || order.itemCount || 0}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(order.total || order.pricing?.total)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[order.payment?.status || order.paymentStatus] || 'secondary'} size="xs">
                              {order.payment?.status || order.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              statusVariant[order.status] ? `bg-${statusVariant[order.status]}-100 text-${statusVariant[order.status]}-700` : 'bg-gray-100 text-gray-700'
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 relative">
                            <div className="flex items-center gap-1">
                              {getNextStatuses(order.status).length > 0 && (
                                <div className="relative">
                                  <Button size="xs" variant="ghost" onClick={() => setStatusMenu(statusMenu === order._id ? null : order._id)} title="Update Status">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                  </Button>
                                  {statusMenu === order._id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 min-w-[140px]">
                                      {getNextStatuses(order.status).map(s => (
                                        <button key={s} onClick={() => { dispatch(updateAdminOrderStatus({ id: order._id, status: s, items: order.items })); setStatusMenu(null); }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                                        >
                                          {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <Button size="xs" variant="ghost" onClick={() => setSelectedOrder(order)} title="View Details">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination?.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * pagination.limit) + 1}-{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?._id?.slice(-8)}`} size="lg">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Order Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                <Badge variant={statusVariant[selectedOrder.payment?.status || selectedOrder.paymentStatus] || 'secondary'} size="sm">
                  {selectedOrder.payment?.status || selectedOrder.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Order Status</p>
                <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  statusVariant[selectedOrder.status] ? `bg-${statusVariant[selectedOrder.status]}-100 text-${statusVariant[selectedOrder.status]}-700` : 'bg-gray-100 text-gray-700'
                )}>{selectedOrder.status}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(selectedOrder.total || selectedOrder.pricing?.total)}</p>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress.name}<br />
                  {selectedOrder.shippingAddress.address}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}<br />
                  {selectedOrder.shippingAddress.phone}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Order Items ({selectedOrder.items?.length || 0})</h4>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item, i) => (
                  <div key={item._id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {item.product?.images?.[0]?.url && (
                      <img src={item.product.images[0].url} alt="" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title || item.name || item.product?.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1} x {formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
