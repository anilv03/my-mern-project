import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { createBlog, resetBlogSuccess } from '../../store/slices/blogSlice';
import uploadService from '../../services/uploadService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function SellerAddBlog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuccess, isLoading, isError, message } = useSelector(state => state.blog);
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

  const handleSlugGeneration = (title) => {
    updateForm('title', title);
    if (!form.slug || form.slug === form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      updateForm('slug', slug);
    }
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
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    payload.slug = slug;
    dispatch(createBlog(payload));
  };

  const handleSaveDraft = () => {
    setForm(prev => ({ ...prev, isPublished: false }));
    setTimeout(() => {
      const payload = { ...form, isPublished: false };
      delete payload.tagInput;
      payload.slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      dispatch(createBlog(payload));
    }, 0);
  };

  return (
    <>
      <Helmet><title>Add Blog | Seller | Zalnio</title></Helmet>

      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Add Blog Post</h1>
            <p className="text-gray-500 mt-1">Write a new blog post</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={isLoading || !form.title}>
              Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !form.title || !form.content}>
              {isLoading ? 'Publishing...' : 'Publish'}
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
                onChange={e => handleSlugGeneration(e.target.value)}
                error={errors.title}
              />

              <Input
                label="Slug"
                placeholder="auto-generated"
                value={form.slug}
                onChange={e => updateForm('slug', e.target.value)}
                helperText="URL-friendly identifier (auto-generated from title)"
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
