import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Button from '../../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 - Page Not Found | Zalnio</title></Helmet>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-9xl font-display font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link to="/">
            <Button variant="primary" size="lg">Go Home</Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="lg">Browse Products</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
