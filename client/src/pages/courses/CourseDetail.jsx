import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchCourseDetail, updateCourseProgress, clearCurrentCourse } from '../../store/slices/contentSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, classNames } from '../../lib/helpers';
import contentService from '../../services/contentService';

export default function CourseDetail() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { currentCourse: course, isLoading } = useSelector(state => state.content);
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [signedUrl, setSignedUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    dispatch(fetchCourseDetail(productId));
    return () => dispatch(clearCurrentCourse());
  }, [dispatch, productId]);

  useEffect(() => {
    if (course) {
      setCurrentVideoIndex(course.resumeIndex || 0);
    }
  }, [course]);

  const fetchSignedUrl = useCallback(async (index) => {
    setLoadingVideo(true);
    try {
      const result = await contentService.getSignedUrl(productId, index);
      setSignedUrl(result.signedToken);
    } catch {
      setSignedUrl(null);
    }
    setLoadingVideo(false);
  }, [productId]);

  useEffect(() => {
    if (course) {
      fetchSignedUrl(currentVideoIndex);
    }
  }, [currentVideoIndex, course, fetchSignedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !signedUrl) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [signedUrl]);

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          dispatch(updateCourseProgress({
            productId,
            progressData: { videoIndex: currentVideoIndex, position: Math.floor(videoRef.current.currentTime) },
          }));
        }
      }, 15000);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentVideoIndex, productId, dispatch]);

  const handleVideoEnd = useCallback(() => {
    dispatch(updateCourseProgress({
      productId,
      progressData: { videoIndex: currentVideoIndex, position: 0, completed: true },
    }));
  }, [productId, currentVideoIndex, dispatch]);

  const handleVideoSelect = useCallback((index) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setCurrentVideoIndex(index);
    setIsPlaying(false);
  }, []);

  const handleContinue = useCallback(() => {
    if (course && course.videos && course.videos.length > 0) {
      handleVideoSelect(course.resumeIndex || 0);
    }
  }, [course, handleVideoSelect]);

  if (isLoading || !course) return <PageLoader />;

  const currentVideo = course.videos?.[currentVideoIndex];
  const streamUrl = signedUrl ? `/api/v1/content/stream?token=${signedUrl}` : null;

  return (
    <>
      <Helmet><title>{course.title} | My Courses | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/my-courses" className="hover:text-primary-600">My Courses</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              {streamUrl ? (
                <video
                  ref={videoRef}
                  src={streamUrl}
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  className="w-full"
                  style={{ maxHeight: '500px', aspectRatio: '16/9' }}
                  poster={currentVideo?.thumbnail || undefined}
                  onEnded={handleVideoEnd}
                  onError={() => fetchSignedUrl(currentVideoIndex)}
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="flex items-center justify-center bg-gray-900 text-gray-400" style={{ aspectRatio: '16/9', maxHeight: '500px' }}>
                  {loadingVideo ? (
                    <div className="text-center">
                      <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Loading video...</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Video unavailable. <button onClick={() => fetchSignedUrl(currentVideoIndex)} className="text-primary-500 underline">Retry</button></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-2">
              <h2 className="text-xl font-bold text-gray-900">{currentVideo?.title || `Lesson ${currentVideoIndex + 1}`}</h2>
              {currentVideo?.duration && (
                <p className="text-sm text-gray-500">{Math.floor(currentVideo.duration / 60)}:{String(currentVideo.duration % 60).padStart(2, '0')}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <span>{course.completedVideosCount}/{course.totalVideos} completed</span>
              <span className="text-gray-300">|</span>
              <span>{course.progressPercent}% complete</span>
              {course.lastAccessed && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>Last accessed: {formatDate(course.lastAccessed)}</span>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">About this course</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600 whitespace-pre-line">{course.description}</p>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
                  <span className="text-xs text-gray-500">{course.completedVideosCount}/{course.totalVideos}</span>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {course.videos?.map((video, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVideoSelect(idx)}
                      className={classNames(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 flex items-start gap-3',
                        currentVideoIndex === idx ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                      )}
                    >
                      <div className={classNames(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5',
                        video.completed ? 'bg-green-100 text-green-700' :
                        currentVideoIndex === idx ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {video.completed ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={classNames(
                          'text-sm truncate',
                          currentVideoIndex === idx ? 'font-medium text-primary-700' : 'text-gray-700'
                        )}>
                          {video.title || `Lesson ${idx + 1}`}
                        </p>
                        {video.duration > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </button>
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
