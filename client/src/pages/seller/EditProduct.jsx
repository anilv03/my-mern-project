import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { updateProduct, resetSellerSuccess, resetSellerFormState } from '../../store/slices/sellerSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import sellerService from '../../services/sellerService';
import uploadService from '../../services/uploadService';
const { uploadImages, uploadVideo } = uploadService;
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';

const productTypes = [
  { value: 'ebook', label: 'eBook' }, { value: 'audiobook', label: 'Audiobook' },
  { value: 'video_course', label: 'Video Course' }, { value: 'software', label: 'Software' },
  { value: 'template', label: 'Template' }, { value: 'new_book', label: 'New Book' },
  { value: 'used_book', label: 'Used Book' }, { value: 'course_bundle', label: 'Bundle' },
  { value: 'subscription', label: 'Subscription' },
];

const languages = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic', 'Turkish', 'Dutch',
  'Polish', 'Swedish', 'Danish', 'Norwegian', 'Finnish', 'Greek', 'Hebrew',
  'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Gujarati', 'Urdu', 'Punjabi', 'Other',
];

const sections = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'pricing', label: 'Pricing & Inventory' },
  { id: 'media', label: 'Media' },
  { id: 'details', label: 'Additional Details' },
  { id: 'seo', label: 'SEO' },
];

