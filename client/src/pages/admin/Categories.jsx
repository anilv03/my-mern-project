import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  resetCategorySuccess, fetchCategoryTree,
} from '../../store/slices/categorySlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const productTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'ebook', label: 'eBooks' },
  { value: 'audiobook', label: 'Audiobooks' },
  { value: 'video_course', label: 'Video Courses' },
  { value: 'course_bundle', label: 'Bundles' },
  { value: 'software', label: 'Software' },
  { value: 'template', label: 'Templates' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'new_book', label: 'New Books' },
  { value: 'book_combo', label: 'Book Combos' },
  { value: 'used_book', label: 'Used Books' },
];

const defaultForm = {
  name: '',
  description: '',
  productType: 'all',
  parent: '',
  icon: '',
  displayOrder: 0,
  isFeatured: false,
  seo: { metaTitle: '', metaDescription: '', metaKeywords: [] },
};

export default function AdminCategories() {
  const dispatch = useDispatch();
  const { categories, categoryTree, isLoading, isSuccess } = useSelector(state => state.categories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories({ limit: 100 }));
    dispatch(fetchCategoryTree());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess) {
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      dispatch(resetCategorySuccess());
    }
  }, [isSuccess, dispatch]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...form,
      displayOrder: parseInt(form.displayOrder) || 0,
      parent: form.parent || null,
    };

    if (editingId) {
      dispatch(updateCategory({ id: editingId, data }));
    } else {
      dispatch(createCategory(data));
    }
  };

  const handleEdit = (category) => {
    setForm({
      name: category.name,
      description: category.description || '',
      productType: category.productType || 'all',
      parent: category.parent?._id || category.parent || '',
      icon: category.icon || '',
      displayOrder: category.displayOrder || 0,
      isFeatured: category.isFeatured || false,
      seo: category.seo || { metaTitle: '', metaDescription: '', metaKeywords: [] },
    });
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deleteModal) {
      dispatch(deleteCategory(deleteModal));
      setDeleteModal(null);
    }
  };

  const CategoryRow = ({ category, depth = 0 }) => (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {depth > 0 && (
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v2m0 0v2m0-2h2m-2 0h-2m-6-4a4 4 0 100-8 4 4 0 000 8zm0 0c-4.418 0-8 1.79-8 4v2" />
              </svg>
            )}
            <span className="font-medium text-gray-900">{category.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge variant={category.isActive ? 'success' : 'secondary'} size="xs">
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Badge variant="primary" size="xs">{category.productType?.replace(/_/g, ' ')}</Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{category.productCount || 0}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{category.displayOrder || 0}</td>
        <td className="px-4 py-3">
          {category.isFeatured && <Badge variant="accent" size="xs">Featured</Badge>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button size="xs" variant="ghost" onClick={() => handleEdit(category)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setDeleteModal(category._id)}>
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </td>
      </tr>
      {category.children?.map(child => (
        <CategoryRow key={child._id} category={child} depth={depth + 1} />
      ))}
    </>
  );

  return (
    <>
      <Helmet><title>Categories | Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Categories</h1>
            <p className="text-gray-500 mt-1">Manage product categories</p>
          </div>
          <Button onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </Button>
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryTree.length > 0 ? categoryTree.map(cat => <CategoryRow key={cat._id} category={cat} />) : (
                    categories.map(cat => <CategoryRow key={cat._id} category={cat} />)
                  )}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-500">No categories found</div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}
        title={editingId ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
              <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className="input-field">
                {productTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} className="input-field">
                <option value="">None (Top Level)</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id} disabled={cat._id === editingId}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Display Order" type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
            <Input label="Icon (emoji or class)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">Featured Category</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}>Cancel</Button>
            <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Category" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this category? This may affect associated products.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
