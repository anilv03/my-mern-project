import { classNames } from '../../lib/helpers';

const Card = ({ children, className = '', padding = true, hover = true, onClick }) => {
  return (
    <div
      className={classNames(
        'bg-white rounded-xl border border-gray-100',
        hover && 'hover:shadow-md transition-shadow duration-200',
        padding && 'p-6',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={classNames('border-b border-gray-100 pb-4 mb-4', className)}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={classNames(className)}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={classNames('border-t border-gray-100 pt-4 mt-4', className)}>{children}</div>
);

export default Card;
