import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, getInitials, classNames } from '../../lib/helpers';

const MOCK_SELLER = {
  _id: '1',
  storeName: 'EduPro Learning',
  storeSlug: 'edupro-learning',
  storeDescription: 'Premium educational content creators specializing in STEM courses, programming tutorials, and academic resources. With over 10 years of experience in education, we bring you the best learning materials.',
  storeLogo: null,
  storeBanner: null,
  rating: 4.5,
  totalProducts: 24,
  totalOrders: 1500,
  totalStudents: 8500,
  memberSince: '2024-03-15',
  isVerified: true,
  socialLinks: { youtube: '#', instagram: '#', facebook: '#' },
};

const MOCK_PRODUCTS = [
  { _id: '1', title: 'Complete Python Bootcamp', slug: 'python-bootcamp', pricing: { sellingPrice: 499, originalPrice: 1999 }, images: [], rating: 4.8, sales: 1200, productType: 'video_course' },
  { _id: '2', title: 'Data Structures & Algorithms', slug: 'dsa-course', pricing: { sellingPrice: 799, originalPrice: 2499 }, images: [], rating: 4.6, sales: 850, productType: 'video_course' },
  { _id: '3', title: 'JavaScript: The Complete Guide', slug: 'javascript-guide', pricing: { sellingPrice: 399, originalPrice: 1499 }, images: [], rating: 4.7, sales: 2100, productType: 'ebook' },
  { _id: '4', title: 'Machine Learning A-Z', slug: 'ml-course', pricing: { sellingPrice: 1299, originalPrice: 4999 }, images: [], rating: 4.9, sales: 650, productType: 'video_course' },
  { _id: '5', title: 'React for Beginners', slug: 'react-beginners', pricing: { sellingPrice: 349, originalPrice: 999 }, images: [], rating: 4.5, sales: 1800, productType: 'ebook' },
  { _id: '6', title: 'Advanced Mathematics', slug: 'advanced-maths', pricing: { sellingPrice: 599, originalPrice: 1499 }, images: [], rating: 4.4, sales: 420, productType: 'new_book' },
];

const ratingBars = [
  { stars: 5, percent: 70 },
  { stars: 4, percent: 20 },
  { stars: 3, percent: 7 },
  { stars: 2, percent: 2 },
  { stars: 1, percent: 1 },
];

export default function SellerPublic() {
  const { slug } = useParams();
  const [seller] = useState(MOCK_SELLER);
  const [products] = useState(MOCK_PRODUCTS);
  const [sortBy, setSortBy] = useState('popular');

  if (!seller) return <PageLoader />;

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'popular') return b.sales - a.sales;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_low') return a.pricing.sellingPrice - b.pricing.sellingPrice;
    if (sortBy === 'price_high') return b.pricing.sellingPrice - a.pricing.sellingPrice;
    return 0;
  });

  return (
    <>
      <Helmet><title>{seller.storeName} | Zalnio</title></Helmet>

      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
              {getInitials(seller.storeName)}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-display font-bold">{seller.storeName}</h1>
                {seller.isVerified && (
                  <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <p className="text-white/80 mt-1">{seller.storeDescription?.slice(0, 150)}...</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                <span>⭐ {seller.rating}</span>
                <span>{seller.totalProducts} Products</span>
                <span>{seller.totalStudents} Students</span>
                <span>Joined {new Date(seller.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900">Products ({products.length})</h2>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field text-sm">
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProducts.map(p => (
                <Link key={p._id} to={`/products/${p.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">{p.title}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900">{formatPrice(p.pricing.sellingPrice)}</span>
                        {p.pricing.originalPrice > p.pricing.sellingPrice && (
                          <span className="text-xs text-gray-400 line-through ml-2">{formatPrice(p.pricing.originalPrice)}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">⭐ {p.rating} ({p.sales})</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><h3 className="font-semibold">About the Seller</h3></CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600">{seller.storeDescription}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Products</span><span className="font-medium">{seller.totalProducts}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Orders</span><span className="font-medium">{seller.totalOrders}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Students</span><span className="font-medium">{seller.totalStudents}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-medium">⭐ {seller.rating}</span></div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="font-semibold">Rating Breakdown</h3></CardHeader>
              <CardBody>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">{seller.rating}</span>
                  <span className="text-gray-400">/5</span>
                </div>
                <div className="space-y-2">
                  {ratingBars.map(r => (
                    <div key={r.stars} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-6">{r.stars}★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${r.percent}%` }} />
                      </div>
                      <span className="text-gray-400 text-xs w-8 text-right">{r.percent}%</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="font-semibold">Connect</h3></CardHeader>
              <CardBody>
                <div className="flex gap-3">
                  {Object.entries(seller.socialLinks).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-100 hover:text-primary-600 transition-colors">
                      <span className="text-xs font-medium capitalize">{platform[0]}</span>
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
