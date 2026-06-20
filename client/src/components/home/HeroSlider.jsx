import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../../lib/helpers';

const HeroSlider = ({ slides = [] }) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((index) => {
    setCurrent(index);
    setAnimKey(prev => prev + 1);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
    setAnimKey(prev => prev + 1);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, next]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={classNames(
              'absolute inset-0 transition-opacity duration-700',
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            <div className="absolute inset-0 bg-gray-900">
              <img
                src={slide.image}
                alt={slide.title || ''}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(120,80,255,0.08),transparent_50%)]" />

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 w-full">
                <div className="max-w-xl">
                  {index === current && (
                    <div key={animKey} className="space-y-4 animate-fade-in-up">
                      {slide.subtitle && (
                        <p className="text-primary-300 font-medium text-sm md:text-base tracking-wide uppercase animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                          {slide.subtitle.length > 60 ? slide.subtitle.split('.')[0] + '.' : slide.subtitle.slice(0, 60)}
                        </p>
                      )}
                      {slide.title && (
                        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="text-sm sm:text-lg md:text-xl text-gray-200 max-w-lg leading-relaxed" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.ctaText && slide.ctaLink && (
                        <div style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                          <Link
                            to={slide.ctaLink}
                            className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all text-sm md:text-base shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 active:scale-95"
                          >
                            {slide.ctaText}
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 transition-all flex items-center justify-center text-white"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 transition-all flex items-center justify-center text-white"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={classNames(
                  'rounded-full transition-all duration-300',
                  index === current
                    ? 'bg-white w-8 h-2.5'
                    : 'bg-white/40 hover:bg-white/60 w-2.5 h-2.5'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
