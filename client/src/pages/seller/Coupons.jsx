import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } from '../../store/slices/couponSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatPrice, classNames } from '../../lib/helpers';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (₹)' },
];

const emptyCoupon = {
  code: '', type: 'percentage', discountValue: '', minimumOrderAmount: '',
  maxDiscountAmount: '', usageLimit: '', usageLimitPerUser: '',
  startsAt: '', expiresAt: '', isActive: true, applicableProducts: 'all',
};

export default function SellerCoupons() {
  const dispatch = useDispatch();
  const { coupons, isLoading, isSuccess, pagination } = useSelector(state => state.coupons);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState(emptyCoupon);
  const [deleteId, setDeleteId] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    dispatch(fetchCoupons({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    if (isSuccess) {
      setShowModal(false);
      setEditCoupon(null);
      setForm(emptyCoupon);
    }
  }, [isSuccess]);

  const handleCreate = () => {
    setEditCoupon(null);
    setForm(emptyCoupon);
    setShowModal(true);
  };

  const handleEdit = (coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      usageLimit: coupon.usageLimit || '',
      usageLimitPerUser: coupon.usageLimitPerUser || '',
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
      isActive: coupon.isActive,
      applicableProducts: coupon.applicableProducts || 'all',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      discountValue: parseFloat(form.discountValue),
      minimumOrderAmount: form.minimumOrderAmount ? parseFloat(form.minimumOrderAmount) : undefined,
      maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      usageLimitPerUser: form.usageLimitPerUser ? parseInt(form.usageLimitPerUser) : undefined,
    };
    if (editCoupon) {
      dispatch(updateCoupon({ id: editCoupon._id, data }));
    } else {
      dispatch(createCoupon(data));
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      dispatch(deleteCoupon(deleteId));
      setDeleteId(null);
    }
  };

  const handleToggle = (id) => {
    dispatch(toggleCouponStatus(id));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(f => ({ ...f, code }));
  };

  return (
    <>
      <Helmet><title>Coupons | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-500 mt-1">Create and manage promotional coupons</p>
          </div>
          <Button onClick={handleCreate}>Create Coupon</Button>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: '', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'expired', label: 'Expired' },
            { value: 'scheduled', label: 'Scheduled' },
          ].map(f => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && coupons.length === 0 ? (
          <PageLoader />
        ) : coupons.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No coupons yet</h3>
            <p className="text-gray-500 mb-4">Create your first coupon to boost sales</p>
            <Button onClick={handleCreate}>Create Coupon</Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {coupons.map(coupon => (
                <Card key={coupon._id} padding={false}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <button onClick={() => copyCode(coupon.code)} className="flex items-center gap-2 group" title="Copy code">
                          <code className="text-lg font-bold font-mono text-primary-600">{coupon.code}</code>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {copied === coupon.code && <span className="text-xs text-green-600 ml-2">Copied!</span>}
                      </div>
                      <Badge variant={coupon.isActive ? 'success' : coupon.status === 'expired' ? 'danger' : 'secondary'} size="xs">
                        {coupon.status || (coupon.isActive ? 'active' : 'inactive')}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {coupon.type === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">OFF</span>
                    </div>

                    {coupon.minimumOrderAmount > 0 && (
                      <p className="text-xs text-gray-500 mb-1">Min. Order: {formatPrice(coupon.minimumOrderAmount)}</p>
                    )}
                    {coupon.expiresAt && (
                      <p className="text-xs text-gray-500 mb-3">
                        {new Date(coupon.expiresAt) < new Date() ? 'Expired' : 'Expires'}: {formatDate(coupon.expiresAt)}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <span>Used: {coupon.usedCount || 0}/{coupon.usageLimit || '∞'}</span>
                      {coupon.usageLimitPerUser && <span>· {coupon.usageLimitPerUser} per user</span>}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button size="xs" variant="outline" onClick={() => handleEdit(coupon)}>Edit</Button>
                      <Button size="xs" variant="ghost" onClick={() => handleToggle(coupon._id)}>
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setDeleteId(coupon._id)} className="text-red-500 hover:text-red-700">Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
                <Button variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCoupon ? 'Edit Coupon' : 'Create Coupon'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Coupon Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="e.g. SUMMER20" />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={generateCode} className="mb-1">Generate</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field w-full">
                {DISCOUNT_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
              </select>
            </div>
            <Input label={form.type === 'percentage' ? 'Discount (%)' : 'Discount Amount (₹)'} type="number" min="0" step="0.01" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum Order Amount (₹)" type="number" min="0" value={form.minimumOrderAmount} onChange={e => setForm(f => ({ ...f, minimumOrderAmount: e.target.value }))} />
            {form.type === 'percentage' && (
              <Input label="Max Discount Amount (₹)" type="number" min="0" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Usage Limit" type="number" min="0" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited if empty" />
            <Input label="Per User Limit" type="number" min="0" value={form.usageLimitPerUser} onChange={e => setForm(f => ({ ...f, usageLimitPerUser: e.target.value }))} placeholder="Unlimited if empty" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
            <Input label="Expiry Date" type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-700">Active immediately</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" fullWidth isLoading={isLoading}>{editCoupon ? 'Update Coupon' : 'Create Coupon'}</Button>
            <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Coupon" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this coupon? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
