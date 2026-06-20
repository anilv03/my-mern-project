import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchProducts } from '../../store/slices/productSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProductCard from '../../components/ui/ProductCard';
import Pagination from '../../components/ui/Pagination';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageLoader } from '../../components/ui/Loader';

export default function Categories() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, isLoading: catLoading } = useSelector(state => state.categories);
  const { products, isLoading: prodLoading, pagination } = useSelector(state => state.products);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(1);
  const selectedCatData = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory);

  useEffect(() => {
    dispatch(fetchCategories({ isActive: true }));
  }, [dispatch]);

  useEffect(() => {
    const params = { page, limit: 12 };
    if (selectedCategory) params.category = selectedCategory;
    dispatch(fetchProducts(params));
  }, [dispatch, selectedCategory, page]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (catId) params.set('category', catId);
    else params.delete('category');
    setSearchParams(params);
  };

  const isLoading = catLoading || prodLoading;

  return (
    <>
      <Helmet>
        <title>{selectedCatData ? `${selectedCatData.name} | Categories | Zalnio` : 'Categories | Zalnio'}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: selectedCatData?.name || 'Categories' },
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {selectedCatData ? selectedCatData.name : 'All Categories'}
          </h1>
          {selectedCatData?.description && (
            <p className="text-gray-500 mt-1">{selectedCatData.description}</p>
          )}
        </div>

        {isLoading && categories.length === 0 ? (
          <PageLoader />
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 mb-12 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => handleCategorySelect('')}
                className={`flex-shrink-0 p-4 rounded-xl border text-center transition-all ${
                  !selectedCategory ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">All</span>
              </button>
              {categories.map(cat => {
                const avatarUrl = `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(cat.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                return (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat._id)}
                  className={`flex-shrink-0 p-4 rounded-xl border text-center transition-all ${
                    selectedCategory === cat._id ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full overflow-hidden bg-primary-100">
                    <img
                      src={cat.icon || cat.image?.url || avatarUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { if (e.target.src !== avatarUrl) e.target.src = avatarUrl; }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </button>
                );
              })}
            </div>

            {selectedCatData?.children?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Subcategories</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCatData.children.map(child => (
                    <button
                      key={child._id}
                      onClick={() => handleCategorySelect(child._id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              {!isLoading && products.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No products found in this category</h3>
                  <p className="text-gray-500">Try browsing other categories</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      {pagination?.total > 0 && `Showing ${((page - 1) * (pagination.limit || 12)) + 1}-${Math.min(page * (pagination.limit || 12), pagination.total)} of ${pagination.total} products`}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
