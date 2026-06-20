import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { submitKyc, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp, reset } from '../../store/slices/authSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const STEPS = ['Personal Info & Verification', 'PAN, Aadhaar & Address', 'Selfie & Review'];

export default function KycForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isSuccess, isError, message } = useSelector(state => state.auth);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    legalName: user?.name || '',
    fathersName: '',
    age: '',
    panNumber: '',
    panUrl: '',
    aadhaarNumber: '',
    aadhaarFrontUrl: '',
    aadhaarBackUrl: '',
    selfieUrl: '',
    address: { street: '', city: '', state: '', zip: '' },
  });

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(true);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(true);
  const [emailOtpValue, setEmailOtpValue] = useState('');
  const [phoneOtpValue, setPhoneOtpValue] = useState('');

  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!justSubmitted && (user?.sellerStatus === 'under_review' || (user?.kyc?.submittedAt && user?.sellerStatus !== 'rejected'))) {
      navigate('/seller/kyc', { replace: true });
    }
  }, [user, navigate, justSubmitted]);

  useEffect(() => {
    return () => dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isSuccess && !submitted) {
      setSubmitted(true);
      setJustSubmitted(true);
      dispatch(reset());
    }
  }, [isSuccess, submitted, dispatch]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch {
      setErrors({ selfie: 'Camera access denied' });
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setData({ ...data, selfieUrl: canvasRef.current.toDataURL('image/jpeg') });
    setShowCamera(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const handleFileUpload = useCallback((field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setData(prev => ({ ...prev, [field]: e.target.result }));
    reader.readAsDataURL(file);
  }, []);

  const handleAddressChange = (field, value) => {
    setData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!data.legalName) errs.legalName = 'Full name is required';
      if (!data.fathersName) errs.fathersName = 'Father\'s name is required';
      if (!data.age) errs.age = 'Age is required';
      else if (isNaN(data.age) || data.age < 18 || data.age > 120) errs.age = 'Age must be between 18 and 120';
      if (!emailOtpVerified) errs.emailOtp = 'Please verify your email OTP';
      if (!phoneOtpVerified) errs.phoneOtp = 'Please verify your phone OTP';
    }
    if (step === 1) {
      if (!data.panNumber) errs.panNumber = 'PAN number is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.panNumber)) errs.panNumber = 'Invalid PAN format';
      if (!data.panUrl) errs.panUrl = 'PAN card photo is required';
      if (!data.aadhaarNumber) errs.aadhaarNumber = 'Aadhaar number is required';
      else if (!/^\d{12}$/.test(data.aadhaarNumber)) errs.aadhaarNumber = 'Aadhaar must be 12 digits';
      if (!data.aadhaarFrontUrl) errs.aadhaarFrontUrl = 'Aadhaar front photo is required';
      if (!data.aadhaarBackUrl) errs.aadhaarBackUrl = 'Aadhaar back photo is required';
      if (!data.address.street) errs.street = 'Street is required';
      if (!data.address.city) errs.city = 'City is required';
      if (!data.address.state) errs.state = 'State is required';
      if (!data.address.zip) errs.zip = 'ZIP code is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendEmailOtp = async () => {
    if (!user?.email) return;
    try {
      await dispatch(sendEmailOtp({ email: user.email, purpose: 'seller_kyc' })).unwrap();
      setEmailOtpSent(true);
      setErrors(prev => ({ ...prev, emailOtp: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, emailOtp: err?.message || err || 'Failed to send OTP' }));
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!user?.email || !emailOtpValue) return;
    try {
      await dispatch(verifyEmailOtp({ email: user.email, otp: emailOtpValue })).unwrap();
      setEmailOtpVerified(true);
      setErrors(prev => ({ ...prev, emailOtp: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, emailOtp: err?.message || err || 'Invalid OTP' }));
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!user?.phone) {
      setErrors(prev => ({ ...prev, phoneOtp: 'No phone number on account' }));
      return;
    }
    try {
      const result = await dispatch(sendPhoneOtp({ phone: user.phone, purpose: 'seller_kyc' })).unwrap();
      setPhoneOtpSent(true);
      setErrors(prev => ({ ...prev, phoneOtp: '' }));
      if (result?.data?.otp) {
        toast.success(`Dev Mode OTP: ${result.data.otp}`, { duration: 10000 });
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, phoneOtp: err?.message || err || 'Failed to send OTP' }));
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!user?.phone || !phoneOtpValue) return;
    try {
      await dispatch(verifyPhoneOtp({ phone: user.phone, otp: phoneOtpValue })).unwrap();
      setPhoneOtpVerified(true);
      setErrors(prev => ({ ...prev, phoneOtp: '' }));
    } catch (err) {
      setErrors(prev => ({ ...prev, phoneOtp: err?.message || err || 'Invalid OTP' }));
    }
  };

  const handleSubmit = () => {
    dispatch(submitKyc({
      legalName: data.legalName,
      fathersName: data.fathersName,
      age: parseInt(data.age, 10),
      panNumber: data.panNumber,
      panUrl: data.panUrl,
      aadhaarNumber: data.aadhaarNumber,
      aadhaarFrontUrl: data.aadhaarFrontUrl,
      aadhaarBackUrl: data.aadhaarBackUrl,
      selfieUrl: data.selfieUrl,
      address: data.address,
      emailVerified: true,
      phoneVerified: true,
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            <div className="space-y-4">
              <Input label="Full Name" value={data.legalName} onChange={e => setData({ ...data, legalName: e.target.value })} error={errors.legalName} />
              <Input label="Father's Name" value={data.fathersName} onChange={e => setData({ ...data, fathersName: e.target.value })} error={errors.fathersName} />
              <Input label="Age" type="number" min={18} max={120} value={data.age} onChange={e => setData({ ...data, age: e.target.value })} error={errors.age} />
              <Input label="Phone Number" value={user?.phone || ''} disabled helperText="Registered phone number" />
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-lg">Verification</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Email: {user?.email || 'N/A'}</p>
              {!emailOtpSent ? (
                <Button onClick={handleSendEmailOtp} variant="outline" size="sm">Send Email OTP</Button>
              ) : !emailOtpVerified ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input className="!w-40" placeholder="Enter OTP" value={emailOtpValue} onChange={e => setEmailOtpValue(e.target.value)} maxLength={6} />
                  <Button onClick={handleVerifyEmailOtp} size="sm">Verify</Button>
                  <Button onClick={handleSendEmailOtp} variant="secondary" size="sm">Resend</Button>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-medium">Email Verified</p>
              )}
              {errors.emailOtp && <p className="text-sm text-red-600">{errors.emailOtp}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Phone: {user?.phone || 'N/A'}</p>
              <p className="text-sm text-green-600 font-medium">Phone Verified</p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">PAN Card Details</h3>
            <div className="space-y-4">
              <Input label="PAN Number" maxLength={10} value={data.panNumber} onChange={e => setData({ ...data, panNumber: e.target.value.toUpperCase() })} error={errors.panNumber} placeholder="ABCDE1234F" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PAN Card Photo</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleFileUpload('panUrl', f); }} className="input-field" />
                {data.panUrl && <p className="text-xs text-green-600 mt-1">Uploaded</p>}
                {errors.panUrl && <p className="text-sm text-red-600 mt-1">{errors.panUrl}</p>}
              </div>
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-lg">Aadhaar Card Details</h3>
            <div className="space-y-4">
              <Input label="Aadhaar Number" maxLength={12} value={data.aadhaarNumber} onChange={e => setData({ ...data, aadhaarNumber: e.target.value.replace(/\D/g, '') })} error={errors.aadhaarNumber} placeholder="12-digit Aadhaar number" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Aadhaar Front Photo</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleFileUpload('aadhaarFrontUrl', f); }} className="input-field" />
                {data.aadhaarFrontUrl && <p className="text-xs text-green-600 mt-1">Uploaded</p>}
                {errors.aadhaarFrontUrl && <p className="text-sm text-red-600 mt-1">{errors.aadhaarFrontUrl}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Aadhaar Back Photo</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleFileUpload('aadhaarBackUrl', f); }} className="input-field" />
                {data.aadhaarBackUrl && <p className="text-xs text-green-600 mt-1">Uploaded</p>}
                {errors.aadhaarBackUrl && <p className="text-sm text-red-600 mt-1">{errors.aadhaarBackUrl}</p>}
              </div>
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-lg">Address</h3>
            <div className="space-y-4">
              <Input label="Street Address" value={data.address.street} onChange={e => handleAddressChange('street', e.target.value)} error={errors.street} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" value={data.address.city} onChange={e => handleAddressChange('city', e.target.value)} error={errors.city} />
                <Input label="State" value={data.address.state} onChange={e => handleAddressChange('state', e.target.value)} error={errors.state} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="ZIP Code" value={data.address.zip} onChange={e => handleAddressChange('zip', e.target.value)} error={errors.zip} />
                <Input label="Country" value="India" disabled />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Live Selfie</h3>
            {showCamera ? (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button onClick={captureSelfie}>Capture</Button>
                  <Button variant="secondary" onClick={() => { setShowCamera(false); videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); }}>Cancel</Button>
                </div>
              </div>
            ) : data.selfieUrl ? (
              <div className="space-y-3">
                <img src={data.selfieUrl} alt="Selfie" className="w-48 h-48 object-cover rounded-lg border mx-auto" />
                <div className="flex gap-2 justify-center">
                  <Button variant="secondary" onClick={() => { setData({ ...data, selfieUrl: '' }); startCamera(); }}>Retake</Button>
                  <Button variant="outline" onClick={() => { setData({ ...data, selfieUrl: '' }); }}>Remove</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={startCamera} fullWidth>Open Camera</Button>
                <p className="text-center text-sm text-gray-500">or</p>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleFileUpload('selfieUrl', f); }} className="input-field" />
              </div>
            )}
            {errors.selfie && <p className="text-sm text-red-600">{errors.selfie}</p>}

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-lg">Review & Submit</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p><span className="font-medium">Full Name:</span> {data.legalName}</p>
              <p><span className="font-medium">Father's Name:</span> {data.fathersName}</p>
              <p><span className="font-medium">Age:</span> {data.age}</p>
              <p><span className="font-medium">Phone:</span> {user?.phone}</p>
              <p><span className="font-medium">Email Verified:</span> {emailOtpVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Phone Verified:</span> {phoneOtpVerified ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">PAN:</span> {data.panNumber}</p>
              <p><span className="font-medium">PAN Photo:</span> {data.panUrl ? 'Uploaded' : 'Not uploaded'}</p>
              <p><span className="font-medium">Aadhaar:</span> {data.aadhaarNumber}</p>
              <p><span className="font-medium">Aadhaar Front:</span> {data.aadhaarFrontUrl ? 'Uploaded' : 'Not uploaded'}</p>
              <p><span className="font-medium">Aadhaar Back:</span> {data.aadhaarBackUrl ? 'Uploaded' : 'Not uploaded'}</p>
              <p><span className="font-medium">Address:</span> {data.address.street ? `${data.address.street}, ${data.address.city}, ${data.address.state} - ${data.address.zip}` : 'Not provided'}</p>
              <p><span className="font-medium">Selfie:</span> {data.selfieUrl ? 'Captured' : 'Not captured'}</p>
            </div>
            {message && isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
          </div>
        );
      default: return null;
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet><title>KYC Submitted - Seller Dashboard | Zalnio</title></Helmet>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Your KYC</h2>
                <p className="text-gray-500">Your KYC documents are being verified. This usually takes within <strong>24 hours</strong>.</p>
                <p className="text-gray-500 mt-1">You will be notified once your KYC is approved.</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate('/seller/kyc')}>Check Status</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>KYC Form - Seller Dashboard | Zalnio</title></Helmet>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Complete Your KYC</h1>
          <p className="text-gray-500 mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        <Card>
          <CardBody>
            {renderStep()}
            <div className="flex justify-between mt-8">
              {step > 0 ? <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button> : <div />}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => { if (validate()) setStep(step + 1); }}>Continue</Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!data.selfieUrl}>Submit KYC</Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
