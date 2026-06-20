import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchAudioBookDetail, updateAudioProgress, clearCurrentAudioBook } from '../../store/slices/contentSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate } from '../../lib/helpers';
import contentService from '../../services/contentService';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AudioBookPlayer() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { currentAudioBook: book, isLoading } = useSelector(state => state.content);
  const audioRef = useRef(null);
  const saveIntervalRef = useRef(null);

  const [signedUrl, setSignedUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchAudioBookDetail(productId));
    return () => {
      dispatch(clearCurrentAudioBook());
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [dispatch, productId]);

  const fetchSignedUrl = useCallback(async () => {
    setLoadingAudio(true);
    try {
      const result = await contentService.getSignedUrl(productId);
      setSignedUrl(result.signedToken);
    } catch {
      setSignedUrl(null);
    }
    setLoadingAudio(false);
  }, [productId]);

  useEffect(() => {
    if (book) {
      setPlaybackSpeed(book.playbackSpeed || 1);
      fetchSignedUrl();
    }
  }, [book, fetchSignedUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !signedUrl) return;

    const onLoaded = () => {
      setDuration(audio.duration);
      if (book?.currentPosition > 0 && book.currentPosition < audio.duration) {
        audio.currentTime = book.currentPosition;
      }
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      dispatch(updateAudioProgress({ productId, progressData: { currentPosition: 0, completed: true } }));
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [signedUrl, book, productId, dispatch]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (isPlaying) {
      saveIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          dispatch(updateAudioProgress({
            productId,
            progressData: {
              currentPosition: Math.floor(audioRef.current.currentTime),
              playbackSpeed,
              totalDuration: Math.floor(audioRef.current.duration || 0),
            },
          }));
        }
      }, 10000);
    }
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, productId, dispatch]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * (audio.duration || 0);
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading || !book) return <PageLoader />;

  const audioUrl = signedUrl ? `/api/v1/content/stream?token=${signedUrl}` : null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <Helmet><title>{book.title} | My Audio Books | Zalnio</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/my-audiobooks" className="hover:text-primary-600">My Audio Books</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{book.title}</span>
        </nav>

        <Card>
          <CardBody>
            <div className="text-center mb-8">
              <div className="w-40 h-40 mx-auto bg-gray-100 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                {book.thumbnail ? (
                  <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h1>
              <Badge variant="secondary" size="sm">Audio Book</Badge>
            </div>

            {audioUrl ? (
              <>
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                <div className="mb-6">
                  <div
                    className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative group"
                    onClick={handleSeek}
                  >
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-600 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 8px)` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {playbackSpeed}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white shadow-lg rounded-lg border py-1 min-w-[80px] z-10">
                        {SPEED_OPTIONS.map(speed => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`block w-full text-center px-4 py-1.5 text-sm hover:bg-gray-50 ${playbackSpeed === speed ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  >
                    {isPlaying ? (
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="w-16" />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                {loadingAudio ? (
                  <div className="text-gray-500">
                    <svg className="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading audio...
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p className="mb-2">Audio unavailable.</p>
                    <Button size="sm" onClick={fetchSignedUrl}>Retry</Button>
                  </div>
                )}
              </div>
            )}

            {book.lastListened && (
              <p className="text-center text-xs text-gray-400 mt-2">Last listened: {formatDate(book.lastListened)}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
