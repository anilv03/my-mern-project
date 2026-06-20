import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'email', label: 'Email' },
  { id: 'payment', label: 'Payment Gateway' },
  { id: 'commission', label: 'Commission' },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({});

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSettings();
      setSettings(res);
      setForm({
        siteName: res.siteName || '',
        siteDescription: res.siteDescription || '',
        supportEmail: res.supportEmail || '',
        supportPhone: res.supportPhone || '',
        address: res.address || '',
        currency: res.currency || 'INR',
        timezone: res.timezone || 'Asia/Kolkata',
        dateFormat: res.dateFormat || 'DD/MM/YYYY',
        maxLoginAttempts: res.maxLoginAttempts || 5,
        sessionTimeout: res.sessionTimeout || 60,
        twoFactorAuth: res.twoFactorAuth || false,
        emailProvider: res.emailProvider || 'smtp',
        smtpHost: res.smtpHost || '',
        smtpPort: res.smtpPort || '',
        smtpUser: res.smtpUser || '',
        smtpPass: res.smtpPass || '',
        fromEmail: res.fromEmail || '',
        fromName: res.fromName || '',
        paymentGateway: res.paymentGateway || 'razorpay',
        razorpayKeyId: res.razorpayKeyId || '',
        razorpayKeySecret: res.razorpayKeySecret || '',
        stripePublishableKey: res.stripePublishableKey || '',
        stripeSecretKey: res.stripeSecretKey || '',
        gatewayMode: res.gatewayMode || 'test',
        sellerCommission: res.sellerCommission || 0,
        commissionType: res.commissionType || 'percentage',
        minPayoutAmount: res.minPayoutAmount || '',
        payoutSchedule: res.payoutSchedule || 'monthly',
        taxRate: res.taxRate || 0,
        platformFee: res.platformFee || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await adminService.updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading && !settings) return <PageLoader />;

  const renderGeneral = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Site Name" value={form.siteName} onChange={(e) => update('siteName', e.target.value)} />
        <Input label="Support Email" type="email" value={form.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
        <textarea value={form.siteDescription} onChange={(e) => update('siteDescription', e.target.value)} rows={3} className="input-field resize-y" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Support Phone" value={form.supportPhone} onChange={(e) => update('supportPhone', e.target.value)} />
        <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input-field">
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)} className="input-field">
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
          <select value={form.dateFormat} onChange={(e) => update('dateFormat', e.target.value)} className="input-field">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Max Login Attempts" type="number" value={form.maxLoginAttempts} onChange={(e) => update('maxLoginAttempts', Number(e.target.value))} />
        <Input label="Session Timeout (minutes)" type="number" value={form.sessionTimeout} onChange={(e) => update('sessionTimeout', Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
        <input type="checkbox" checked={form.twoFactorAuth} onChange={(e) => update('twoFactorAuth', e.target.checked)} className="rounded border-gray-300" />
        <div>
          <p className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</p>
          <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
        </div>
      </label>
    </div>
  );

  const renderEmail = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Provider</label>
        <select value={form.emailProvider} onChange={(e) => update('emailProvider', e.target.value)} className="input-field">
          <option value="smtp">SMTP</option>
          <option value="sendgrid">SendGrid</option>
          <option value="mailgun">Mailgun</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="SMTP Host" value={form.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} />
        <Input label="SMTP Port" value={form.smtpPort} onChange={(e) => update('smtpPort', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="SMTP Username" value={form.smtpUser} onChange={(e) => update('smtpUser', e.target.value)} />
        <Input label="SMTP Password" type="password" value={form.smtpPass} onChange={(e) => update('smtpPass', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="From Email" type="email" value={form.fromEmail} onChange={(e) => update('fromEmail', e.target.value)} />
        <Input label="From Name" value={form.fromName} onChange={(e) => update('fromName', e.target.value)} />
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
          <select value={form.paymentGateway} onChange={(e) => update('paymentGateway', e.target.value)} className="input-field">
            <option value="razorpay">Razorpay</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gateway Mode</label>
          <select value={form.gatewayMode} onChange={(e) => update('gatewayMode', e.target.value)} className="input-field">
            <option value="live">Live</option>
            <option value="test">Test/Sandbox</option>
          </select>
        </div>
      </div>
      {form.paymentGateway === 'razorpay' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Razorpay Key ID" value={form.razorpayKeyId} onChange={(e) => update('razorpayKeyId', e.target.value)} />
          <Input label="Razorpay Key Secret" type="password" value={form.razorpayKeySecret} onChange={(e) => update('razorpayKeySecret', e.target.value)} />
        </div>
      )}
      {form.paymentGateway === 'stripe' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Stripe Publishable Key" value={form.stripePublishableKey} onChange={(e) => update('stripePublishableKey', e.target.value)} />
          <Input label="Stripe Secret Key" type="password" value={form.stripeSecretKey} onChange={(e) => update('stripeSecretKey', e.target.value)} />
        </div>
      )}
    </div>
  );

  const renderCommission = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Seller Commission (%)" type="number" min="0" max="100" value={form.sellerCommission} onChange={(e) => update('sellerCommission', Number(e.target.value))} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
          <select value={form.commissionType} onChange={(e) => update('commissionType', e.target.value)} className="input-field">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed per Sale</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Minimum Payout Amount" type="number" min="0" value={form.minPayoutAmount} onChange={(e) => update('minPayoutAmount', e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payout Schedule</label>
          <select value={form.payoutSchedule} onChange={(e) => update('payoutSchedule', e.target.value)} className="input-field">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Tax Rate (%)" type="number" min="0" max="100" value={form.taxRate} onChange={(e) => update('taxRate', Number(e.target.value))} />
        <Input label="Platform Fee" type="number" min="0" value={form.platformFee} onChange={(e) => update('platformFee', Number(e.target.value))} />
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Settings | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage platform configuration</p>
          </div>
          <Button onClick={handleSave} isLoading={saving}>
            {saveSuccess ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Settings saved successfully
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardBody>
            {activeTab === 'general' && renderGeneral()}
            {activeTab === 'security' && renderSecurity()}
            {activeTab === 'email' && renderEmail()}
            {activeTab === 'payment' && renderPayment()}
            {activeTab === 'commission' && renderCommission()}
          </CardBody>
        </Card>
      </div>
    </>
  );
}