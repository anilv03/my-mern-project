import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { APP_NAME } from '../../lib/constants';

const jobs = [
  { title: 'Senior Full Stack Developer', dept: 'Engineering', location: 'Bangalore', type: 'Full-time' },
  { title: 'UI/UX Designer', dept: 'Design', location: 'Remote', type: 'Full-time' },
  { title: 'Content Strategist', dept: 'Content', location: 'Bangalore', type: 'Full-time' },
  { title: 'Marketing Manager', dept: 'Marketing', location: 'Mumbai', type: 'Full-time' },
  { title: 'Customer Support Lead', dept: 'Support', location: 'Remote', type: 'Full-time' },
  { title: 'Data Analyst', dept: 'Analytics', location: 'Bangalore', type: 'Full-time' },
];

const perks = [
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Flexible Hours', desc: 'Work when you\'re most productive' },
  { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Remote First', desc: 'Work from anywhere in India' },
  { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', label: 'Learning Budget', desc: '₹1L/year for courses & books' },
  { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Health Insurance', desc: 'Comprehensive coverage for you & family' },
  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', label: 'Annual Retreats', desc: 'Team trips to amazing destinations' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Stock Options', desc: 'Own a piece of the company' },
];

export default function Careers() {
  return (
    <>
      <Helmet><title>Careers | {APP_NAME}</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Join Our Team</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us build the future of education in India. We're looking for passionate people to join our mission.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {perks.map(perk => (
            <Card key={perk.label} className="text-center">
              <CardBody>
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={perk.icon} />
                  </svg>
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-1">{perk.label}</h3>
                <p className="text-xs text-gray-500">{perk.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map(job => (
            <Card key={job.title} padding={false}>
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{job.dept}</span>
                    <Badge variant="primary" size="xs">{job.location}</Badge>
                    <Badge variant="success" size="xs">{job.type}</Badge>
                  </div>
                </div>
                <Button size="sm">Apply Now</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">Don't see a role that fits? We're always looking for talent.</p>
          <Button variant="outline">Send Us Your Resume</Button>
        </div>
      </div>
    </>
  );
}
