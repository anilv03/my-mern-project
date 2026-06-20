import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

const methods = [
  { name: 'Standard Shipping', cost: '₹49', free: 'On orders above ₹499', time: '3-7 business days', tracking: true },
  { name: 'Express Shipping', cost: '₹149', free: 'Not available', time: '1-2 business days', tracking: true },
  { name: 'Digital Delivery', cost: 'Free', free: 'Always free', time: 'Instant', tracking: false },
];

const faqs = [
  { q: 'How are shipping costs calculated?', a: 'Shipping costs are calculated based on the weight, dimensions, and destination of your order. You can see the exact shipping cost at checkout before making payment.' },
  { q: 'Do you ship internationally?', a: 'Currently, we only ship within India. We are working on expanding to international destinations and will announce when available.' },
  { q: 'How can I track my order?', a: 'Once your order is shipped, you will receive a tracking number via email. You can also track it from your Orders page in your account dashboard.' },
  { q: 'What if my package is lost or damaged?', a: 'If your package is lost or damaged during transit, please contact our support team within 48 hours of the expected delivery date. We will initiate an investigation and provide a resolution.' },
  { q: 'Can I change my shipping address after placing an order?', a: 'You can change the shipping address only if the order has not been shipped yet. Contact our support team immediately for address changes.' },
  { q: 'What happens if I miss my delivery?', a: 'If you miss a delivery, the courier partner will attempt delivery again. After multiple failed attempts, the package may be returned to us.' },
];

export default function ShippingInfo() {
  return (
    <>
      <Helmet><title>Shipping Information | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-lg text-gray-600">Learn about our shipping policies and delivery options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {methods.map(m => (
            <Card key={m.name}>
              <CardHeader><h3 className="font-semibold text-lg">{m.name}</h3></CardHeader>
              <CardBody>
                <p className="text-2xl font-bold text-primary-600 mb-2">{m.cost}</p>
                <p className="text-sm text-gray-500 mb-3">{m.free}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium">{m.time}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tracking</span><span className="font-medium">{m.tracking ? 'Available' : 'N/A'}</span></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map(faq => (
            <Card key={faq.q}>
              <CardBody>
                <h3 className="font-medium text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