export default function SellerEditProduct() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuccess, isLoading } = useSelector(state => state.seller);
  const { categories } = useSelector(state => state.categories);
  const [currentSection, setCurrentSection] = useState('basic');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [courseVideoUploading, setCourseVideoUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const courseVideoInputRef = useRef(null);

  const [form, setForm] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(resetSellerFormState());
  }, [dispatch]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await sellerService.getProductById(id);
        setForm({
          title: product.title || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          productType: product.productType || 'ebook',
          category: product.category?._id || product.category || '',
          tags: product.tags || [],
          tagInput: '',
          pricing: {
            originalPrice: product.pricing?.originalPrice || '',
            sellingPrice: product.pricing?.sellingPrice || '',
            taxRate: product.pricing?.taxRate || '',
          },
          inventory: {
            quantity: product.inventory?.quantity || 0,
            trackInventory: product.inventory?.trackInventory ?? true,
            lowStockThreshold: product.inventory?.lowStockThreshold || 5,
            allowBackorder: product.inventory?.allowBackorder || false,
          },
          settings: {
            isDownloadable: product.settings?.isDownloadable ?? true,
            requiresShipping: product.settings?.requiresShipping ?? false,
            isBundle: product.settings?.isBundle ?? false,
            isSubscription: product.settings?.isSubscription ?? false,
            hasSample: product.settings?.hasSample ?? false,
            isbnRequired: product.settings?.isbnRequired ?? false,
            ageRestriction: product.settings?.ageRestriction || 0,
          },
          images: product.images || [],
          videos: product.videos || [],
          physicalDetails: {
            isbn: product.physicalDetails?.isbn || '',
            publisher: product.physicalDetails?.publisher || '',
            language: product.physicalDetails?.language || 'English',
            pageCount: product.physicalDetails?.pageCount || '',
            format: product.physicalDetails?.format || 'paperback',
            condition: product.physicalDetails?.condition || 'new',
            edition: product.physicalDetails?.edition || '',
          },
          digitalFile: {
            fileType: product.digitalFile?.fileType || 'pdf',
            isDownloadable: product.digitalFile?.isDownloadable ?? true,
            author: product.digitalFile?.author || '',
            isbn: product.digitalFile?.isbn || '',
            publisher: product.digitalFile?.publisher || '',
            language: product.digitalFile?.language || 'English',
            pages: product.digitalFile?.pages || '',
            duration: product.digitalFile?.duration || '',
            fileUrl: product.digitalFile?.fileUrl || '',
            publicId: product.digitalFile?.publicId || '',
            fileName: product.digitalFile?.fileName || '',
            fileSize: product.digitalFile?.fileSize || '',
            courseVideos: product.digitalFile?.courseVideos || [],
          },
          seo: {
            metaTitle: product.seo?.metaTitle || '',
            metaDescription: product.seo?.metaDescription || '',
            metaKeywords: product.seo?.metaKeywords || [],
          },
        });
      } catch (err) {
        navigate('/seller/products');
      }
      setPageLoading(false);
    };
    loadProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(resetSellerSuccess());
      navigate('/seller/products');
    }
  }, [isSuccess, dispatch, navigate]);

  if (pageLoading || !form) return <PageLoader />;

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const updateNested = (parent, key, value) => {
    setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const uploaded = await uploadImages(files);
      updateForm('images', [...form.images, ...uploaded]);
    } catch (err) {
      setErrors(prev => ({ ...prev, images: 'Failed to upload images' }));
    }
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    updateForm('images', form.images.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      for (const file of files) {
        const uploaded = await uploadVideo(file);
        updateForm('videos', [...form.videos, uploaded]);
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, videos: 'Failed to upload video' }));
    }
    setUploadingImages(false);
  };

  const removeVideo = (index) => {
    updateForm('videos', form.videos.filter((_, i) => i !== index));
  };

  const otherDurationTypes = ['audiobook', 'video_course', 'course_bundle', 'subscription'];

  const fileUploadConfig = {
    ebook: { accept: '.pdf,.epub,.zip', label: 'Upload eBook File (PDF, EPUB, ZIP)', uploadFn: 'uploadDocument' },
    audiobook: { accept: '.mp3,.wav,.ogg,.aac', label: 'Upload Audio File (MP3, WAV, OGG, AAC)', uploadFn: 'uploadAudio' },
    video_course: { accept: '.mp4,.webm,.avi,.mov', label: 'Upload Video File (MP4, WEBM, MOV)', uploadFn: 'uploadVideo' },
    software: { accept: '.zip,.exe', label: 'Upload Software File (ZIP, EXE)', uploadFn: 'uploadDocument' },
    template: { accept: '.zip', label: 'Upload Template File (ZIP)', uploadFn: 'uploadDocument' },
    course_bundle: { accept: '.zip,.pdf,.mp4,.mp3', label: 'Upload Bundle File', uploadFn: 'uploadDocument' },
    subscription: { accept: '.zip,.pdf,.mp4,.mp3', label: 'Upload Content File', uploadFn: 'uploadDocument' },
  };

  const handleDigitalFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    setErrors(prev => ({ ...prev, digitalFile: '' }));
    const cfg = fileUploadConfig[form.productType] || fileUploadConfig.ebook;
    try {
      const uploaded = await uploadService[cfg.uploadFn](file);
      setForm(prev => ({
        ...prev,
        digitalFile: {
          ...prev.digitalFile,
          fileUrl: uploaded.url,
          publicId: uploaded.public_id,
          fileName: uploaded.originalName,
          fileSize: uploaded.size,
        },
      }));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload file';
      setErrors(prev => ({ ...prev, digitalFile: msg }));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDigitalFile = () => {
    setForm(prev => ({
      ...prev,
      digitalFile: {
        ...prev.digitalFile,
        fileUrl: '',
        publicId: '',
        fileName: '',
        fileSize: '',
      },
    }));
  };

  const handleCourseVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setCourseVideoUploading(true);
    try {
      const results = await Promise.all(files.map(file => uploadService.uploadVideo(file)));
      setForm(prev => ({
        ...prev,
        digitalFile: {
          ...prev.digitalFile,
          courseVideos: [
            ...prev.digitalFile.courseVideos,
            ...results.map((uploaded, i) => ({
              title: '',
              url: uploaded.url,
              publicId: uploaded.public_id,
              fileName: uploaded.originalName,
              fileSize: uploaded.size,
              order: prev.digitalFile.courseVideos.length + i,
            })),
          ],
        },
      }));
    } catch (err) {
      setErrors(prev => ({ ...prev, digitalFile: err.response?.data?.message || err.message || 'Failed to upload video' }));
    } finally {
      setCourseVideoUploading(false);
      if (courseVideoInputRef.current) courseVideoInputRef.current.value = '';
    }
  };

  const removeCourseVideo = (index) => {
    setForm(prev => ({
      ...prev,
      digitalFile: {
        ...prev.digitalFile,
        courseVideos: prev.digitalFile.courseVideos.filter((_, i) => i !== index).map((v, i) => ({ ...v, order: i })),
      },
    }));
  };

  const updateCourseVideoTitle = (index, title) => {
    setForm(prev => ({
      ...prev,
      digitalFile: {
        ...prev.digitalFile,
        courseVideos: prev.digitalFile.courseVideos.map((v, i) => i === index ? { ...v, title } : v),
      },
    }));
  };

  const fieldSectionMap = {
    title: 'basic', description: 'basic', shortDescription: 'basic', category: 'basic', tags: 'basic', productType: 'basic',
    'pricing.originalPrice': 'pricing', 'pricing.sellingPrice': 'pricing', 'pricing.taxRate': 'pricing',
    images: 'media', videos: 'media',
    seo: 'seo',
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.pricing.originalPrice) errs['pricing.originalPrice'] = 'Original price is required';
    if (!form.pricing.sellingPrice) errs['pricing.sellingPrice'] = 'Selling price is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstErrField = Object.keys(errs)[0];
      const section = fieldSectionMap[firstErrField] || 'basic';
      setCurrentSection(section);
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      productType: form.productType,
      category: form.category,
      tags: form.tags,
      pricing: {
        originalPrice: parseFloat(form.pricing.originalPrice),
        sellingPrice: parseFloat(form.pricing.sellingPrice),
        taxRate: form.pricing.taxRate ? parseFloat(form.pricing.taxRate) : undefined,
      },
      inventory: {
        quantity: parseInt(form.inventory.quantity) || 0,
        trackInventory: form.inventory.trackInventory,
        lowStockThreshold: parseInt(form.inventory.lowStockThreshold) || 5,
        allowBackorder: form.inventory.allowBackorder,
      },
      settings: form.settings,
      images: form.images.map((img, idx) => ({
        url: img.url,
        public_id: img.public_id,
        isPrimary: idx === 0,
      })),
      videos: form.videos.map(v => ({
        url: v.url,
        public_id: v.public_id,
        thumbnail: v.thumbnail,
      })),
      physicalDetails: isPhysical
        ? { ...form.physicalDetails, pageCount: form.physicalDetails.pageCount ? parseInt(form.physicalDetails.pageCount) : undefined }
        : undefined,
      digitalFile: form.settings.isDownloadable ? {
        ...form.digitalFile,
        pages: form.digitalFile.pages ? parseInt(form.digitalFile.pages) : undefined,
        duration: form.digitalFile.duration ? parseInt(form.digitalFile.duration) : undefined,
        fileSize: form.digitalFile.fileSize ? parseFloat(form.digitalFile.fileSize) : undefined,
      } : undefined,
      seo: form.seo.metaTitle || form.seo.metaDescription ? form.seo : undefined,
    };

    dispatch(updateProduct({ id, data }));
  };

  const isDigital = ['ebook', 'audiobook', 'video_course', 'software', 'template', 'subscription', 'course_bundle'].includes(form.productType);
  const isPhysical = ['new_book', 'used_book', 'book_combo'].includes(form.productType);

  return (
    <>
      <Helmet><title>Edit Product | Seller | Zalnio</title></Helmet>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-500 mt-1">{form.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/seller/products')}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Update Product</Button>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              {sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setCurrentSection(section.id)}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentSection === section.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{sections.find(s => s.id === currentSection)?.label}</h2>

              {currentSection === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Input label="Product Title *" value={form.title} onChange={(e) => updateForm('title', e.target.value)} error={errors.title} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                      <textarea rows={6} className="input-field" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
                      {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>
                    <Input label="Short Description" value={form.shortDescription} onChange={(e) => updateForm('shortDescription', e.target.value)} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                      <select value={form.productType} onChange={(e) => updateForm('productType', e.target.value)} className="input-field">
                        {productTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="input-field">
                        <option value="">Select a category</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                      </select>
                      {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {form.tags.map(tag => <Badge key={tag} variant="secondary" removable onRemove={() => handleRemoveTag(tag)}>{tag}</Badge>)}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" className="input-field flex-1" placeholder="Add a tag" value={form.tagInput} onChange={(e) => updateForm('tagInput', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                      <Button type="button" variant="secondary" onClick={handleAddTag}>Add</Button>
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Original Price (₹) *" type="number" value={form.pricing.originalPrice} onChange={(e) => updateNested('pricing', 'originalPrice', e.target.value)} error={errors['pricing.originalPrice']} />
                    <Input label="Selling Price (₹) *" type="number" value={form.pricing.sellingPrice} onChange={(e) => updateNested('pricing', 'sellingPrice', e.target.value)} error={errors['pricing.sellingPrice']} />
                    <Input label="Tax Rate (%)" type="number" value={form.pricing.taxRate} onChange={(e) => updateNested('pricing', 'taxRate', e.target.value)} />
                  </div>
                  {!isDigital && (
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="Quantity" type="number" value={form.inventory.quantity} onChange={(e) => updateNested('inventory', 'quantity', e.target.value)} />
                        <Input label="Low Stock Threshold" type="number" value={form.inventory.lowStockThreshold} onChange={(e) => updateNested('inventory', 'lowStockThreshold', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentSection === 'media' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {idx === 0 && <Badge variant="primary" size="xs" className="absolute top-2 left-2">Primary</Badge>}
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 transition-colors">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span className="text-xs">{uploadingImages ? 'Uploading...' : 'Add Image'}</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Videos</label>
                    <p className="text-xs text-gray-400 mb-3">Upload promotional or demo videos for your product.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {form.videos.map((vid, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 group">
                          {vid.thumbnail ? (
                            <img src={vid.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                          <button type="button" onClick={() => removeVideo(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <label className="aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 transition-colors">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">{uploadingImages ? 'Uploading...' : 'Add Video'}</span>
                        <input type="file" multiple accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingImages} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentSection === 'details' && (
                <div className="space-y-6">
                  {isDigital && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Digital File Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                            <select value={form.digitalFile.fileType} onChange={(e) => updateNested('digitalFile', 'fileType', e.target.value)} className="input-field">
                              <option value="pdf">PDF</option><option value="epub">EPUB</option><option value="mp3">MP3</option>
                              <option value="mp4">MP4</option><option value="zip">ZIP</option><option value="other">Other</option>
                            </select>
                          </div>
                          <Input label="Publisher" placeholder="Publisher name" value={form.digitalFile.publisher} onChange={(e) => updateNested('digitalFile', 'publisher', e.target.value)} />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                            <select value={form.digitalFile.language} onChange={(e) => updateNested('digitalFile', 'language', e.target.value)} className="input-field">
                              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                          </div>
                          <Input label="ISBN" placeholder="Enter ISBN" value={form.digitalFile.isbn} onChange={(e) => updateNested('digitalFile', 'isbn', e.target.value)} />
                          {form.productType === 'ebook' && (
                            <Input label="Author" placeholder="Author name" value={form.digitalFile.author} onChange={(e) => updateNested('digitalFile', 'author', e.target.value)} />
                          )}
                          {form.digitalFile.fileType !== 'mp3' && (
                            <Input label="Pages" type="number" value={form.digitalFile.pages} onChange={(e) => updateNested('digitalFile', 'pages', e.target.value)} />
                          )}
                          {otherDurationTypes.includes(form.productType) && (
                            <Input label="Duration (min)" type="number" value={form.digitalFile.duration} onChange={(e) => updateNested('digitalFile', 'duration', e.target.value)} />
                          )}
                        </div>

                        {form.productType === 'video_course' ? (
                          <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Videos</label>
                            {form.digitalFile.courseVideos.map((video, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 mb-2">
                                <svg className="w-8 h-8 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    placeholder="Video title"
                                    value={video.title}
                                    onChange={(e) => updateCourseVideoTitle(idx, e.target.value)}
                                    className="w-full text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none py-1"
                                  />
                                  <p className="text-xs text-gray-500 truncate">{video.fileName}</p>
                                </div>
                                <button type="button" onClick={() => removeCourseVideo(idx)} className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors flex-shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            <div
                              onClick={() => courseVideoInputRef.current?.click()}
                              className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
                            >
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {courseVideoUploading ? (
                                <span className="text-sm text-gray-500">Uploading...</span>
                              ) : (
                                <span className="text-sm text-gray-500">Add Video (MP4, WEBM, MOV)</span>
                              )}
                            </div>
                            <input
                              ref={courseVideoInputRef}
                              type="file"
                              accept="video/mp4,video/webm,video/x-msvideo,video/quicktime"
                              className="hidden"
                              multiple
                              onChange={handleCourseVideoUpload}
                            />
                            {errors.digitalFile && <p className="mt-1 text-sm text-red-600">{errors.digitalFile}</p>}
                          </div>
                        ) : (
                          <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                            {(() => {
                              const cfg = fileUploadConfig[form.productType] || fileUploadConfig.ebook;
                              const hasFile = !!form.digitalFile.fileUrl;
                              return hasFile ? (
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                                  <svg className="w-8 h-8 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{form.digitalFile.fileName}</p>
                                    <p className="text-xs text-gray-500">{form.digitalFile.fileSize ? (form.digitalFile.fileSize / (1024 * 1024)).toFixed(2) : ''} MB</p>
                                  </div>
                                  <button type="button" onClick={removeDigitalFile} className="p-1.5 hover:bg-red-100 rounded-full text-red-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 transition-colors"
                                >
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  {uploadingFile ? (
                                    <span className="text-sm text-gray-500">Uploading...</span>
                                  ) : (
                                    <span className="text-sm text-gray-500">{cfg.label}</span>
                                  )}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={cfg.accept}
                                    className="hidden"
                                    onChange={handleDigitalFileUpload}
                                  />
                                </div>
                              );
                            })()}
                            {errors.digitalFile && <p className="mt-1 text-sm text-red-600">{errors.digitalFile}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {isPhysical && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Book Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="ISBN" value={form.physicalDetails.isbn} onChange={(e) => updateNested('physicalDetails', 'isbn', e.target.value)} />
                        <Input label="Publisher" value={form.physicalDetails.publisher} onChange={(e) => updateNested('physicalDetails', 'publisher', e.target.value)} />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                          <select value={form.physicalDetails.language} onChange={(e) => updateNested('physicalDetails', 'language', e.target.value)} className="input-field">
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                          </select>
                        </div>
                        <Input label="Page Count" type="number" value={form.physicalDetails.pageCount} onChange={(e) => updateNested('physicalDetails', 'pageCount', e.target.value)} />
                        <Input label="Edition" value={form.physicalDetails.edition} onChange={(e) => updateNested('physicalDetails', 'edition', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentSection === 'seo' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Meta Title" value={form.seo.metaTitle} onChange={(e) => updateNested('seo', 'metaTitle', e.target.value)} />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                      <textarea rows={3} className="input-field" value={form.seo.metaDescription} onChange={(e) => updateNested('seo', 'metaDescription', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
