import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchPublishedBlogs, fetchBlogCategories } from '../../store/slices/blogSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, classNames } from '../../lib/helpers';

export default function Blog() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { blogs, categories, isLoading, pagination } = useSelector(state => state.blog);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = { page, limit: 9 };
    if (selectedCategory) params.category = selectedCategory;
    if (searchTerm) params.q = searchTerm;
    dispatch(fetchPublishedBlogs(params));
  }, [dispatch, selectedCategory, searchTerm, page]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (cat) params.set('category', cat);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>Blog | Zalnio</title>
        <meta name="description" content="Read the latest articles, tips, and insights from Zalnio." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Blog</h1>
            <p className="text-gray-500 mt-1">Articles, tips, and insights</p>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-4 py-2 w-64"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>

        {categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleCategoryChange('')}
              className={classNames(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id || cat}
                onClick={() => handleCategoryChange(cat._id || cat)}
                className={classNames(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === (cat._id || cat) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat.name || cat}
              </button>
            ))}
          </div>
        )}

        {isLoading && blogs.length === 0 ? (
          <PageLoader />
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
            <p className="text-gray-500">Check back later for new articles</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(post => {
                const blog = post.blog || post;
                const slug = blog.slug || post.slug;
                const title = blog.title || post.title;
                const excerpt = blog.excerpt || post.excerpt || (blog.content?.slice(0, 200)) || '';
                const image = blog.coverImage?.url || blog.image?.url || post.coverImage?.url || '';
                const author = blog.author || post.author || {};
                const authorName = typeof author === 'object' ? author.name : author;
                const category = blog.category || post.category || '';
                const categoryName = typeof category === 'object' ? category.name : category;
                const createdAt = blog.createdAt || post.createdAt || post.publishedAt;

                return (
                  <Link key={blog._id || post._id} to={`/blog/${slug}`}>
                    <Card className="h-full group overflow-hidden">
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {image ? (
                          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          {categoryName && <Badge variant="primary" size="xs">{categoryName}</Badge>}
                          {createdAt && <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                          {title}
                        </h3>
                        {excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-3">{excerpt.replace(/<[^>]*>/g, '')}</p>
                        )}
                        {authorName && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-600">{authorName?.[0]}</span>
                            </div>
                            <span className="text-xs text-gray-500">{authorName}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <Pagination
              currentPage={page}
              totalPages={pagination?.totalPages || pagination?.pages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </>
        )}
      </div>
    </>
  );
}
