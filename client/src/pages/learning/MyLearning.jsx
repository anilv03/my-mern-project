import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchMyProducts } from '../../store/slices/subscriptionSlice';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate } from '../../lib/helpers';

export default function MyLearning() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const activeProductId = searchParams.get('product');
  const { myProducts, isLoading } = useSelector(state => state.subscriptions);
  const { purchased, subscription } = myProducts;

  useEffect(() => {
    dispatch(fetchMyProducts());
  }, [dispatch]);

  if (isLoading) return <PageLoader />;

  const activeProduct = activeProductId
    ? purchased.find(p => p._id === activeProductId)
    : null;

  return (
    <>
      <Helmet><title>My Learning | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-500 mt-1">Access your purchased courses and content.</p>
        </div>

        {subscription && (
          <Card className="mb-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Active Subscription</p>
                  <p className="text-xl font-bold">{subscription.plan?.name || 'Premium'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Valid till</p>
                  <p className="font-semibold">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeProduct ? (
          <div>
            <Link to="/my-learning" className="text-sm text-primary-600 hover:underline mb-4 inline-block">&larr; Back to all courses</Link>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">{activeProduct.title}</h2>
              </CardHeader>
              <CardBody>
                {activeProduct.digitalFile?.courseVideos?.length > 0 ? (
                  <div className="space-y-4">
                    {activeProduct.digitalFile.courseVideos
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((video, idx) => (
                        <div key={video._id || idx}>
                          <p className="font-medium text-gray-700 mb-2">{video.title || `Lesson ${idx + 1}`}</p>
                          <video
                            src={video.url}
                            controls
                            controlsList="nodownload"
                            disablePictureInPicture
                            className="w-full rounded-lg bg-black"
                            poster={video.thumbnail || undefined}
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                      ))}
                  </div>
                ) : activeProduct.digitalFile?.fileUrl ? (
                  <div className="text-center py-12">
                    <a
                      href={activeProduct.digitalFile.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download {activeProduct.digitalFile?.fileType?.toUpperCase() || 'File'}
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-12">No digital content available for this product.</p>
                )}
              </CardBody>
            </Card>
          </div>
        ) : (
          <>
            {purchased.length === 0 && !subscription ? (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-500 mb-6">Purchase a course or subscribe to start learning.</p>
                    <Link to="/products" className="btn-primary">Browse Courses</Link>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchased.map(product => (
                  <Link key={product._id} to={`/my-learning?product=${product._id}`}>
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardBody>
                        {product.images?.[0]?.url && (
                          <img src={product.images[0].url} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />
                        )}
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" size="sm">{product.productType?.replace(/_/g, ' ')}</Badge>
                          {product.digitalFile?.courseVideos?.length > 0 && (
                            <Badge variant="primary" size="sm">{product.digitalFile.courseVideos.length} lessons</Badge>
                          )}
                          {product.digitalFile?.fileUrl && !product.digitalFile?.courseVideos?.length && (
                            <Badge variant="primary" size="sm">Downloadable</Badge>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
