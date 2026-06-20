import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchProducts, setFilters, setPage } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProductCard from '../../components/ui/ProductCard';
import Pagination from '../../components/ui/Pagination';
import { PageLoader, ProductCardSkeleton } from '../../components/ui/Loader';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'sales', label: 'Best Selling' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'name_desc', label: 'Name: Z-A' },
];

const productTypes = [
  { value: '', label: 'All Types' },
  { value: 'ebook', label: 'eBooks' },
  { value: 'audiobook', label: 'Audiobooks' },
  { value: 'video_course', label: 'Video Courses' },
  { value: 'software', label: 'Software' },
  { value: 'template', label: 'Templates' },
  { value: 'new_book', label: 'Books' },
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



export default function ProductListing() {
  const dispatch = useDispatch();
  const { products, isLoading, pagination, filters } = useSelector(state => state.products);
  const { categories } = useSelector(state => state.categories);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get('category') || filters.category || '',
    productType: searchParams.get('productType') || searchParams.get('type') || filters.productType || '',
    minPrice: searchParams.get('minPrice') || filters.minPrice || '',
    maxPrice: searchParams.get('maxPrice') || filters.maxPrice || '',
    rating: searchParams.get('rating') || filters.rating || '',
    sort: searchParams.get('sort') || filters.sortBy || 'newest',
    q: searchParams.get('q') || filters.search || '',
  });

  useEffect(() => {
    dispatch(fetchCategories({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    setLocalFilters(prev => {
      const fromRedux = {
        category: filters.category || searchParams.get('category') || '',
        productType: filters.productType || searchParams.get('productType') || searchParams.get('type') || '',
        minPrice: filters.minPrice || searchParams.get('minPrice') || '',
        maxPrice: filters.maxPrice || searchParams.get('maxPrice') || '',
        rating: filters.rating || searchParams.get('rating') || '',
        sort: filters.sortBy || searchParams.get('sort') || 'newest',
        q: filters.search || searchParams.get('q') || '',
      };
      if (JSON.stringify(prev) !== JSON.stringify(fromRedux)) return fromRedux;
      return prev;
    });
  }, [filters, searchParams]);

  useEffect(() => {
    const params = {};
    Object.entries(localFilters).forEach(([key, val]) => {
      if (val) params[key] = val;
    });
    params.page = pagination.page;
    dispatch(fetchProducts(params));
  }, [dispatch, localFilters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
    dispatch(setPage(1));
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    const reduxKey = key === 'sort' ? 'sortBy' : key === 'q' ? 'search' : key;
    dispatch(setFilters({ ...filters, [reduxKey]: value }));
  };

  const handlePriceRange = (min, max) => {
    setLocalFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
    dispatch(setPage(1));
  };

  const clearFilters = () => {
    setLocalFilters({
      category: '', productType: '', minPrice: '', maxPrice: '',
      rating: '', sort: 'newest', q: '',
    });
    dispatch(setPage(1));
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v && v !== 'newest');

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet><title>Products | Zalnio</title></Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 mt-1">Discover our collection of digital and physical products</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={localFilters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                className="input-field pl-10 pr-4 py-2 w-64"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={localFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <select
                  value={localFilters.productType}
                  onChange={(e) => handleFilterChange('productType', e.target.value)}
                  className="input-field"
                >
                  {productTypes.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="space-y-1">
                  {priceRanges.map(pr => (
                    <button
                      key={pr.label}
                      onClick={() => handlePriceRange(pr.min, pr.max)}
                      className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                        localFilters.minPrice === String(pr.min) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map(r => (
                    <button
                      key={r}
                      onClick={() => handleFilterChange('rating', localFilters.rating === String(r) ? '' : String(r))}
                      className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                        localFilters.rating === String(r) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {r}+ Stars & Up
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <select
                value={localFilters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input-field w-48"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>Clear All Filters</Button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search term</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => <ProductCard key={product._id} product={product} />)}
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
}
