import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellers, approveSeller } from '../../store/slices/adminSlice';
import { formatDate, formatPrice, getInitials, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ImageViewer from '../../components/ui/ImageViewer';
import { PageLoader } from '../../components/ui/Loader';

const statusTabs = ['', 'pending', 'under_review', 'approved', 'rejected', 'suspended'];

const statusBadgeVariant = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
  suspended: 'secondary',
};

export default function AdminSellers() {
  const dispatch = useDispatch();
  const { sellers, isLoading, pagination } = useSelector(state => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailSeller, setDetailSeller] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [imageViewer, setImageViewer] = useState(null);

  useEffect(() => {
    dispatch(fetchSellers({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  const handleApprove = (id) => {
    dispatch(approveSeller({ id, status: 'approved' }));
    setActionModal(null);
  };

  const handleReject = () => {
    if (actionModal) {
      dispatch(approveSeller({ id: actionModal, status: 'rejected' }));
      setActionModal(null);
      setRejectReason('');
    }
  };

  const handleSuspend = (id) => {
    dispatch(approveSeller({ id, status: 'suspended' }));
  };

  const handleRestore = (id) => {
    dispatch(approveSeller({ id, status: 'approved' }));
  };

  const getSellerStatus = (seller) => seller.status || seller.sellerStatus;
  const pendingCount = sellers.filter(s => { const st = getSellerStatus(s); return st === 'pending' || st === 'under_review'; }).length;
  const approvedCount = sellers.filter(s => getSellerStatus(s) === 'approved').length;
  const rejectedCount = sellers.filter(s => getSellerStatus(s) === 'rejected').length;
  const suspendedCount = sellers.filter(s => getSellerStatus(s) === 'suspended').length;

  const SellerRow = ({ seller }) => {
    const kyc = seller.kyc || {};
    const sellerStatus = getSellerStatus(seller);

    return (
      <>
        <tr
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => setDetailSeller(seller)}
        >
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 text-sm font-medium flex-shrink-0">
                {seller.store?.logo?.url ? (
                  <img src={seller.store.logo.url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  getInitials(seller.store?.name || seller.name)
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{seller.store?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{seller.name}</p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">{seller.email}</td>
          <td className="px-4 py-3 text-sm text-gray-600">{seller.phone || '-'}</td>
          <td className="px-4 py-3">
            <Badge variant={statusBadgeVariant[sellerStatus] || 'secondary'} size="xs">
              {sellerStatus?.replace('_', ' ')}
            </Badge>
          </td>
          <td className="px-4 py-3">
            <Badge variant={kyc.status === 'verified' ? 'success' : kyc.status === 'rejected' ? 'danger' : 'warning'} size="xs">
              {kyc.status || 'pending'}
            </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">{seller.productCount ?? seller.productsCount ?? 0}</td>
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              {(sellerStatus === 'pending' || sellerStatus === 'under_review') && (
                <>
                  <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleApprove(seller._id)} title="Approve">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </Button>
                  <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setActionModal(seller._id); setRejectReason(''); }} title="Reject">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </>
              )}
              {sellerStatus === 'approved' && (
                <Button size="xs" variant="ghost" className="text-orange-600" onClick={() => handleSuspend(seller._id)} title="Suspend">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </Button>
              )}
              {sellerStatus === 'suspended' && (
                <Button size="xs" variant="ghost" className="text-green-600" onClick={() => handleRestore(seller._id)} title="Restore">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              )}
            </div>
          </td>
        </tr>
      </>
    );
  };

  return (
    <>
      <Helmet><title>Sellers | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Sellers</h1>
            <p className="text-gray-500 mt-1">Manage seller applications and stores</p>
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
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount}</p>
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
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{suspendedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status ? status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : sellers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No sellers found</h3>
              <p className="text-gray-500">No sellers match the current filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sellers.map(seller => (
                      <SellerRow key={seller._id} seller={seller} />
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

      {imageViewer && (
        <ImageViewer images={imageViewer} onClose={() => setImageViewer(null)} />
      )}

      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)} title="Reject Seller" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to reject this seller application?</p>
          <Input label="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detailSeller} onClose={() => setDetailSeller(null)} title="Seller KYC Documents" size="lg">
        {detailSeller && (() => {
          const kyc = detailSeller.kyc || {};
          const addr = kyc.address || {};
          const addressStr = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ') || '-';
          const panUrl = kyc.panUrl || kyc.panCard?.url || kyc.document?.url;
          const aadhaarNumber = kyc.aadhaarNumber || kyc.aadhaarCard?.number;
          const aadhaarFrontUrl = kyc.aadhaarFrontUrl || kyc.aadhaarCard?.frontUrl;
          const aadhaarBackUrl = kyc.aadhaarBackUrl || kyc.aadhaarCard?.backUrl;
          const gstUrl = kyc.gstUrl || kyc.gst?.url;
          const gstNumber = kyc.gst || kyc.gst?.number;
          const phone = detailSeller.phone || kyc.phone;
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 text-lg font-bold flex-shrink-0">
                  {detailSeller.store?.logo?.url ? (
                    <img src={detailSeller.store.logo.url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    getInitials(detailSeller.store?.name || detailSeller.name)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{detailSeller.store?.name || 'N/A'}</h3>
                  <p className="text-sm text-gray-500">{detailSeller.name} &middot; {detailSeller.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Legal Name</p>
                  <p className="font-medium text-gray-900">{kyc.legalName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Father's Name</p>
                  <p className="font-medium text-gray-900">{kyc.fathersName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Age</p>
                  <p className="font-medium text-gray-900">{kyc.age != null ? kyc.age : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Verified</p>
                  <Badge variant={kyc.emailVerified ? 'success' : 'secondary'} size="xs">{kyc.emailVerified ? 'Yes' : 'No'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Verified</p>
                  <Badge variant={kyc.phoneVerified ? 'success' : 'secondary'} size="xs">{kyc.phoneVerified ? 'Yes' : 'No'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                  <p className="font-mono font-medium text-gray-900">{kyc.pan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Aadhaar Number</p>
                  <p className="font-mono font-medium text-gray-900">{aadhaarNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">GST Number</p>
                  <p className="font-mono font-medium text-gray-900">{gstNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">KYC Status</p>
                  <Badge variant={kyc.status === 'verified' ? 'success' : kyc.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                    {kyc.status || 'pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Submitted On</p>
                  <p className="font-medium text-gray-900">{formatDate(kyc.submittedAt || detailSeller.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Address</h4>
                <p className="text-sm text-gray-700">{addressStr}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kyc.selfie?.url ? (
                    <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: kyc.selfie.url, alt: 'Selfie' }])}>
                      <p className="text-xs text-gray-500 mb-2">Selfie</p>
                      <img src={kyc.selfie.url} alt="Selfie" className="w-full max-h-40 object-contain rounded border bg-black/5" />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Selfie</p>
                      <div className="h-32 flex items-center justify-center bg-gray-50 rounded text-sm text-gray-400">Not provided</div>
                    </div>
                  )}
                  {panUrl ? (
                    <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: panUrl, alt: 'PAN Card' }])}>
                      <p className="text-xs text-gray-500 mb-2">PAN Card</p>
                      <img src={panUrl} alt="PAN Card" className="w-full max-h-40 object-contain rounded border bg-black/5" />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">PAN Card</p>
                      <div className="h-32 flex items-center justify-center bg-gray-50 rounded text-sm text-gray-400">Not provided</div>
                    </div>
                  )}
                  {aadhaarFrontUrl ? (
                    <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: aadhaarFrontUrl, alt: 'Aadhaar Front' }])}>
                      <p className="text-xs text-gray-500 mb-2">Aadhaar (Front)</p>
                      <img src={aadhaarFrontUrl} alt="Aadhaar Front" className="w-full max-h-40 object-contain rounded border bg-black/5" />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Aadhaar (Front)</p>
                      <div className="h-32 flex items-center justify-center bg-gray-50 rounded text-sm text-gray-400">Not provided</div>
                    </div>
                  )}
                  {aadhaarBackUrl ? (
                    <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: aadhaarBackUrl, alt: 'Aadhaar Back' }])}>
                      <p className="text-xs text-gray-500 mb-2">Aadhaar (Back)</p>
                      <img src={aadhaarBackUrl} alt="Aadhaar Back" className="w-full max-h-40 object-contain rounded border bg-black/5" />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-2">Aadhaar (Back)</p>
                      <div className="h-32 flex items-center justify-center bg-gray-50 rounded text-sm text-gray-400">Not provided</div>
                    </div>
                  )}
                  {gstUrl ? (
                    <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: gstUrl, alt: 'GST Certificate' }])}>
                      <p className="text-xs text-gray-500 mb-2">GST Certificate</p>
                      <img src={gstUrl} alt="GST" className="w-full max-h-40 object-contain rounded border bg-black/5" />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setDetailSeller(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
