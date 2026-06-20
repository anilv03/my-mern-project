import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCoupons, createCoupon, deleteCoupon, resetAdminSuccess } from '../../store/slices/adminSlice';
import { formatDate, formatPrice, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const defaultForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  validFrom: '',
  validUntil: '',
  usageLimit: '',
  usageLimitPerUser: '',
  isActive: true,
  applicableProductTypes: [],
};

const productTypeOptions = [
  { value: 'ebook', label: 'eBook' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'video_course', label: 'Video Course' },
  { value: 'course_bundle', label: 'Course Bundle' },
  { value: 'software', label: 'Software' },
  { value: 'template', label: 'Template' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'new_book', label: 'New Book' },
  { value: 'book_combo', label: 'Book Combo' },
  { value: 'used_book', label: 'Used Book' },
];

export default function AdminCoupons() {
  const dispatch = useDispatch();
  const { coupons, isLoading, isSuccess } = useSelector(state => state.admin);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setShowForm(false);
      setForm(defaultForm);
      dispatch(resetAdminSuccess());
    }
  }, [isSuccess, dispatch]);

  const validate = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.discountValue || Number(form.discountValue) <= 0) errs.discountValue = 'Enter a valid discount';
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) errs.discountValue = 'Cannot exceed 100%';
    if (!form.validFrom) errs.validFrom = 'Required';
    if (!form.validUntil) errs.validUntil = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...form,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      usageLimitPerUser: form.usageLimitPerUser ? Number(form.usageLimitPerUser) : undefined,
    };

    dispatch(createCoupon(data));
  };

  const handleDelete = () => {
    if (deleteModal) {
      dispatch(deleteCoupon(deleteModal));
      setDeleteModal(null);
    }
  };

  const sortedCoupons = [...coupons].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalPages = Math.ceil(sortedCoupons.length / perPage);
  const paginatedCoupons = sortedCoupons.slice((page - 1) * perPage, page * perPage);

  const handleTypeToggle = (type) => {
    setForm(f => ({
      ...f,
      applicableProductTypes: f.applicableProductTypes.includes(type)
        ? f.applicableProductTypes.filter(t => t !== type)
        : [...f.applicableProductTypes, type],
    }));
  };

  return (
    <>
      <Helmet><title>Coupons | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-500 mt-1">Manage discount coupons</p>
          </div>
          <Button onClick={() => { setForm(defaultForm); setShowForm(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Coupon
          </Button>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No coupons yet</h3>
              <p className="text-gray-500 mb-4">Create your first coupon to start offering discounts</p>
              <Button onClick={() => { setForm(defaultForm); setShowForm(true); }}>Add Coupon</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid From</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used/Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedCoupons.map(coupon => (
                      <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-bold text-gray-900 uppercase">{coupon.code}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <span className="text-xs text-gray-500 ml-1">(max {formatPrice(coupon.maxDiscount)})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(coupon.validFrom)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(coupon.validUntil)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {coupon.usedCount || 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={coupon.isActive ? 'success' : 'secondary'} size="xs">
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteModal(coupon._id)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">{coupons.length} total coupons</span>
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

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setForm(defaultForm); }} title="Add Coupon" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Coupon Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} error={errors.code} placeholder="e.g. SAVE20" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-field">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={form.discountType === 'percentage' ? 'Discount % *' : 'Discount Amount *'} type="number" min="0" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} error={errors.discountValue} />
            {form.discountType === 'percentage' && (
              <Input label="Max Discount" type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Order Amount" type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            <Input label="Usage Limit" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} helperText="Leave empty for unlimited" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valid From *" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} error={errors.validFrom} />
            <Input label="Valid Until *" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} error={errors.validUntil} />
          </div>
          <Input label="Usage Limit Per User" type="number" min="0" value={form.usageLimitPerUser} onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })} helperText="Leave empty for unlimited" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Product Types</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {productTypeOptions.map(pt => (
                <label key={pt.value} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.applicableProductTypes.includes(pt.value)}
                    onChange={() => handleTypeToggle(pt.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{pt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm(defaultForm); }}>Cancel</Button>
            <Button type="submit">Create Coupon</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Coupon" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this coupon? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
