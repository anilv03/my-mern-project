import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, formatPrice, getProductTypeLabel, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ImageViewer from '../../components/ui/ImageViewer';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'approved', 'rejected'];

const statusBadgeVariant = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export default function AdminProductApprovalWorkflow() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [batchRejectModal, setBatchRejectModal] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: perPage, status: statusFilter || undefined };
      const res = await adminService.getProductApprovals(params);
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { setPage(1); setSelectedProducts([]); setSelectAll(false); }, [statusFilter]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(products.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  }, [selectAll, products]);

  const toggleProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleApprove = async (id) => {
    try {
      await adminService.batchApproveProducts([id]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminService.batchRejectProducts([rejectModal], rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedProducts.length === 0) return;
    setSubmitting(true);
    try {
      await adminService.batchApproveProducts(selectedProducts);
      setSelectedProducts([]);
      setSelectAll(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedProducts.length === 0) return;
    setSubmitting(true);
    try {
      await adminService.batchRejectProducts(selectedProducts, batchRejectReason);
      setBatchRejectModal(false);
      setBatchRejectReason('');
      setSelectedProducts([]);
      setSelectAll(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>Product Approvals | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Product Approval Workflow</h1>
            <p className="text-gray-500 mt-1">Review and approve products submitted by sellers</p>
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedProducts.length} selected</span>
              <Button variant="outline" size="sm" onClick={() => { setBatchRejectModal(true); setBatchRejectReason(''); }}>
                Reject Selected
              </Button>
              <Button size="sm" onClick={handleBatchApprove} isLoading={submitting}>
                Approve Selected
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={classNames('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No products to review</h3>
              <p className="text-gray-500">All products have been reviewed</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)} className="rounded border-gray-300" />
                      </th>
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
                          <input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => toggleProduct(product._id)} className="rounded border-gray-300" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {product.images?.[0]?.url ? (
                                <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <button onClick={() => setDetailModal(product)} className="text-sm font-medium text-primary-600 hover:underline text-left truncate max-w-[180px]">{product.title}</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.seller?.name || product.seller?.store?.name || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="xs">{getProductTypeLabel(product.productType)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(product.pricing?.sellingPrice || product.price || 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[product.status] || 'warning'} size="xs">{product.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(product.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="ghost" onClick={() => setDetailModal(product)} title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </Button>
                            {product.status === 'pending' && (
                              <>
                                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleApprove(product._id)} title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </Button>
                                <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(product._id); setRejectReason(''); }} title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}</span>
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
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <Badge variant="primary" size="sm">{getProductTypeLabel(detailModal.productType)}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={statusBadgeVariant[detailModal.status] || 'warning'} size="sm">{detailModal.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-sm font-semibold text-gray-900">{formatPrice(detailModal.pricing?.sellingPrice || detailModal.price || 0)}</p>
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
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="text-sm text-gray-900">{detailModal.category?.name || detailModal.categoryName || '-'}</p>
              </div>
            </div>
            {detailModal.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailModal.description}</p>
              </div>
            )}
            {detailModal.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="danger" onClick={() => { setRejectModal(detailModal._id); setRejectReason(''); setDetailModal(null); }}>Reject</Button>
                <Button onClick={() => { handleApprove(detailModal._id); setDetailModal(null); }}>Approve</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {imageViewer && (
        <ImageViewer images={imageViewer} onClose={() => setImageViewer(null)} />
      )}

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Product" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this product.</p>
          <Input label="Rejection Reason *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={batchRejectModal} onClose={() => setBatchRejectModal(false)} title="Batch Reject Products" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Reject {selectedProducts.length} selected product(s). Provide a reason.</p>
          <Input label="Rejection Reason *" value={batchRejectReason} onChange={(e) => setBatchRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setBatchRejectModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleBatchReject} isLoading={submitting} disabled={!batchRejectReason.trim()}>Reject All</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}