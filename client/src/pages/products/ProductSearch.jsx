import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProductCard from '../../components/ui/ProductCard';
import Pagination from '../../components/ui/Pagination';
import { PageLoader, ProductCardSkeleton } from '../../components/ui/Loader';
import { classNames } from '../../lib/helpers';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'sales', label: 'Best Selling' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'name_desc', label: 'Name: Z-A' },
];

const productTypes = [
  { value: 'ebook', label: 'eBooks' },
  { value: 'audiobook', label: 'Audiobooks' },
  { value: 'video_course', label: 'Video Courses' },
  { value: 'software', label: 'Software' },
  { value: 'template', label: 'Templates' },
  { value: 'new_book', label: 'Books' },
  { value: 'used_book', label: 'Used Books' },
  { value: 'course_bundle', label: 'Bundles' },
  { value: 'subscription', label: 'Subscriptions' },
];

const priceRanges = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000, max: '' },
];

const ratingOptions = [
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];



export default function ProductSearch() {
  const dispatch = useDispatch();
  const { products, isLoading, pagination } = useSelector(state => state.products);
  const { categories } = useSelector(state => state.categories);
  const [searchParams] = useSearchParams();

  const queryFromUrl = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [localPage, setLocalPage] = useState(1);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setSearchQuery(queryFromUrl);
    setLocalPage(1);
  }, [queryFromUrl]);

  useEffect(() => {
    dispatch(fetchCategories({ isActive: true }));
  }, [dispatch]);

  const filters = useMemo(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedTypes.length > 0) params.productType = selectedTypes.join(',');
    if (selectedPrice) {
      params.minPrice = selectedPrice.min;
      if (selectedPrice.max !== '') params.maxPrice = selectedPrice.max;
    }
    if (selectedRating) params.rating = selectedRating;
    if (selectedCategory) params.category = selectedCategory;
    if (sort) params.sort = sort;
    params.page = localPage;
    return params;
  }, [searchQuery, selectedTypes, selectedPrice, selectedRating, selectedCategory, sort, localPage]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handlePageChange = useCallback((newPage) => {
    setLocalPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTypes([]);
    setSelectedPrice(null);
    setSelectedRating('');
    setSelectedCategory('');
    setSort('newest');
    setLocalPage(1);
  }, []);

  const toggleProductType = useCallback((type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setLocalPage(1);
  }, []);

  const hasActiveFilters = selectedTypes.length > 0 || selectedPrice || selectedRating || selectedCategory || sort !== 'newest';

  return (
    <>
      <Helmet>
        <title>{searchQuery ? `Search: ${searchQuery} | Zalnio` : 'Search Products | Zalnio'}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {searchQuery ? (
              <>Search results for &ldquo;<span className="text-primary-600">{searchQuery}</span>&rdquo;</>
            ) : (
              'Search Products'
            )}
          </h1>
          {searchQuery && !isLoading && (
            <p className="text-gray-500 mt-1">
              {pagination?.totalProducts || 0} {pagination?.totalProducts === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Product Type</h4>
                    <div className="space-y-2">
                      {productTypes.map(pt => (
                        <label key={pt.value} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(pt.value)}
                            onChange={() => toggleProductType(pt.value)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{pt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h4>
                    <div className="space-y-1">
                      {priceRanges.map(pr => (
                        <button
                          key={pr.label}
                          onClick={() => {
                            setSelectedPrice(selectedPrice?.min === pr.min && selectedPrice?.max === pr.max ? null : pr);
                            setLocalPage(1);
                          }}
                          className={classNames(
                            'block w-full text-left px-3 py-1.5 text-sm rounded transition-colors',
                            selectedPrice?.min === pr.min && selectedPrice?.max === pr.max
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          {pr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Rating</h4>
                    <div className="space-y-1">
                      {ratingOptions.map(r => (
                        <button
                          key={r.value}
                          onClick={() => {
                            setSelectedRating(selectedRating === String(r.value) ? '' : String(r.value));
                            setLocalPage(1);
                          }}
                          className={classNames(
                            'block w-full text-left px-3 py-1.5 text-sm rounded transition-colors',
                            selectedRating === String(r.value)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {Array.from({ length: r.value }).map((_, i) => (
                              <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            & Up
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Category</h4>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setLocalPage(1);
                      }}
                      className="input-field text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" fullWidth onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </Button>
                {!isLoading && pagination?.totalProducts > 0 && (
                  <span className="text-sm text-gray-500">
                    Showing {((localPage - 1) * (pagination.limit || 12)) + 1}-{Math.min(localPage * (pagination.limit || 12), pagination.totalProducts)} of {pagination.totalProducts}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 hidden sm:inline">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setLocalPage(1); }}
                  className="input-field text-sm w-44"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {showMobileFilters && (
              <Card className="mb-6 lg:hidden">
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Product Type</h4>
                      <div className="space-y-1">
                        {productTypes.map(pt => (
                          <label key={pt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(pt.value)}
                              onChange={() => toggleProductType(pt.value)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600"
                            />
                            {pt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Price Range</h4>
                      <div className="space-y-1">
                        {priceRanges.map(pr => (
                          <button
                            key={pr.label}
                            onClick={() => {
                              setSelectedPrice(selectedPrice?.min === pr.min && selectedPrice?.max === pr.max ? null : pr);
                              setLocalPage(1);
                            }}
                            className={classNames(
                              'block w-full text-left px-2 py-1 text-sm rounded',
                              selectedPrice?.min === pr.min && selectedPrice?.max === pr.max
                                ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                            )}
                          >
                            {pr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Rating</h4>
                      <div className="space-y-1">
                        {ratingOptions.map(r => (
                          <button
                            key={r.value}
                            onClick={() => {
                              setSelectedRating(selectedRating === String(r.value) ? '' : String(r.value));
                              setLocalPage(1);
                            }}
                            className={classNames(
                              'block w-full text-left px-2 py-1 text-sm rounded',
                              selectedRating === String(r.value) ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                            )}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Category</h4>
                      <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setLocalPage(1); }}
                        className="input-field text-sm w-full"
                      >
                        <option value="">All</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" fullWidth className="mt-4" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </CardBody>
              </Card>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchQuery ? (
                    <>No results found for &ldquo;<span className="text-gray-700">{searchQuery}</span>&rdquo;</>
                  ) : (
                    'No products found'
                  )}
                </h3>
                <p className="text-gray-500 mb-2">Try different keywords or adjust your filters</p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-2" onClick={clearFilters}>Clear Filters</Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => <ProductCard key={product._id} product={product} />)}
                </div>

                <Pagination
                  currentPage={localPage}
                  totalPages={pagination?.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
