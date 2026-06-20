import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {isLast ? (
              <span className="text-gray-900 truncate max-w-[200px]">{item.label}</span>
            ) : item.to ? (
              <Link to={item.to} className="hover:text-primary-600">{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
