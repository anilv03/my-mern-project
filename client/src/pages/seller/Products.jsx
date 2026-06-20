import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSellerProducts, deleteProduct, submitProductForReview } from '../../store/slices/sellerSlice';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';

const statusVariants = {
  draft: 'secondary',
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
  archived: 'secondary',
  out_of_stock: 'warning',
};

export default function SellerProducts() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, isLoading, pagination } = useSelector(state => state.seller);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSellerProducts({ page, status: statusFilter || undefined }));
  }, [dispatch, page, statusFilter]);

  const handleDelete = async () => {
    if (deleteModal) {
      await dispatch(deleteProduct(deleteModal));
      setDeleteModal(null);
    }
  };

  const handleSubmitForReview = (id) => {
    dispatch(submitProductForReview(id));
  };

  return (
    <>
      <Helmet><title>My Products | Seller | Zalnio</title></Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">My Products</h1>
            <p className="text-gray-500 mt-1">Manage your product listings</p>
          </div>
          <Link to="/seller/products/add">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Product
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'draft', 'pending', 'published', 'rejected', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status ? status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <Card className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first product</p>
            <Link to="/seller/products/add"><Button>Add Product</Button></Link>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {products.map(product => (
                <Card key={product._id} padding={false} hover={false}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/seller/products/edit/${product._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                            {product.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusVariants[product.status] || 'secondary'} size="xs">
                              {product.status?.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">{product.productType?.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">₹{product.pricing?.sellingPrice?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Stock: {product.inventory?.quantity ?? 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>Sales: {product.sales?.count || 0}</span>
                        <span>Views: {product.viewCount || 0}</span>
                        <span>Rating: {product.ratings?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {product.status === 'draft' && (
                        <Button size="sm" variant="primary" onClick={() => handleSubmitForReview(product._id)}>
                          Submit
                        </Button>
                      )}
                      <Link to={`/seller/products/edit/${product._id}`}>
                        <Button size="sm" variant="outline">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteModal(product._id)}>
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pagination?.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
                <Button variant="ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Product" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </>
  );
}
