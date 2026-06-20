import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import sellerService from '../../services/sellerService';
import uploadService from '../../services/uploadService';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate } from '../../lib/helpers';

export default function StoreProfile() {
  const { user } = useSelector(state => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showStoreModal, setShowStoreModal] = useState(false);

  const [form, setForm] = useState({
    storeName: '', storeSlug: '', contactEmail: '', storePhone: '',
    storeDescription: '', storeLogo: '', storeBanner: '',
    address: { street: '', city: '', state: '', zip: '', country: 'India' },
    socialLinks: { website: '', facebook: '', twitter: '', instagram: '', youtube: '' },
  });
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugTemp, setSlugTemp] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sellerService.getProfile();
        setProfile(data);
        setForm({
          storeName: data.storeName || user?.name || '',
          storeSlug: data.storeSlug || '',
          contactEmail: data.contactEmail || user?.email || '',
          storePhone: data.storePhone || user?.phone || '',
          storeDescription: data.storeDescription || '',
          storeLogo: data.storeLogo || '',
          storeBanner: data.storeBanner || '',
          address: data.address || { street: '', city: '', state: '', zip: '', country: 'India' },
          socialLinks: data.socialLinks || { website: '', facebook: '', twitter: '', instagram: '', youtube: '' },
        });
        setSlugTemp(data.storeSlug || '');
      } catch (err) {
        setError('Failed to load profile');
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.uploadImage(file);
      setForm(f => ({ ...f, storeLogo: result.url }));
    } catch { setError('Logo upload failed'); }
    setUploading(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.uploadImage(file);
      setForm(f => ({ ...f, storeBanner: result.url }));
    } catch { setError('Banner upload failed'); }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await sellerService.updateProfile(form);
      setProfile(updated);
      setSuccess('Store profile updated successfully!');
      setShowStoreModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  const handleSlugSave = () => {
    setForm(f => ({ ...f, storeSlug: slugTemp }));
    setSlugEditing(false);
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Store Profile | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Store Profile</h1>
            <p className="text-gray-500 mt-1">Manage your public store information</p>
          </div>
          <Button onClick={() => setShowStoreModal(true)}>Edit Profile</Button>
        </div>

        {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        <div className="relative mb-8 rounded-xl overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 h-48">
          {form.storeBanner ? (
            <img src={form.storeBanner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-end gap-6 -mt-20 mb-8 relative z-10 px-6">
          <div className="w-28 h-28 rounded-xl border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
            {form.storeLogo ? (
              <img src={form.storeLogo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          <div className="pb-2">
            <h2 className="text-2xl font-bold text-gray-900">{form.storeName || 'Your Store'}</h2>
            <p className="text-sm text-gray-500">
              {form.storeSlug ? `/${form.storeSlug}` : 'Set your store URL'} · Seller since {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><h2 className="text-lg font-semibold">About Your Store</h2></CardHeader>
            <CardBody>
              <p className="text-sm text-gray-700">{form.storeDescription || 'No description yet. Add a description to tell customers about your store.'}</p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div><dt className="text-xs text-gray-500">Account Email</dt><dd className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</dd></div>
                <div><dt className="text-xs text-gray-500">Contact Email</dt><dd className="text-sm font-medium text-gray-900">{form.contactEmail || 'N/A'}</dd></div>
                <div><dt className="text-xs text-gray-500">Phone</dt><dd className="text-sm font-medium text-gray-900">{form.storePhone || 'N/A'}</dd></div>
                {form.address?.city && (
                  <>
                    <div><dt className="text-xs text-gray-500">City</dt><dd className="text-sm font-medium text-gray-900">{form.address.city}</dd></div>
                    <div><dt className="text-xs text-gray-500">State</dt><dd className="text-sm font-medium text-gray-900">{form.address.state}</dd></div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Social Links</h2></CardHeader>
            <CardBody>
              {Object.entries(form.socialLinks).filter(([, v]) => v).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(form.socialLinks).map(([platform, url]) => url ? (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                      <span className="capitalize">{platform}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : null)}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No social links added yet</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={showStoreModal} onClose={() => setShowStoreModal(false)} title="Edit Store Profile" size="4xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Store Name" value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
              <div className="flex items-center gap-2">
                {slugEditing ? (
                  <>
                    <input className="input-field flex-1" value={slugTemp} onChange={e => setSlugTemp(e.target.value.replace(/[^a-z0-9-]/g, ''))} />
                    <Button size="sm" onClick={handleSlugSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSlugEditing(false)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">/{form.storeSlug || 'not-set'}</span>
                    <Button size="xs" variant="ghost" onClick={() => { setSlugTemp(form.storeSlug); setSlugEditing(true); }}>Edit</Button>
                  </>
                )}
              </div>
            </div>
            <Input label="Contact Email" type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
            <Input label="Store Phone" value={form.storePhone} onChange={e => setForm(f => ({ ...f, storePhone: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
            <textarea rows={4} className="input-field w-full" value={form.storeDescription} onChange={e => setForm(f => ({ ...f, storeDescription: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {form.storeLogo ? <img src={form.storeLogo} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Logo</div>}
                </div>
                <label className="cursor-pointer text-sm text-primary-600 hover:underline">
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Banner</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {form.storeBanner ? <img src={form.storeBanner} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Banner</div>}
                </div>
                <label className="cursor-pointer text-sm text-primary-600 hover:underline">
                  {uploading ? 'Uploading...' : 'Upload Banner'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Street" value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
              </div>
              <Input label="City" value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
              <Input label="State" value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
              <Input label="ZIP Code" value={form.address.zip} onChange={e => setForm(f => ({ ...f, address: { ...f.address, zip: e.target.value } }))} />
              <Input label="Country" value={form.address.country} onChange={e => setForm(f => ({ ...f, address: { ...f.address, country: e.target.value } }))} />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(form.socialLinks).map(([key]) => (
                <Input key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={form.socialLinks[key]} onChange={e => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }))} placeholder={`https://${key}.com/...`} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button fullWidth onClick={handleSave} isLoading={saving}>Save Changes</Button>
            <Button variant="outline" fullWidth onClick={() => setShowStoreModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
