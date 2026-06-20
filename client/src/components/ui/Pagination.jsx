import Button from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Button
        variant="ghost"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
        .map((p, i, arr) => (
          <span key={p}>
            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                p === currentPage ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          </span>
        ))}
      <Button
        variant="ghost"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
