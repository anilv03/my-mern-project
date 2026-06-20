import { Helmet } from 'react-helmet-async';
import Card, { CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

const stats = [
  { value: '50K+', label: 'Active Learners' },
  { value: '10K+', label: 'Courses & eBooks' },
  { value: '5K+', label: 'Expert Instructors' },
  { value: '4.8', label: 'Average Rating' },
];

const team = [
  { name: 'Rahul Sharma', role: 'CEO & Founder', bio: 'Former educator with 15+ years in ed-tech.' },
  { name: 'Priya Patel', role: 'CTO', bio: 'Full-stack developer passionate about learning platforms.' },
  { name: 'Amit Singh', role: 'Head of Content', bio: 'Curates top-quality educational content.' },
  { name: 'Neha Gupta', role: 'Community Manager', bio: 'Building the largest learning community in India.' },
];

export default function About() {
  return (
    <>
      <Helmet><title>About Us | {APP_NAME}</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">About {APP_NAME}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            India's premier multi-vendor education marketplace connecting learners with top educators and content creators.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map(stat => (
            <Card key={stat.label} className="text-center">
              <CardBody>
                <p className="text-3xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="prose prose-gray max-w-4xl mx-auto mb-16">
          <h2>Our Mission</h2>
          <p>
            At {APP_NAME}, we believe that quality education should be accessible to everyone. 
            Our platform brings together the best educators, authors, and content creators from across India 
            to offer a diverse range of learning materials — from eBooks and audiobooks to video courses and software.
          </p>

          <h2>Our Story</h2>
          <p>
            Founded in 2024, {APP_NAME} started with a simple idea: create a marketplace where anyone can learn 
            anything from the best teachers. What began as a small collection of eBooks has grown into India's 
            most comprehensive multi-vendor education platform with thousands of digital and physical learning resources.
          </p>

          <h2>Why Choose Us</h2>
          <ul>
            <li><strong>Diverse Content:</strong> From academic courses to skill development, we have it all.</li>
            <li><strong>Expert Instructors:</strong> Every seller is verified to ensure quality education.</li>
            <li><strong>Secure Platform:</strong> Your learning journey is protected with enterprise-grade security.</li>
            <li><strong>Community Driven:</strong> Join thousands of learners and educators shaping the future of education.</li>
          </ul>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(member => (
              <Card key={member.name} className="text-center">
                <CardBody>
                  <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-primary-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-500">{member.bio}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
