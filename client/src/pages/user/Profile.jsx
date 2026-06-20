import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { updateProfile, updatePassword, sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp, reset } from '../../store/slices/authSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { formatDate, getInitials } from '../../lib/helpers';

const TABS = ['Profile', 'Password', 'Addresses'];

export default function Profile() {
  const dispatch = useDispatch();
  const { user, isLoading, isSuccess, isError, message } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('Profile');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ street: '', city: '', state: '', zip: '', country: 'India' });
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    dispatch(updateProfile(form));
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) return;
    dispatch(updatePassword(passwordForm)).then(() => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    });
  };

  const handleSendOtp = (type) => {
    setOtpType(type);
    setOtpSent(true);
    if (type === 'email') dispatch(sendEmailOtp({ email: form.email, purpose: 'verification' }));
    else dispatch(sendPhoneOtp(form.phone));
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    if (otpType === 'email') dispatch(verifyEmailOtp({ email: form.email, otp }));
    else dispatch(verifyPhoneOtp(form.phone, otp));
    setShowOtpModal(false);
    setOtp('');
    setOtpSent(false);
  };

  return (
    <>
      <Helmet><title>My Profile | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>

        {isSuccess && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">Profile updated successfully!</div>}
        {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardBody className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                  {getInitials(user?.name)}
                </div>
                <h2 className="text-lg font-semibold">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">{user?.role} · Joined {formatDate(user?.createdAt)}</p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button size="xs" variant="outline" onClick={() => handleSendOtp('email')}>Verify Email</Button>
                  <Button size="xs" variant="outline" onClick={() => handleSendOtp('phone')}>Verify Phone</Button>
                </div>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><h2 className="text-lg font-semibold">Personal Information</h2></CardHeader>
              <CardBody>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                </form>
              </CardBody>
            </Card>
          </div>
        )}

        {activeTab === 'Password' && (
          <Card className="max-w-lg">
            <CardHeader><h2 className="text-lg font-semibold">Change Password</h2></CardHeader>
            <CardBody>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                <Input label="Confirm New Password" type="password" value={passwordForm.confirmNewPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })} required />
                <Button type="submit" isLoading={isLoading}>Update Password</Button>
              </form>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Addresses' && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <Button size="sm" onClick={() => { setAddressForm({ street: '', city: '', state: '', zip: '', country: 'India' }); setShowAddressModal(true); }}>Add Address</Button>
            </CardHeader>
            <CardBody>
              {addresses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved addresses. Add one for faster checkout.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr._id} className="border rounded-lg p-4">
                      <p className="font-medium">{addr.street}</p>
                      <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.zip}</p>
                      <p className="text-sm text-gray-500">{addr.country}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <Modal isOpen={showOtpModal} onClose={() => { setShowOtpModal(false); setOtpSent(false); }} title={`Verify ${otpType === 'email' ? 'Email' : 'Phone'}`}>
        <p className="text-sm text-gray-600 mb-4">Enter the OTP sent to your {otpType === 'email' ? 'email' : 'phone'}</p>
        <Input label="OTP" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" maxLength={6} />
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" fullWidth onClick={() => { setShowOtpModal(false); setOtpSent(false); }}>Cancel</Button>
          <Button fullWidth onClick={handleVerifyOtp} isLoading={isLoading}>Verify</Button>
        </div>
      </Modal>
    </>
  );
}
