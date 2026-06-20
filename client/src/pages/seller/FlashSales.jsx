import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerFlashSales, createSellerFlashSale, updateSellerFlashSale, toggleSellerFlashSale, deleteSellerFlashSale } from '../../store/slices/sellerSlice';
import { fetchSellerProducts } from '../../store/slices/sellerSlice';
import { formatDate, formatDateTime, formatPrice } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const statusBadgeVariant = {
  active: 'success',
  upcoming: 'warning',
  ended: 'secondary',
  inactive: 'secondary',
};

export default function SellerFlashSales() {
  const dispatch = useDispatch();
  const { flashSales, flashSaleStats, isLoading, pagination } = useSelector(state => state.seller);
  const { products: sellerProducts } = useSelector(state => state.seller);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', banner: '',
    startTime: '', endTime: '', productEntries: [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerFlashSales({ page, limit: 20 }));
    dispatch(fetchSellerProducts({ limit: 200 }));
  }, [dispatch, page]);

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ title: '', description: '', banner: '', startTime: '', endTime: '', productEntries: [] });
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
      productEntries: (sale.products || []).map(p => ({
        productId: p.product?._id || p.product || '',
        salePrice: p.salePrice || '',
        quantity: p.quantity || 10,
        maxPerUser: p.maxPerUser || 1,
      })),
    });
    setShowModal(true);
  };

  const addProductEntry = () => {
    setForm(prev => ({
      ...prev,
      productEntries: [...prev.productEntries, { productId: '', salePrice: '', quantity: 10, maxPerUser: 1 }],
    }));
  };

  const removeProductEntry = (idx) => {
    setForm(prev => ({
      ...prev,
      productEntries: prev.productEntries.filter((_, i) => i !== idx),
    }));
  };

  const updateProductEntry = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      productEntries: prev.productEntries.map((entry, i) =>
        i === idx ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const getProductPrice = (productId) => {
    const product = sellerProducts.find(p => p._id === productId);
    return product?.pricing?.sellingPrice || 0;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startTime || !form.endTime || !form.productEntries.length) return;
    if (form.productEntries.some(e => !e.productId || !e.salePrice)) return;
    setSubmitting(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        banner: form.banner,
        startTime: form.startTime,
        endTime: form.endTime,
        productEntries: form.productEntries.map(e => ({
          productId: e.productId,
          salePrice: Number(e.salePrice),
          quantity: Number(e.quantity) || 10,
          maxPerUser: Number(e.maxPerUser) || 1,
        })),
      };
      if (editItem) {
        await dispatch(updateSellerFlashSale({ id: editItem._id, data })).unwrap();
      } else {
        await dispatch(createSellerFlashSale(data)).unwrap();
      }
      setShowModal(false);
      dispatch(fetchSellerFlashSales({ page, limit: 20 }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await dispatch(toggleSellerFlashSale(id)).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await dispatch(deleteSellerFlashSale(deleteModal)).unwrap();
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>Flash Sales | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Flash Sales</h1>
            <p className="text-gray-500 mt-1">Create and manage time-limited sales for your products</p>
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
                <p className="text-2xl font-bold text-green-600 mt-1">{flashSaleStats?.active || 0}</p>
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
                <p className="text-2xl font-bold text-yellow-600 mt-1">{flashSaleStats?.upcoming || 0}</p>
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
                <p className="text-2xl font-bold text-gray-600 mt-1">{flashSaleStats?.ended || 0}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">No flash sales yet</h3>
              <p className="text-gray-500 mb-4">Create your first flash sale to boost your product sales</p>
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
                          {!sale.isOwner && (
                            <span className="text-xs text-gray-400">(shared)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.products?.length || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.startTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.endTime)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[sale.status] || 'secondary'} size="xs">{sale.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {sale.isOwner && (
                              <>
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
                              </>
                            )}
                            {!sale.isOwner && (
                              <span className="text-xs text-gray-400 italic px-2">View only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, pagination.totalItems || 0)} of {pagination.totalItems || 0}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Flash Sale' : 'New Flash Sale'} size="2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Flash sale title" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Sale description" />
          <Input label="Banner URL" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time *" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time *" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Products *</label>
              <Button size="xs" variant="ghost" onClick={addProductEntry}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </Button>
            </div>
            {form.productEntries.length === 0 && (
              <p className="text-sm text-gray-400 py-2">No products added yet. Click "Add Product" to include your products.</p>
            )}
            {form.productEntries.map((entry, idx) => {
              const maxPrice = entry.productId ? getProductPrice(entry.productId) : 0;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 mb-2 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <select
                      className="input-field text-sm w-full mb-2"
                      value={entry.productId}
                      onChange={(e) => {
                        updateProductEntry(idx, 'productId', e.target.value);
                        const price = getProductPrice(e.target.value);
                        if (price && !entry.salePrice) {
                          updateProductEntry(idx, 'salePrice', price);
                        }
                      }}
                    >
                      <option value="">Select product...</option>
                      {sellerProducts.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({formatPrice(p.pricing?.sellingPrice || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Sale Price</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={entry.salePrice}
                          onChange={(e) => updateProductEntry(idx, 'salePrice', e.target.value)}
                          placeholder={`Max: ${maxPrice}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={entry.quantity}
                          onChange={(e) => updateProductEntry(idx, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max/User</label>
                        <input
                          type="number"
                          className="input-field text-sm"
                          value={entry.maxPerUser}
                          onChange={(e) => updateProductEntry(idx, 'maxPerUser', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <Button size="xs" variant="ghost" className="text-red-500 mt-6 flex-shrink-0" onClick={() => removeProductEntry(idx)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.title || !form.startTime || !form.endTime || !form.productEntries.length || form.productEntries.some(e => !e.productId || !e.salePrice)}>
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