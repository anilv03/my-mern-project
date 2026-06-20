import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchAudioBooks } from '../../store/slices/contentSlice';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, classNames } from '../../lib/helpers';

export default function MyAudioBooks() {
  const dispatch = useDispatch();
  const { audioBooks, isLoading } = useSelector(state => state.content);

  useEffect(() => {
    dispatch(fetchAudioBooks());
  }, [dispatch]);

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatPosition = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading && audioBooks.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>My Audio Books | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Audio Books</h1>
          <p className="text-gray-500 mt-1">Listen to your audiobooks anytime.</p>
        </div>

        {audioBooks.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No audio books yet</h3>
                <p className="text-gray-500 mb-6">Purchase audiobooks to listen here.</p>
                <Link to="/products?type=audiobook"><Button variant="primary">Browse Audio Books</Button></Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audioBooks.map(book => (
              <Link key={book._id} to={`/my-audiobooks/${book._id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardBody>
                    <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                      {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{book.title}</h3>
                    <Badge variant="secondary" size="xs" className="mb-3">Audio Book</Badge>

                    <div className="space-y-1 text-xs text-gray-500 mb-3">
                      <p>Duration: {formatDuration(book.duration)}</p>
                      {book.completed ? (
                        <span className="text-green-600 font-medium">Completed</span>
                      ) : book.currentPosition > 0 ? (
                        <p>Position: {formatPosition(book.currentPosition)}</p>
                      ) : null}
                    </div>

                    {!book.completed && book.currentPosition > 0 && (
                      <div className="mb-2">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${Math.min(100, (book.currentPosition / (book.totalDuration || book.duration)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {book.lastListened && (
                      <p className="text-xs text-gray-400">Last listened: {formatDate(book.lastListened)}</p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
