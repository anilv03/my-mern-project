import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { getKycStatus, reset } from '../../store/slices/authSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';

export default function SellerKyc() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);
  const [kycStatus, setKycStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'customer')) {
      navigate('/auth/login', { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(getKycStatus()).then((res) => {
      if (res.payload) setKycStatus(res.payload);
      setLoadingStatus(false);
    });
  }, [dispatch]);

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  if (loadingStatus) return <PageLoader />;

  const status = kycStatus || {};

  if (status.isSellerApproved) {
    return (
      <>
        <Helmet><title>KYC - Seller Dashboard | Zalnio</title></Helmet>
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">KYC Verification</h1>
            <p className="text-gray-500 mt-1">Your KYC status</p>
          </div>
          <Card>
            <CardBody>
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">KYC Verified</h2>
                <p className="text-gray-500">Your KYC has been approved. You can now sell products on Zalnio.</p>
                <Button className="mt-4" onClick={() => navigate('/seller')}>Go to Dashboard</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  if (status.sellerStatus === 'rejected') {
    return (
      <>
        <Helmet><title>KYC - Seller Dashboard | Zalnio</title></Helmet>
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">KYC Verification</h1>
            <p className="text-gray-500 mt-1">Your KYC was rejected</p>
          </div>
          <Card>
            <CardBody>
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">KYC Rejected</h2>
                {status.rejectionReason && (
                  <p className="text-red-600 mb-2">Reason: {status.rejectionReason}</p>
                )}
                <p className="text-gray-500 mb-4">Please update your information and resubmit.</p>
                <Button onClick={() => navigate('/seller/kyc/form')}>Resubmit KYC</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  if (status.kyc?.submittedAt) {
    return (
      <>
        <Helmet><title>KYC - Seller Dashboard | Zalnio</title></Helmet>
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">KYC Verification</h1>
            <p className="text-gray-500 mt-1">Your KYC is under review</p>
          </div>
          <Card>
            <CardBody>
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">KYC Submitted - Pending Review</h2>
                <p className="text-gray-500">Your KYC documents have been submitted and are being reviewed by our team. This usually takes within 24 hours.</p>
                <p className="text-gray-500 mt-1">You will be notified once your KYC is approved.</p>
                {status.kyc?.submittedAt && (
                  <p className="text-sm text-gray-400 mt-2">Submitted on {new Date(status.kyc.submittedAt).toLocaleDateString()}</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>KYC - Seller Dashboard | Zalnio</title></Helmet>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-500 mt-1">Complete your KYC to start selling</p>
        </div>
        <Card>
          <CardBody>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">KYC Not Submitted</h2>
              <p className="text-gray-500 mb-4">You need to complete KYC verification before you can start selling products.</p>
              <Button onClick={() => navigate('/seller/kyc/form')}>Start KYC</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
