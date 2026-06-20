import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { formatDate, classNames } from '../../lib/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import adminService from '../../services/adminService';

const statusBadgeVariant = {
  draft: 'secondary',
  published: 'success',
  archived: 'secondary',
};

const tabs = [
  { id: 'blogs', label: 'Blog Posts' },
  { id: 'pages', label: 'Pages' },
];

export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState('blogs');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', coverImage: '',
    category: '', tags: '', status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const perPage = 20;

  useEffect(() => {
    setPage(1);
    fetchItems();
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [page]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: perPage };
      const res = activeTab === 'blogs'
        ? await adminService.getBlogs(params)
        : await adminService.getPages(params);
      setItems(res[activeTab] || res.items || []);
      setTotalPages(res.pagination?.pages || res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.total || res.pagination?.totalItems || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ title: '', content: '', excerpt: '', coverImage: '', category: '', tags: '', status: 'draft' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      content: item.content || '',
      excerpt: item.excerpt || '',
      coverImage: item.coverImage?.url || item.coverImage || '',
      category: item.category || '',
      tags: item.tags?.join(', ') || '',
      status: item.isPublished ? 'published' : (item.status || 'draft'),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    try {
      const data = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      if (editItem) {
        if (activeTab === 'blogs') {
          await adminService.updateBlog(editItem._id, data);
        } else {
          await adminService.updatePage(editItem._id, data);
        }
      } else {
        if (activeTab === 'blogs') {
          await adminService.createBlog(data);
        } else {
          await adminService.createPage(data);
        }
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      if (activeTab === 'blogs') {
        await adminService.deleteBlog(deleteModal);
      } else {
        await adminService.deletePage(deleteModal);
      }
      setDeleteModal(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Helmet><title>CMS - Admin | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">CMS</h1>
            <p className="text-gray-500 mt-1">Manage blog posts and pages</p>
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {activeTab === 'blogs' ? 'New Post' : 'New Page'}
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card padding={false}>
          {isLoading ? (
            <PageLoader />
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {activeTab === 'blogs' ? 'posts' : 'pages'} yet</h3>
              <p className="text-gray-500">Create your first{item => item ? '' : ''} to get started</p>
              <Button className="mt-4" onClick={openCreateModal}>
                {activeTab === 'blogs' ? 'Create Post' : 'Create Page'}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map(item => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{item.title}</p>
                          {item.excerpt && <p className="text-xs text-gray-500 truncate max-w-[250px]">{item.excerpt}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.author?.name || item.author?.storeName || item.author || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant[item.status || (item.isPublished ? 'published' : 'draft')] || 'secondary'} size="xs">{item.status || (item.isPublished ? 'published' : 'draft')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.viewCount || item.views || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button size="xs" variant="ghost" onClick={() => openEditModal(item)} title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button size="xs" variant="ghost" className="text-red-500" onClick={() => setDeleteModal(item._id)} title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">
                    Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalItems)} of {totalItems}
                  </span>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? `Edit ${activeTab === 'blogs' ? 'Post' : 'Page'}` : `Create ${activeTab === 'blogs' ? 'Post' : 'Page'}`} size="2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter title" />
          {activeTab === 'blogs' && (
            <>
              <Input label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief description" />
              <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2, tag3" />
            </>
          )}
          <Input label="Cover Image URL" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              className="input-field resize-y min-h-[200px]"
              placeholder="Write your content here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting} disabled={!form.title || !form.content}>{editItem ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={`Delete ${activeTab === 'blogs' ? 'Post' : 'Page'}`} size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this {activeTab === 'blogs' ? 'post' : 'page'}? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
