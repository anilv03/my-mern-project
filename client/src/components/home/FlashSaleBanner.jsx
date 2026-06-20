import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../../lib/helpers';
import Button from '../ui/Button';

const CountdownTimer = ({ endTime }) => {
  const calcRemaining = () => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      ended: false,
    };
  };

  const [time, setTime] = useState(calcRemaining);

  useEffect(() => {
    setTime(calcRemaining());
    const timer = setInterval(() => setTime(calcRemaining()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);

  if (time.ended) {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-red-400 font-bold text-lg">Sale Ended</span>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Min', value: time.minutes },
    { label: 'Sec', value: time.seconds },
  ];

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 min-w-[48px] md:min-w-[56px]">
            <span className="text-xl md:text-2xl font-bold text-white tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-white/70 mt-1">{unit.label}</p>
        </div>
      ))}
    </div>
  );
};

const FlashSaleBanner = ({ sale = null }) => {
  if (!sale) return null;

  const soldPercentage = sale.totalQuantity && sale.soldQuantity
    ? Math.min(Math.round((sale.soldQuantity / sale.totalQuantity) * 100), 100)
    : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {sale.banner && (
            <div className="flex-shrink-0 w-full md:w-48 lg:w-56">
              <img
                src={sale.banner}
                alt={sale.title}
                className="w-full h-40 md:h-36 object-cover rounded-xl"
              />
            </div>
          )}

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-white mb-1">
              {sale.title || 'Flash Sale'}
            </h3>
            <p className="text-white/80 text-sm md:text-base mb-4">
              Limited time offer — grab the best deals before they're gone!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <CountdownTimer endTime={sale.endTime} />

              <Link to={`/flash-sales/${sale.slug || sale._id}`}>
                <Button variant="primary" size="lg" className="bg-white !text-red-600 hover:!bg-gray-100 whitespace-nowrap">
                  Shop Now
                </Button>
              </Link>
            </div>

            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-white/80 text-xs mb-1">
                <span>{sale.soldQuantity || 0} sold</span>
                <span>{sale.totalQuantity || 0} available</span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {sale.products?.length > 0 && (
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {sale.products.slice(0, 4).map((product, i) => (
                <div key={product._id || i} className="w-16 h-16 rounded-lg overflow-hidden bg-white/20 ring-2 ring-white/40">
                  <img
                    src={product.images?.[0]?.url || '/placeholder.png'}
                    alt={product.title || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FlashSaleBanner;
