import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { APP_NAME } from '../../lib/constants';

const contactMethods = [
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'support@zalnio.com' },
  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: '+91 1800-123-4567' },
  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Address', value: '123, Education Hub, Sector 12, Bangalore - 560001, India' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Helmet><title>Contact Us | {APP_NAME}</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question or need help? We're here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {contactMethods.map(method => (
            <Card key={method.label} className="text-center">
              <CardBody>
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={method.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{method.label}</h3>
                <p className="text-sm text-gray-600">{method.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Send Us a Message</h2></CardHeader>
            <CardBody>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Input label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="input-field w-full" required />
                  </div>
                  <Button type="submit" fullWidth>Send Message</Button>
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Office Hours</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between pb-3 border-b"><span className="text-gray-600">Monday - Friday</span><span className="font-medium">9:00 AM - 6:00 PM</span></div>
                <div className="flex justify-between pb-3 border-b"><span className="text-gray-600">Saturday</span><span className="font-medium">10:00 AM - 4:00 PM</span></div>
                <div className="flex justify-between pb-3 border-b"><span className="text-gray-600">Sunday</span><span className="font-medium">Closed</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Response Time</span><span className="font-medium text-green-600">Within 24 hrs</span></div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
