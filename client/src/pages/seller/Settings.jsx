import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerSettings, updateSellerSettings } from '../../store/slices/sellerSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Loader';

const TABS = ['General', 'Notifications', 'Shipping', 'Policies'];

export default function SellerSettings() {
  const dispatch = useDispatch();
  const { settings, isLoading, isSuccess, isError, message } = useSelector(state => state.seller);
  const [activeTab, setActiveTab] = useState('General');

  const [generalForm, setGeneralForm] = useState({
    storeName: '', storeEmail: '', storePhone: '', storeDescription: '',
    currency: 'INR', timezone: 'Asia/Kolkata', language: 'en',
  });
  const [notifForm, setNotifForm] = useState({
    newOrder: true, orderShipped: true, orderDelivered: true,
    orderCancelled: true, newReview: true, lowStock: false,
    payoutReceived: true, marketingEmails: false,
  });
  const [shippingForm, setShippingForm] = useState({
    domesticShipping: 0, internationalShipping: 0,
    freeShippingThreshold: 0, handlingTime: 1,
    defaultCarrier: '', returnPolicy: '30_days',
  });
  const [policyForm, setPolicyForm] = useState({
    returnPolicyText: '', refundPolicyText: '', shippingPolicyText: '',
    termsAndConditions: '', privacyPolicy: '',
  });

  useEffect(() => {
    dispatch(fetchSellerSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setGeneralForm(prev => ({ ...prev, ...settings.general }));
      setNotifForm(prev => ({ ...prev, ...settings.notifications }));
      setShippingForm(prev => ({ ...prev, ...settings.shipping }));
      setPolicyForm(prev => ({ ...prev, ...settings.policies }));
    }
  }, [settings]);

  const handleSave = () => {
    const payload = {};
    switch (activeTab) {
      case 'General': payload.general = generalForm; break;
      case 'Notifications': payload.notifications = notifForm; break;
      case 'Shipping': payload.shipping = shippingForm; break;
      case 'Policies': payload.policies = policyForm; break;
    }
    dispatch(updateSellerSettings(payload));
  };

  return (
    <>
      <Helmet><title>Settings | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your seller account preferences</p>
          </div>
          <Button onClick={handleSave} isLoading={isLoading}>Save Changes</Button>
        </div>

        {isSuccess && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">Settings updated successfully!</div>}
        {isError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}

        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'General' && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">General Settings</h2></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Store Name" value={generalForm.storeName} onChange={e => setGeneralForm(f => ({ ...f, storeName: e.target.value }))} />
                <Input label="Store Email" type="email" value={generalForm.storeEmail} onChange={e => setGeneralForm(f => ({ ...f, storeEmail: e.target.value }))} />
                <Input label="Store Phone" value={generalForm.storePhone} onChange={e => setGeneralForm(f => ({ ...f, storePhone: e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={generalForm.currency} onChange={e => setGeneralForm(f => ({ ...f, currency: e.target.value }))} className="input-field w-full">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={generalForm.timezone} onChange={e => setGeneralForm(f => ({ ...f, timezone: e.target.value }))} className="input-field w-full">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select value={generalForm.language} onChange={e => setGeneralForm(f => ({ ...f, language: e.target.value }))} className="input-field w-full">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                  <textarea rows={3} className="input-field w-full" value={generalForm.storeDescription} onChange={e => setGeneralForm(f => ({ ...f, storeDescription: e.target.value }))} />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Notifications' && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Notification Preferences</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(notifForm).map(([key, val]) => (
                  <label key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input type="checkbox" checked={val} onChange={e => setNotifForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Shipping' && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Shipping Settings</h2></CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Domestic Shipping (₹)" type="number" min="0" value={shippingForm.domesticShipping} onChange={e => setShippingForm(f => ({ ...f, domesticShipping: parseFloat(e.target.value) || 0 }))} />
                <Input label="International Shipping (₹)" type="number" min="0" value={shippingForm.internationalShipping} onChange={e => setShippingForm(f => ({ ...f, internationalShipping: parseFloat(e.target.value) || 0 }))} />
                <Input label="Free Shipping Threshold (₹)" type="number" min="0" value={shippingForm.freeShippingThreshold} onChange={e => setShippingForm(f => ({ ...f, freeShippingThreshold: parseFloat(e.target.value) || 0 }))} />
                <Input label="Handling Time (days)" type="number" min="0" value={shippingForm.handlingTime} onChange={e => setShippingForm(f => ({ ...f, handlingTime: parseInt(e.target.value) || 0 }))} />
                <Input label="Default Carrier" value={shippingForm.defaultCarrier} onChange={e => setShippingForm(f => ({ ...f, defaultCarrier: e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                  <select value={shippingForm.returnPolicy} onChange={e => setShippingForm(f => ({ ...f, returnPolicy: e.target.value }))} className="input-field w-full">
                    <option value="no_returns">No Returns</option>
                    <option value="7_days">7 Days</option>
                    <option value="15_days">15 Days</option>
                    <option value="30_days">30 Days</option>
                    <option value="60_days">60 Days</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'Policies' && (
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Store Policies</h2></CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                  <textarea rows={4} className="input-field w-full" value={policyForm.returnPolicyText} onChange={e => setPolicyForm(f => ({ ...f, returnPolicyText: e.target.value }))} placeholder="Describe your return policy..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Policy</label>
                  <textarea rows={4} className="input-field w-full" value={policyForm.refundPolicyText} onChange={e => setPolicyForm(f => ({ ...f, refundPolicyText: e.target.value }))} placeholder="Describe your refund policy..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Policy</label>
                  <textarea rows={4} className="input-field w-full" value={policyForm.shippingPolicyText} onChange={e => setPolicyForm(f => ({ ...f, shippingPolicyText: e.target.value }))} placeholder="Describe your shipping policy..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea rows={4} className="input-field w-full" value={policyForm.termsAndConditions} onChange={e => setPolicyForm(f => ({ ...f, termsAndConditions: e.target.value }))} placeholder="Your terms and conditions..." />
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
