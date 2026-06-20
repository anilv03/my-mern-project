import { Link } from 'react-router-dom';
import { APP_NAME } from '../../lib/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Shop': [
      { label: 'eBooks', path: '/products?type=ebook' },
      { label: 'Audiobooks', path: '/products?type=audiobook' },
      { label: 'Video Courses', path: '/products?type=video_course' },
      { label: 'New Books', path: '/products?type=new_book' },
      { label: 'Used Books', path: '/products?type=used_book' },
      { label: 'Subscriptions', path: '/subscriptions' },
    ],
    'Support': [
      { label: 'Help Center', path: '/help' },
      { label: 'Returns Policy', path: '/returns' },
      { label: 'Shipping Info', path: '/shipping' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'FAQ', path: '/faq' },
    ],
    'Company': [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Affiliates', path: '/affiliates' },
      { label: 'Become a Seller', path: '/seller/register' },
    ],
    'Legal': [
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Refund Policy', path: '/refund' },
      { label: 'Cookie Policy', path: '/cookies' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="text-2xl font-display font-bold text-white">
              {APP_NAME}
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              India's premier multi-vendor education marketplace. Learn, teach, and grow with thousands of digital and physical educational resources.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {currentYear} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Payment partners: Razorpay, Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
