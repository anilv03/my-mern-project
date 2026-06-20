import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusBadgeVariant = {
  active: 'success',
  upcoming: 'warning',
  ended: 'secondary',
};

export default function AdminFlashSales() {
  const [flashSales, setFlashSales] = useState([]);
  const [stats, setStats] = useState({ active: 0, upcoming: 0, ended: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', banner: '',
    startTime: '', endTime: '', products: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    fetchFlashSales();
  }, [page]);

  const fetchFlashSales = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await adminService.getFlashSales({ page, limit: perPage });
      setFlashSales(res.sales || []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalItems(res.pagination?.total || 0);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load flash sales';
      setError(msg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ title: '', description: '', banner: '', startTime: '', endTime: '', products: '' });
    setShowModal(true);
  };

  const openEditModal = (sale) => {
    setEditItem(sale);
    setForm({
      title: sale.title || '',
      description: sale.description || '',
      banner: sale.banner?.url || sale.banner || '',
      startTime: sale.startTime ? new Date(sale.startTime).toISOString().slice(0, 16) : '',
      endTime: sale.endTime ? new Date(sale.endTime).toISOString().slice(0, 16) : '',
      products: sale.products?.map(p => p.product?._id || p.productId || p._id).join(', ') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startTime || !form.endTime) return;
    setSubmitting(true);
    setError('');
    try {
      const data = {
        ...form,
        productIds: form.products ? form.products.split(',').map(s => s.trim()).filter(Boolean) : [],
        products: undefined,
      };
      if (editItem) {
        await adminService.updateFlashSale(editItem._id, data);
      } else {
        await adminService.createFlashSale(data);
      }
      setShowModal(false);
      fetchFlashSales();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setError(msg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    setError('');
    try {
      await adminService.toggleFlashSale(id);
      fetchFlashSales();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle';
      setError(msg);
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setError('');
    try {
      await adminService.deleteFlashSale(deleteModal);
      setDeleteModal(null);
      fetchFlashSales();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete';
      setError(msg);
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Flash Sales - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Flash Sales</h1>
            <p className="text-gray-500 mt-1">Manage time-limited sales and promotions</p>
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Flash Sale
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.upcoming || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ended</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.ended || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : flashSales.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No flash sales</h3>
              <p className="text-gray-500 mb-4">Create your first flash sale to start promoting products</p>
              <Button onClick={openCreateModal}>New Flash Sale</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {flashSales.map(sale => (
                      <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{sale.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.products?.length || sale.productCount || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.startTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.endTime)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[sale.status] || 'secondary'} size="xs">{sale.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="ghost" onClick={() => openEditModal(sale)} title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => handleToggle(sale._id)} title={sale.isActive ? 'Deactivate' : 'Activate'}>
                              <svg className={`w-4 h-4 ${sale.isActive ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sale.isActive ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                              </svg>
                            </Button>
                            <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteModal(sale._id)} title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Flash Sale' : 'New Flash Sale'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
              <button className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0" onClick={() => setError('')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Flash sale title" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Sale description" />
          <Input label="Banner URL" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time *" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time *" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Input label="Product IDs (comma separated)" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} placeholder="prod1, prod2, prod3" helperText="Enter product IDs with sale prices" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.title || !form.startTime || !form.endTime}>
              {editItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Flash Sale" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this flash sale? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
