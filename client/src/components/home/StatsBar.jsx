import { useState, useEffect, useRef, useCallback } from 'react';
import { classNames } from '../../lib/helpers';
import { Skeleton } from '../ui/Loader';

const useCountUp = (end, duration = 2000, startCounting) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) return;
    let startTime = null;
    let animationId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [end, duration, startCounting]);

  return count;
};

const StatItem = ({ stat, isVisible }) => {
  const count = useCountUp(stat.value, 2000, isVisible);

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {stat.icon && (
        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
          <span className="text-xl md:text-2xl">{stat.icon}</span>
        </div>
      )}
      <div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">
          {count.toLocaleString('en-IN')}+
        </p>
        <p className="text-xs md:text-sm text-gray-500">{stat.label}</p>
      </div>
    </div>
  );
};

const StatSkeleton = () => (
  <div className="flex items-center gap-3 md:gap-4">
    <Skeleton variant="avatar" className="!w-10 !h-10 md:!w-12 md:!h-12" />
    <div className="space-y-1">
      <Skeleton variant="title" className="!h-6 w-20" />
      <Skeleton variant="text" className="w-16" />
    </div>
  </div>
);

const StatsBar = ({ stats = [], loading = false }) => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  if (!stats.length) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
    >
      {stats.map((stat, index) => (
        <div key={index}>
          <StatItem stat={stat} isVisible={isVisible} />
          {index < stats.length - 1 && (
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
