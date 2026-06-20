import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { APP_NAME } from '../../lib/constants';

const topics = [
  { icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', title: 'Orders', desc: 'Track orders, cancel, manage returns', link: '/faq' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Payments', desc: 'Payment methods, refunds, wallet', link: '/faq' },
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Digital Products', desc: 'Downloads, access, licenses', link: '/faq' },
  { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', title: 'Search & Browse', desc: 'Find products, filters, categories', link: '/faq' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: 'Account', desc: 'Profile, security, settings', link: '/faq' },
  { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', title: 'Sellers', desc: 'Registration, products, payouts', link: '/faq' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Trust & Safety', desc: 'Privacy, security, policies', link: '/privacy' },
  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', title: 'Contact Support', desc: 'Get help from our team', link: '/contact' },
];

const quickLinks = [
  { label: 'Track My Order', link: '/orders' },
  { label: 'Shipping Information', link: '/shipping' },
  { label: 'Returns & Refunds', link: '/returns' },
  { label: 'Report a Problem', link: '/contact' },
  { label: 'Delete My Account', link: '/profile' },
];

export default function HelpCenter() {
  const [search, setSearch] = useState('');

  return (
    <>
      <Helmet><title>Help Center | {APP_NAME}</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600 mb-6">How can we help you today?</p>
          <div className="max-w-lg mx-auto">
            <Input placeholder="Search for help topics..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map(link => (
            <Link key={link.label} to={link.link}>
              <Card className="text-center py-4">
                <span className="text-sm font-medium text-primary-600 hover:underline">{link.label}</span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map(topic => (
            <Link key={topic.title} to={topic.link}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={topic.icon} />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{topic.title}</h3>
                  <p className="text-sm text-gray-500">{topic.desc}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
