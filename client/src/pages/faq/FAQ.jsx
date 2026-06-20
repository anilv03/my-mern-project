import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Card, { CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { APP_NAME } from '../../lib/constants';

const categories = [
  {
    name: 'Orders & Payments',
    questions: [
      { q: 'How do I place an order?', a: 'Simply browse products, add items to your cart, and proceed to checkout. You can pay via Razorpay, Stripe, or Cash on Delivery for eligible items.' },
      { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, Razorpay, and Stripe.' },
      { q: 'Can I use multiple coupons?', a: 'Only one coupon can be applied per order. However, you can combine it with wallet balance.' },
      { q: 'How do I track my order?', a: 'Go to My Orders in your dashboard. Each order has a tracking number and status updates.' },
    ],
  },
  {
    name: 'Digital Products',
    questions: [
      { q: 'How do I access my purchased eBooks?', a: 'Digital products are available instantly in your Library section after purchase. You can download or read online.' },
      { q: 'Can I download video courses?', a: 'Yes, video courses can be downloaded for offline viewing through our platform.' },
      { q: 'How many devices can I use?', a: 'You can access your purchases on up to 5 devices with the same account.' },
    ],
  },
  {
    name: 'Shipping & Delivery',
    questions: [
      { q: 'How long does shipping take?', a: 'Standard shipping takes 3-7 business days. Express shipping is available for 1-2 business days.' },
      { q: 'Do you ship internationally?', a: 'Currently we ship within India only. International shipping coming soon.' },
      { q: 'What is the shipping cost?', a: 'Shipping is free on orders above ₹499. Otherwise, a flat rate of ₹49 applies.' },
    ],
  },
  {
    name: 'Returns & Refunds',
    questions: [
      { q: 'What is your return policy?', a: 'Physical products can be returned within 7 days of delivery. Digital products are non-refundable once downloaded.' },
      { q: 'How do I request a refund?', a: 'Go to your order details and click "Request Return". Our team will review and process within 3-5 business days.' },
      { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days after approval. The amount is credited to your original payment method.' },
    ],
  },
  {
    name: 'Seller & Commission',
    questions: [
      { q: 'How do I become a seller?', a: 'Click "Become a Seller" in the footer, complete your registration and KYC, and start listing products.' },
      { q: 'What is the commission rate?', a: 'Commission rates vary by product category. Standard rate is 10%. Check your seller dashboard for details.' },
      { q: 'When do I get paid?', a: 'Payouts are processed on the 1st and 15th of every month for completed orders.' },
    ],
  },
  {
    name: 'Account & Security',
    questions: [
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.' },
      { q: 'How do I delete my account?', a: 'Go to Profile Settings and click "Delete Account". This action is irreversible.' },
      { q: 'Is my payment information secure?', a: 'Yes, all payments are processed through PCI-compliant gateways. We never store your card details.' },
    ],
  },
];

export default function FAQ() {
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const filtered = categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(search.toLowerCase()) ||
      q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  return (
    <>
      <Helmet><title>FAQ | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">Find answers to common questions</p>
        </div>

        <div className="max-w-lg mx-auto mb-10">
          <Input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="space-y-4">
          {filtered.map(cat => (
            <Card key={cat.name} padding={false}>
              <button onClick={() => setOpenCategory(openCategory === cat.name ? null : cat.name)}
                className="w-full flex items-center justify-between p-5 text-left">
                <h2 className="text-lg font-semibold text-gray-900">{cat.name}</h2>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${openCategory === cat.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openCategory === cat.name && (
                <div className="px-5 pb-5 space-y-2">
                  {cat.questions.map(qa => (
                    <div key={qa.q} className="border rounded-lg">
                      <button onClick={() => setOpenQuestion(openQuestion === qa.q ? null : qa.q)}
                        className="w-full flex items-center justify-between p-3 text-left">
                        <span className="text-sm font-medium text-gray-700">{qa.q}</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${openQuestion === qa.q ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openQuestion === qa.q && (
                        <p className="px-3 pb-3 text-sm text-gray-600">{qa.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
