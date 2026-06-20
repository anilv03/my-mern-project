import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchOrderById, clearCurrentOrder } from '../../store/slices/orderSlice';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice } from '../../lib/helpers';
import { DIGITAL_PRODUCTS } from '../../lib/constants';

export default function OrderSuccess() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, isLoading } = useSelector(state => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, id]);

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <PageLoader message="Loading order details..." />
      </div>
    );
  }

  const digitalItems = order.items?.filter(item => {
    const product = item.product || {};
    return DIGITAL_PRODUCTS.includes(product.productType);
  }) || [];

  return (
    <>
      <Helmet><title>Order Placed Successfully | Zalnio</title></Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-500 mb-2">Thank you for your purchase</p>

          <div className="inline-block bg-gray-50 rounded-lg px-6 py-3 mt-4">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-xl font-bold text-gray-900">#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</p>
          </div>

          {digitalItems.length > 0 && (
            <div className="mt-8 text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Digital Products</h3>
              <div className="space-y-3">
                {digitalItems.map((item, idx) => {
                  const product = item.product || {};
                  const title = item.title || product.title || '';
                  const fileUrl = product.digitalFile?.fileUrl;
                  const courseVideos = product.digitalFile?.courseVideos;
                  const fileType = product.digitalFile?.fileType || '';

                  return (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                        <p className="text-xs text-gray-500 capitalize">{product.productType?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {courseVideos?.length > 0 ? (
                          <Link to={`/my-learning?product=${product._id || item.product}`}>
                            <Button size="sm">Watch Now</Button>
                          </Link>
                        ) : fileUrl ? (
                          <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                            <Button size="sm">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </Button>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t mt-8 pt-6 text-sm text-gray-600 space-y-2">
            <p>We've sent a confirmation to your email.</p>
            <p>Total charged: <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span></p>
            <p>Payment: <span className="font-semibold text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</span></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {digitalItems.length > 0 && (
              <Link to="/my-learning">
                <Button variant="primary" size="lg">Go to My Learning</Button>
              </Link>
            )}
            <Link to={`/orders/${order._id}`}>
              <Button variant={digitalItems.length > 0 ? 'outline' : 'primary'} size="lg">View Order Details</Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
