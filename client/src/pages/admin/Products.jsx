import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchAdminProducts, updateProductStatus, updateAdminProduct } from '../../store/slices/adminSlice';
import { formatDate, formatPrice, getProductTypeLabel, classNames } from '../../lib/helpers';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ImageViewer from '../../components/ui/ImageViewer';
import { PageLoader } from '../../components/ui/Loader';

const statusTabs = ['', 'draft', 'pending', 'published', 'rejected', 'archived'];

const statusBadgeVariant = {
  draft: 'secondary',
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
  archived: 'secondary',
};

export default function AdminProducts() {
  const dispatch = useDispatch();
  const { products, isLoading, pagination } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editForm, setEditForm] = useState({
    title: '', description: '', sellingPrice: '', originalPrice: '',
    quantity: '', status: 'draft', tags: '', category: '',
  });
  const [editError, setEditError] = useState('');

  useEffect(() => {
    dispatch(fetchAdminProducts({
      page,
      status: statusFilter || undefined,
    }));
  }, [dispatch, page, statusFilter]);

  const handleApprove = (id) => {
    dispatch(updateProductStatus({ id, status: 'published' }));
  };

  const handleReject = () => {
    if (rejectModal) {
      dispatch(updateProductStatus({ id: rejectModal, status: 'rejected', reason: rejectReason }));
      setRejectModal(null);
      setRejectReason('');
    }
  };

  const handleArchive = (id) => {
    dispatch(updateProductStatus({ id, status: 'archived' }));
  };

  const handleRestore = (id) => {
    dispatch(updateProductStatus({ id, status: 'published' }));
  };

  useEffect(() => {
    adminService.getCategories().then(res => {
      if (Array.isArray(res)) setCategories(res);
      else if (res?.categories) setCategories(res.categories);
    }).catch(() => {});
  }, []);

  const handleEditOpen = (product) => {
    setEditForm({
      title: product.title || '',
      description: product.description || '',
      sellingPrice: product.pricing?.sellingPrice || product.price || '',
      originalPrice: product.pricing?.originalPrice || '',
      quantity: product.inventory?.quantity ?? '',
      status: product.status || 'draft',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      category: product.category?._id || product.category || '',
    });
    setEditError('');
    setEditModal(product._id);
  };

  const handleEditSave = async () => {
    const id = editModal;
    if (!id) return;
    if (!editForm.title.trim()) { setEditError('Title is required'); return; }
    setEditError('');
    const data = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      pricing: {
        sellingPrice: parseFloat(editForm.sellingPrice) || 0,
        originalPrice: parseFloat(editForm.originalPrice) || 0,
      },
      inventory: { quantity: parseInt(editForm.quantity) || 0 },
      status: editForm.status,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      category: editForm.category || undefined,
    };
    const result = await dispatch(updateAdminProduct({ id, data }));
    if (result.meta.requestStatus === 'fulfilled') {
      setEditModal(null);
    }
  };

  const pendingCount = products.filter(p => p.status === 'pending').length;
  const publishedCount = products.filter(p => p.status === 'published').length;
  const rejectedCount = products.filter(p => p.status === 'rejected').length;
  const draftCount = products.filter(p => p.status === 'draft').length;

  return (
    <>
      <Helmet><title>Products | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 mt-1">Manage and review products</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{publishedCount}</p>
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
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{draftCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
            {statusTabs.map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={classNames(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map(product => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {product.images?.[0]?.url ? (
                                <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <button onClick={() => setDetailModal(product)} className="text-sm font-medium text-gray-900 truncate max-w-[200px] hover:text-primary-600 text-left">{product.title}</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">{product.seller?.name || product.seller?.store?.name || 'N/A'}</p>
                          {product.seller?.email && <p className="text-xs text-gray-400">{product.seller.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="xs">{getProductTypeLabel(product.productType)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(product.pricing?.sellingPrice || product.price || 0)}</p>
                          {product.pricing?.originalPrice && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(product.pricing.originalPrice)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[product.status] || 'secondary'} size="xs">
                            {product.status}
                          </Badge>
                          {product.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[120px]" title={product.rejectionReason}>Reason: {product.rejectionReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(product.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="ghost" onClick={() => handleEditOpen(product)} title="Edit Product">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => setDetailModal(product)} title="View Details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                            {product.status === 'pending' && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleApprove(product._id)} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(product._id); setRejectReason(''); }} title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </>
                            )}
                            {(product.status === 'published') && (
                              <Button size="xs" variant="ghost" onClick={() => handleArchive(product._id)} title="Archive">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </Button>
                            )}
                            {(product.status === 'rejected' || product.status === 'archived') && (
                              <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleRestore(product._id)} title="Restore">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </Button>
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
                    Showing {((page - 1) * pagination.limit) + 1}-{Math.min(page * pagination.limit, pagination.totalItems)} of {pagination.totalItems}
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

      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title || 'Product Details'} size="lg">
        {detailModal && (
          <div className="space-y-4">
            {detailModal.images?.[0]?.url && (
              <img
                src={detailModal.images[0].url} alt=""
                className="w-full h-48 object-cover rounded-lg cursor-pointer"
                onClick={() => setImageViewer(detailModal.images.map(img => ({ url: img.url, alt: detailModal.title })))}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Product Type</p>
                <Badge variant="primary" size="sm">{getProductTypeLabel(detailModal.productType)}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={statusBadgeVariant[detailModal.status] || 'secondary'} size="sm">{detailModal.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-sm font-semibold text-gray-900">{formatPrice(detailModal.pricing?.sellingPrice || detailModal.price || 0)}</p>
                {detailModal.pricing?.originalPrice && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(detailModal.pricing.originalPrice)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Seller</p>
                <p className="text-sm text-gray-900">{detailModal.seller?.name || detailModal.seller?.store?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-900">{formatDate(detailModal.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Views</p>
                <p className="text-sm text-gray-900">{detailModal.views || detailModal.viewCount || 0}</p>
              </div>
            </div>
            {detailModal.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailModal.description}</p>
              </div>
            )}
            {detailModal.rejectionReason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{detailModal.rejectionReason}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setDetailModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {imageViewer && (
        <ImageViewer images={imageViewer} onClose={() => setImageViewer(null)} />
      )}

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Product" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this product.</p>
          <Input label="Rejection Reason *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Missing required documentation" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Product" size="3xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Title *" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Product title" />
            <Input label="Selling Price" type="number" step="0.01" value={editForm.sellingPrice} onChange={(e) => setEditForm(f => ({ ...f, sellingPrice: e.target.value }))} placeholder="0.00" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))} className="input-field w-full">
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Input label="Original Price" type="number" step="0.01" value={editForm.originalPrice} onChange={(e) => setEditForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="0.00" />
            <Input label="Stock Quantity" type="number" value={editForm.quantity} onChange={(e) => setEditForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={editForm.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))} className="input-field w-full">
                <option value="">No change</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} rows={4} className="input-field w-full resize-y" placeholder="Product description" />
          </div>
          <Input label="Tags (comma separated)" value={editForm.tags} onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2, tag3" />
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave} disabled={isLoading}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
