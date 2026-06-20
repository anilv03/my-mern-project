import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchBlogById, updateBlog, resetBlogSuccess, clearCurrentBlog } from '../../store/slices/blogSlice';
import uploadService from '../../services/uploadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';

export default function SellerEditBlog() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentBlog, isSuccess, isLoading, isError, message } = useSelector(state => state.blog);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    tagInput: '',
    coverImage: null,
    isPublished: false,
    seo: { metaTitle: '', metaDescription: '', metaKeywords: [] },
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dispatch(fetchBlogById(id));
    return () => { dispatch(clearCurrentBlog()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentBlog && !loaded) {
      setForm({
        title: currentBlog.title || '',
        slug: currentBlog.slug || '',
        excerpt: currentBlog.excerpt || '',
        content: currentBlog.content || '',
        category: currentBlog.category || '',
        tags: currentBlog.tags || [],
        tagInput: '',
        coverImage: currentBlog.coverImage || null,
        isPublished: currentBlog.isPublished || false,
        seo: {
          metaTitle: currentBlog.seo?.metaTitle || '',
          metaDescription: currentBlog.seo?.metaDescription || '',
          metaKeywords: currentBlog.seo?.metaKeywords || [],
        },
      });
      setLoaded(true);
    }
  }, [currentBlog, loaded]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(resetBlogSuccess());
      navigate('/seller/blogs');
    }
  }, [isSuccess, dispatch, navigate]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleAddTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      updateForm('tags', [...form.tags, form.tagInput.trim()]);
      updateForm('tagInput', '');
    }
  };

  const handleRemoveTag = (tag) => {
    updateForm('tags', form.tags.filter(t => t !== tag));
  };

  const handleCoverImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadService.uploadImage(file);
      updateForm('coverImage', { url: uploaded.url, public_id: uploaded.public_id });
    } catch (err) {
      setErrors(prev => ({ ...prev, coverImage: 'Failed to upload image' }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    delete payload.tagInput;
    dispatch(updateBlog({ id, data: payload }));
  };

  const handlePublishToggle = () => {
    const payload = { ...form, isPublished: !form.isPublished };
    delete payload.tagInput;
    dispatch(updateBlog({ id, data: payload }));
  };

  if (!loaded && !currentBlog) {
    return <PageLoader />;
  }

  return (
    <>
      <Helmet><title>Edit Blog | Seller | Zalnio</title></Helmet>

      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Edit Blog Post</h1>
            <p className="text-gray-500 mt-1">{form.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePublishToggle} disabled={isLoading}>
              {form.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.title || !form.content}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {isError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Input
                label="Title *"
                placeholder="Enter blog title"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
                error={errors.title}
              />

              <Input
                label="Slug"
                placeholder="auto-generated"
                value={form.slug}
                onChange={e => updateForm('slug', e.target.value)}
                helperText="URL-friendly identifier"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="Brief summary of your blog post"
                  value={form.excerpt}
                  onChange={e => updateForm('excerpt', e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{form.excerpt.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  className="input-field min-h-[300px] font-mono text-sm"
                  placeholder="Write your blog content here (HTML/markdown supported)"
                  value={form.content}
                  onChange={e => updateForm('content', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Media & Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex items-center gap-4">
                  {form.coverImage?.url ? (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <img src={form.coverImage.url} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateForm('coverImage', null)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverImage} disabled={uploading} className="text-sm" />
                </div>
                {errors.coverImage && <p className="text-sm text-red-600 mt-1">{errors.coverImage}</p>}
              </div>

              <Input
                label="Category"
                placeholder="e.g. Technology, Business"
                value={form.category}
                onChange={e => updateForm('category', e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Add a tag"
                    value={form.tagInput}
                    onChange={e => updateForm('tagInput', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>Add</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">SEO</h3>
            <div className="space-y-4">
              <Input
                label="Meta Title"
                placeholder="SEO title"
                value={form.seo.metaTitle}
                onChange={e => updateForm('seo', { ...form.seo, metaTitle: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  className="input-field min-h-[60px]"
                  placeholder="SEO description"
                  value={form.seo.metaDescription}
                  onChange={e => updateForm('seo', { ...form.seo, metaDescription: e.target.value })}
                  maxLength={320}
                />
              </div>
              <Input
                label="Meta Keywords"
                placeholder="Comma-separated keywords"
                value={form.seo.metaKeywords.join(', ')}
                onChange={e => updateForm('seo', { ...form.seo, metaKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
              />
            </div>
          </Card>
        </form>
      </div>
    </>
  );
}
