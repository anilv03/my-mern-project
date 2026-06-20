import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatPrice } from '../../lib/helpers';
import { APP_NAME } from '../../lib/constants';

const tiers = [
  { level: 1, commission: '5%', req: '0-10 sales/mo', color: 'gray' },
  { level: 2, commission: '7%', req: '11-50 sales/mo', color: 'primary' },
  { level: 3, commission: '10%', req: '51+ sales/mo', color: 'purple' },
];

const howItWorks = [
  { step: 1, title: 'Sign Up', desc: 'Create your affiliate account in minutes' },
  { step: 2, title: 'Share Links', desc: 'Share your unique affiliate links on social media, blogs, or YouTube' },
  { step: 3, title: 'Earn Commission', desc: 'Earn up to 10% commission on every sale through your links' },
  { step: 4, title: 'Get Paid', desc: 'Withdraw your earnings via bank transfer or UPI' },
];

export default function Affiliates() {
  return (
    <>
      <Helmet><title>Affiliate Program | {APP_NAME}</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Affiliate Program</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Earn commission by promoting {APP_NAME} products. Join thousands of affiliates earning passive income.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {howItWorks.map(item => (
            <Card key={item.step} className="text-center">
              <CardBody>
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">{item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-6">Commission Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          {tiers.map(tier => (
            <Card key={tier.level} className={`text-center ${tier.color === 'primary' ? 'ring-2 ring-primary-500' : ''}`}>
              <CardBody>
                <p className="text-sm text-gray-500 mb-1">Level {tier.level}</p>
                <p className="text-3xl font-bold text-primary-600 mb-2">{tier.commission}</p>
                <p className="text-sm text-gray-500">{tier.req}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="max-w-lg mx-auto text-center">
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Start Earning?</h2>
            <p className="text-gray-500 mb-6">Join our affiliate program and start earning commission on every sale.</p>
            <Button size="lg" fullWidth>Apply Now</Button>
            <p className="text-xs text-gray-400 mt-3">Free to join. No minimum sales required.</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
