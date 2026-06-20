import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

const policies = [
  {
    title: 'Physical Products',
    items: [
      'Returns accepted within 7 days of delivery',
      'Product must be unused and in original packaging',
      'Free pickup arranged for defective/damaged items',
      'Refund processed within 5-7 business days after pickup',
      'Return shipping free for defects, ₹49 deducted for change of mind',
    ],
  },
  {
    title: 'Digital Products',
    items: [
      'Digital products are non-refundable once downloaded/accessed',
      'Refund possible only if the product is defective or not as described',
      'Report issues within 48 hours of purchase',
      'Refund processed after verification by our team',
      'Some courses offer 7-day money-back guarantee (check product page)',
    ],
  },
  {
    title: 'Subscription Plans',
    items: [
      'Cancel anytime — access continues until billing period ends',
      'No prorated refunds for partial months',
      '7-day free trial available on Pro plan',
      'Premium plan has 30-day money-back guarantee',
      'Contact support for billing issues',
    ],
  },
];

const steps = [
  { step: 1, title: 'Submit Request', desc: 'Go to your order and click "Request Return"' },
  { step: 2, title: 'Get Approved', desc: 'Our team reviews your request within 24 hours' },
  { step: 3, title: 'Return Product', desc: 'For physical items, we arrange pickup' },
  { step: 4, title: 'Get Refunded', desc: 'Refund is processed to your original payment method' },
];

export default function ReturnsRefunds() {
  return (
    <>
      <Helmet><title>Returns & Refunds | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-lg text-gray-600">Our commitment to your satisfaction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {policies.map(p => (
            <Card key={p.title}>
              <CardHeader><h2 className="text-lg font-semibold">{p.title}</h2></CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {steps.map(s => (
            <Card key={s.step} className="text-center">
              <CardBody>
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold mx-auto mb-3">{s.step}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
