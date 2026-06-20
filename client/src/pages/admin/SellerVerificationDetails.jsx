import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, formatPrice, getInitials, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ImageViewer from '../../components/ui/ImageViewer';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusTabs = ['', 'pending', 'under_review', 'verified', 'rejected'];

const statusBadgeVariant = {
  pending: 'warning',
  under_review: 'info',
  verified: 'success',
  rejected: 'danger',
};

export default function AdminSellerVerification() {
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState({ pending: 0, under_review: 0, verified: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [imageViewer, setImageViewer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: perPage, status: statusFilter || undefined };
      const res = await adminService.getSellerVerifications(params);
      setVerifications(res.verifications || res.sellers || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async (type) => {
    if (!verifyModal) return;
    setSubmitting(true);
    try {
      await adminService.verifySellerKyc(verifyModal, { status: type === 'approve' ? 'verified' : 'under_review' });
      setVerifyModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSubmitting(true);
    try {
      await adminService.verifySellerKyc(rejectModal, { status: 'rejected', reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openVerificationDetail = (verification) => {
    setSelectedVerification(verification);
  };

  const KycField = ({ label, children }) => (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {children}
    </div>
  );

  const DefaultDetailView = ({ item }) => {
    if (!item) return null;
    const kyc = item.kyc || item;
    const store = item.store || item.storeInfo || {};
    const addr = kyc.address || {};
    const addressStr = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ') || '-';
    const panUrl = kyc.panUrl || kyc.panCard?.url || kyc.document?.url;
    const aadhaarNumber = kyc.aadhaarNumber || kyc.aadhaarCard?.number;
    const aadhaarFrontUrl = kyc.aadhaarFrontUrl || kyc.aadhaarCard?.frontUrl;
    const aadhaarBackUrl = kyc.aadhaarBackUrl || kyc.aadhaarCard?.backUrl;
    const gstUrl = kyc.gstUrl || kyc.gst?.url;
    const gstNumber = kyc.gst || kyc.gst?.number;
    const phone = item.phone || kyc.phone;
    console.log('KYC Data:', { item, kyc, aadhaarNumber, aadhaarFrontUrl, aadhaarBackUrl, panUrl });
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 text-lg font-bold flex-shrink-0">
            {store.logo?.url ? <img src={store.logo.url} alt="" className="w-16 h-16 rounded-full object-cover" /> : getInitials(store.name || item.name)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{store.name || item.name || 'N/A'}</h3>
            <p className="text-sm text-gray-500">{item.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KycField label="Legal Name"><p className="text-sm font-medium text-gray-900">{kyc.legalName || '-'}</p></KycField>
          <KycField label="Father's Name"><p className="text-sm text-gray-900">{kyc.fathersName || '-'}</p></KycField>
          <KycField label="Age"><p className="text-sm text-gray-900">{kyc.age != null ? kyc.age : '-'}</p></KycField>
          <KycField label="Phone"><p className="text-sm text-gray-900">{phone || '-'}</p></KycField>
          <KycField label="Email Verified"><Badge variant={kyc.emailVerified ? 'success' : 'secondary'} size="xs">{kyc.emailVerified ? 'Yes' : 'No'}</Badge></KycField>
          <KycField label="Phone Verified"><Badge variant={kyc.phoneVerified ? 'success' : 'secondary'} size="xs">{kyc.phoneVerified ? 'Yes' : 'No'}</Badge></KycField>
          <KycField label="PAN Number"><p className="text-sm font-mono text-gray-900">{kyc.pan || '-'}</p></KycField>
          <KycField label="Aadhaar Number"><p className="text-sm font-mono text-gray-900">{aadhaarNumber || '-'}</p></KycField>
          <KycField label="GST Number"><p className="text-sm font-mono text-gray-900">{gstNumber || '-'}</p></KycField>
          <KycField label="KYC Status"><Badge variant={statusBadgeVariant[kyc.status] || 'warning'} size="sm">{kyc.status || 'pending'}</Badge></KycField>
          <KycField label="Submitted"><p className="text-sm text-gray-900">{formatDate(kyc.submittedAt || kyc.createdAt)}</p></KycField>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Address</h4>
          <p className="text-sm text-gray-700">{addressStr}</p>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Uploaded Documents</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kyc.selfie?.url && (
              <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: kyc.selfie.url, alt: 'Selfie' }])}>
                <p className="text-xs text-gray-500 mb-2">Selfie</p>
                <img src={kyc.selfie.url} alt="Selfie" className="w-full max-h-40 object-contain rounded border bg-black/5" />
              </div>
            )}
            {panUrl && (
              <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: panUrl, alt: 'PAN Card' }])}>
                <p className="text-xs text-gray-500 mb-2">PAN Card</p>
                <img src={panUrl} alt="PAN Card" className="w-full max-h-40 object-contain rounded border bg-black/5" />
              </div>
            )}
            {aadhaarFrontUrl && (
              <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: aadhaarFrontUrl, alt: 'Aadhaar Front' }])}>
                <p className="text-xs text-gray-500 mb-2">Aadhaar (Front)</p>
                <img src={aadhaarFrontUrl} alt="Aadhaar Front" className="w-full max-h-40 object-contain rounded border bg-black/5" />
              </div>
            )}
            {aadhaarBackUrl && (
              <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: aadhaarBackUrl, alt: 'Aadhaar Back' }])}>
                <p className="text-xs text-gray-500 mb-2">Aadhaar (Back)</p>
                <img src={aadhaarBackUrl} alt="Aadhaar Back" className="w-full max-h-40 object-contain rounded border bg-black/5" />
              </div>
            )}
            {gstUrl && (
              <div className="border rounded-lg p-3 cursor-pointer" onClick={() => setImageViewer([{ url: gstUrl, alt: 'GST Certificate' }])}>
                <p className="text-xs text-gray-500 mb-2">GST Certificate</p>
                <img src={gstUrl} alt="GST" className="w-full max-h-40 object-contain rounded border bg-black/5" />
              </div>
            )}
          </div>
          {!kyc.selfie?.url && !panUrl && !aadhaarFrontUrl && !aadhaarBackUrl && !gstUrl && (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          )}
        </div>
        <details className="border-t pt-4 mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Raw Data (debug)</summary>
          <pre className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded max-h-40 overflow-auto">{JSON.stringify({ itemKeys: Object.keys(item), kycKeys: Object.keys(kyc), fathersName: kyc.fathersName, age: kyc.age, aadhaarNumber, aadhaarFrontUrl, aadhaarBackUrl, panUrl }, null, 2)}</pre>
        </details>
      </div>
    );
  };

  return (
    <>
      <Helmet><title>Seller Verification | Admin | Zalnio</title></Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Seller Verification</h1>
          <p className="text-gray-500 mt-1">Review and verify seller KYC documents</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
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
                <p className="text-sm text-gray-500">Under Review</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.under_review || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified || 0}</p>
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
              {status ? status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : verifications.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No verifications found</h3>
              <p className="text-gray-500">No seller verifications match your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Legal Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {verifications.map(item => {
                      const kyc = item.kyc || item;
                      const seller = item;
                      return (
                        <tr key={item._id || item.sellerId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 text-xs font-medium">
                                {getInitials(seller.name || seller.store?.name)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{seller.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{seller.store?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{kyc.legalName || '-'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{kyc.pan || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusBadgeVariant[kyc.status] || 'warning'} size="xs">{kyc.status || 'pending'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(kyc.submittedAt || kyc.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button size="xs" variant="ghost" onClick={() => openVerificationDetail(item)} title="View Details">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </Button>
                              {(kyc.status === 'pending' || kyc.status === 'under_review') && (
                                <>
                                  <Button size="xs" variant="ghost" className="text-green-600" onClick={() => { setVerifyModal(kyc._id || item._id || item.sellerId); }} title="Verify">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  </Button>
                                  <Button size="xs" variant="ghost" className="text-red-600" onClick={() => { setRejectModal(kyc._id || item._id || item.sellerId); setRejectReason(''); }} title="Reject">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      <Modal isOpen={!!selectedVerification} onClose={() => setSelectedVerification(null)} title="Verification Details" size="lg">
        <DefaultDetailView item={selectedVerification} />
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="secondary" onClick={() => setSelectedVerification(null)}>Close</Button>
        </div>
      </Modal>

      <Modal isOpen={!!verifyModal} onClose={() => setVerifyModal(null)} title="Verify Seller" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose verification action for this seller.</p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { handleVerify('review'); setVerifyModal(null); }}>Mark as Under Review</Button>
            <Button fullWidth onClick={() => { handleVerify('approve'); setVerifyModal(null); }}>Verify & Approve</Button>
          </div>
        </div>
      </Modal>

      {imageViewer && (
        <ImageViewer images={imageViewer} onClose={() => setImageViewer(null)} />
      )}

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Verification" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting this seller's KYC.</p>
          <Input label="Rejection Reason *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} isLoading={submitting} disabled={!rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}