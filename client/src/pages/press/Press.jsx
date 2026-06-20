import { Helmet } from 'react-helmet-async';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../lib/helpers';
import { APP_NAME } from '../../lib/constants';

const releases = [
  { date: '2025-12-15', title: `${APP_NAME} Launches AI-Powered Course Recommendations`, category: 'Product Launch' },
  { date: '2025-10-01', title: `${APP_NAME} Crosses 50,000 Active Learners Milestone`, category: 'Milestone' },
  { date: '2025-08-20', title: `${APP_NAME} Partners with Top Indian Universities`, category: 'Partnership' },
  { date: '2025-06-10', title: `${APP_NAME} Introduces Creator Reward Program`, category: 'Feature' },
  { date: '2025-04-05', title: `${APP_NAME} Raises $10M Series A Funding`, category: 'Funding' },
  { date: '2025-01-15', title: `${APP_NAME} Launches Mobile App on iOS and Android`, category: 'Product Launch' },
  { date: '2024-10-01', title: `${APP_NAME} Public Beta Launch`, category: 'Product Launch' },
];

const mediaKits = [
  { label: 'Brand Guidelines', desc: 'Logo, colors, typography' },
  { label: 'Press Kit ZIP', desc: 'Logos, screenshots, team photos' },
  { label: 'Fact Sheet', desc: 'Company overview and key metrics' },
];

export default function Press() {
  return (
    <>
      <Helmet><title>Press | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Press & News</h1>
          <p className="text-lg text-gray-600">Latest news and updates from {APP_NAME}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {mediaKits.map(kit => (
            <Card key={kit.label} className="text-center">
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-1">{kit.label}</h3>
                <p className="text-sm text-gray-500 mb-4">{kit.desc}</p>
                <Button size="sm" variant="outline">Download</Button>
              </CardBody>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Press Releases</h2>
        <div className="space-y-4">
          {releases.map(r => (
            <Card key={r.title} padding={false}>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{formatDate(r.date)}</p>
                  <h3 className="font-medium text-gray-900">{r.title}</h3>
                  <span className="text-xs text-primary-600">{r.category}</span>
                </div>
                <Button size="sm" variant="ghost">Read More</Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-12">
          <CardBody className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Media Inquiries</h2>
            <p className="text-sm text-gray-500 mb-4">For press and media inquiries, contact our communications team.</p>
            <Button variant="primary">press@zalnio.com</Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
