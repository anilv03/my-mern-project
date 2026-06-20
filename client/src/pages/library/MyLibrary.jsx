import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchLibrary, downloadContent, buyAgain, fetchDownloadHistory, resetContentSuccess } from '../../store/slices/contentSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatPrice, getProductTypeLabel } from '../../lib/helpers';

export default function MyLibrary() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { library, libraryPagination, downloadHistory, isLoading, isSuccess, message } = useSelector(state => state.content);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchLibrary({ page, limit: 12 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (isSuccess) dispatch(resetContentSuccess());
  }, [isSuccess, dispatch]);

  const handleDownload = useCallback(async (productId) => {
    setDownloading(productId);
    try {
      const result = await dispatch(downloadContent(productId)).unwrap();
      if (result?.fileUrl) {
        const a = document.createElement('a');
        a.href = result.fileUrl;
        a.download = result.fileName || 'download';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
    } finally {
      setDownloading(null);
    }
  }, [dispatch]);

  const handleBuyAgain = useCallback(async (productId) => {
    try {
      await dispatch(buyAgain(productId)).unwrap();
      navigate('/cart');
    } catch {
    }
  }, [dispatch, navigate]);

  const handleShowHistory = useCallback(async (product) => {
    setSelectedProduct(product);
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const result = await dispatch(fetchDownloadHistory(product._id)).unwrap();
      setHistoryItems(result || []);
    } catch {
      setHistoryItems([]);
    }
    setHistoryLoading(false);
  }, [dispatch]);

  if (isLoading && library.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>My Library | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Library</h1>
          <p className="text-gray-500 mt-1">Your purchased ebooks and digital content.</p>
        </div>

        {library.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your library is empty</h3>
                <p className="text-gray-500 mb-6">Purchase ebooks and digital content to build your library.</p>
                <Link to="/products?type=ebook"><Button variant="primary">Browse eBooks</Button></Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.map((item) => (
                <Card key={item._id} className="hover:shadow-lg transition-shadow">
                  <CardBody>
                    <div className="w-full h-44 bg-gray-100 rounded-lg overflow-hidden mb-4">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="xs">{getProductTypeLabel(item.productType)}</Badge>
                      {item.downloadAllowed && <Badge variant="primary" size="xs">Downloadable</Badge>}
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 mb-4">
                      <p>File: {item.fileType?.toUpperCase() || 'N/A'}</p>
                      {item.fileSize && <p>Size: {(item.fileSize / 1024 / 1024).toFixed(1)} MB</p>}
                      {item.lastDownload && <p>Last download: {formatDate(item.lastDownload)}</p>}
                      <p>Downloads: {item.downloadCount}{item.downloadLimit > 0 ? ` / ${item.downloadLimit}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.downloadAllowed && (
                        <Button size="sm" onClick={() => handleDownload(item._id)} isLoading={downloading === item._id} disabled={downloading === item._id}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleShowHistory(item)}>
                        History
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBuyAgain(item._id)}>
                        Buy Again
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {libraryPagination?.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={libraryPagination.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showHistory} onClose={() => { setShowHistory(false); setHistoryItems([]); }} title={`Download History - ${selectedProduct?.title || ''}`} size="lg">
        {historyLoading ? (
          <div className="py-8 text-center text-gray-500">Loading history...</div>
        ) : historyItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No download history yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">File</th>
                  <th className="pb-2">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((h, idx) => (
                  <tr key={h._id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-500">{idx + 1}</td>
                    <td className="py-2 pr-4">{formatDate(h.createdAt)}</td>
                    <td className="py-2 pr-4">{h.fileName || 'N/A'}</td>
                    <td className="py-2 text-gray-500 text-xs">{h.ipAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => { setShowHistory(false); setHistoryItems([]); }}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
