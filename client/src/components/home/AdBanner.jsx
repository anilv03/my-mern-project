import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const defaultAds = [
  {
    id: 1,
    bg: 'from-amber-500 via-orange-500 to-red-500',
    badge: 'Limited Time',
    title: 'Flat 50% Off on eBooks',
    description: 'Grab your favorite eBooks at half price. Offer valid for this week only!',
    cta: 'Shop eBooks',
    link: '/products?type=ebook',
    icon: (
      <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 2,
    bg: 'from-emerald-500 via-teal-500 to-cyan-500',
    badge: 'Special Offer',
    title: 'Premium Courses at ₹299',
    description: 'Upskill with top-rated courses. Start learning from industry experts today!',
    cta: 'Browse Courses',
    link: '/products?type=video_course',
    icon: (
      <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 3,
    bg: 'from-violet-600 via-purple-500 to-fuchsia-500',
    badge: 'Bundle Deal',
    title: 'Buy 2 Get 1 Free',
    description: 'Mix & match any digital products. Add 3 items to cart and pay only for 2!',
    cta: 'Explore Deals',
    link: '/products',
    icon: (
      <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 4,
    bg: 'from-rose-600 via-pink-500 to-rose-400',
    badge: 'New Launch',
    title: 'Audiobooks — Listen & Learn',
    description: 'Discover our new audiobook collection. Perfect for learning on the go!',
    cta: 'Listen Now',
    link: '/products?type=audiobook',
    icon: (
      <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
];

const AdBanner = ({ ads = defaultAds, autoPlayInterval = 5000 }) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (isPaused || ads.length <= 1) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, autoPlayInterval, next, ads.length]);

  const ad = ads[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`relative bg-gradient-to-r ${ad.bg}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full tracking-wide">
                  {ad.badge}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                {ad.title}
              </h3>
              <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto md:mx-0">
                {ad.description}
              </p>
              <div className="mt-5">
                <Link
                  to={ad.link}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                  {ad.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 hidden md:block">
              {ad.icon}
            </div>
          </div>
        </div>
      </div>

      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all rounded-full ${
                i === current
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdBanner;
