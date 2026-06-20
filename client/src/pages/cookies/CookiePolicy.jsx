import { Helmet } from 'react-helmet-async';
import Card, { CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

const cookieTypes = [
  { name: 'Essential Cookies', desc: 'Required for the website to function. Includes authentication, session management, and security.', duration: 'Session / 1 year', example: 'accessToken, sessionId' },
  { name: 'Preference Cookies', desc: 'Remember your choices like language, currency, and display preferences.', duration: '1 year', example: 'language, currency' },
  { name: 'Analytics Cookies', desc: 'Help us understand how visitors use our site so we can improve it.', duration: '2 years', example: '_ga, _gid' },
  { name: 'Marketing Cookies', desc: 'Used to deliver relevant ads and track campaign performance.', duration: '90 days', example: '_fbp, ads_id' },
];

export default function CookiePolicy() {
  return (
    <>
      <Helmet><title>Cookie Policy | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2025</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">What Are Cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your browsing experience.</p>
          </CardBody></Card>

          <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {cookieTypes.map(ct => (
              <Card key={ct.name}>
                <CardBody>
                  <h3 className="font-semibold text-gray-900 mb-1">{ct.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{ct.desc}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><strong>Duration:</strong> {ct.duration}</span>
                    <span><strong>Example:</strong> {ct.example}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that disabling essential cookies may affect website functionality.</p>
          <ul className="mt-2 space-y-1">
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
          </ul>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">Third-Party Cookies</h2>
          <p>We use third-party services like Google Analytics, Razorpay, and Stripe which may set their own cookies. These are governed by their respective privacy policies.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">Updates to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p>If you have questions about our use of cookies, contact us at privacy@zalnio.com.</p>
          </CardBody></Card>
        </div>
      </div>
    </>
  );
}
