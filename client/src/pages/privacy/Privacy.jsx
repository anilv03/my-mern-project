import { Helmet } from 'react-helmet-async';
import Card, { CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

export default function Privacy() {
  return (
    <>
      <Helmet><title>Privacy Policy | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-sm text-gray-500">Last updated: January 1, 2025</p>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>We collect information you provide: name, email, phone, address, payment details. We also automatically collect usage data: IP address, browser type, pages visited, and device information.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p>We use your information to: process orders, provide customer support, improve our platform, send relevant notifications, and comply with legal obligations. We do not sell your personal data.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">3. Payment Information</h2>
          <p>All payment processing is handled by PCI-compliant third-party gateways (Razorpay, Stripe). We never store your full card numbers or CVV codes on our servers.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
          <p>We use cookies to: keep you logged in, remember your preferences, analyze site traffic, and personalize content. You can control cookie settings through your browser preferences.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
          <p>We share data only with: payment processors (for transactions), shipping partners (for physical deliveries), and when required by law. Sellers receive only the information needed to fulfill your order.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
          <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no online platform can guarantee 100% security.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
          <p>You have the right to: access your data, request corrections, request deletion, export your data, and withdraw consent. Exercise these rights through your account settings or by contacting us.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
          <p>We retain your data as long as your account is active. After account deletion, we retain certain data as required by law (e.g., transaction records for 7 years for tax purposes).</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
          <p>Our platform integrates with third-party services for analytics, payments, and content delivery. These services have their own privacy policies governing data handling.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p>For privacy-related inquiries, contact our Data Protection Officer at privacy@zalnio.com.</p>
          </CardBody></Card>
        </div>
      </div>
    </>
  );
}
