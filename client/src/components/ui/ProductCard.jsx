import { Link } from 'react-router-dom';
import Card from './Card';
import Badge from './Badge';
import { formatPrice, formatDiscount } from '../../lib/helpers';

const ProductCard = ({ product }) => {
  const discount = formatDiscount(product.pricing?.originalPrice, product.pricing?.sellingPrice);

  return (
    <Link to={`/products/${product.slug}`}>
      <Card className="h-full group">
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {discount > 0 && (
            <Badge variant="danger" className="absolute top-2 left-2">{discount}% OFF</Badge>
          )}
          {product.settings?.isNewArrival && (
            <Badge variant="success" className="absolute top-2 right-2">New</Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="xs">{product.productType?.replace('_', ' ')}</Badge>
            {product.settings?.isFeatured && <Badge variant="accent" size="xs">Featured</Badge>}
          </div>

          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.title}
          </h3>

          {product.seller?.name && (
            <p className="text-xs text-gray-500">by {product.seller.name}</p>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600 ml-1">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
              <span className="text-xs text-gray-400 ml-1">({product.ratings?.count || 0})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{formatPrice(product.pricing?.sellingPrice)}</span>
            {product.pricing?.originalPrice > product.pricing?.sellingPrice && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.pricing?.originalPrice)}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
