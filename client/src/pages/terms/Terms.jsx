import { Helmet } from 'react-helmet-async';
import Card, { CardBody } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';

export default function Terms() {
  return (
    <>
      <Helmet><title>Terms of Service | {APP_NAME}</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-sm text-gray-500">Last updated: January 1, 2025</p>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using {APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">2. Account Registration</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">3. Purchases & Payments</h2>
          <p>All prices are listed in INR. Payment is due at the time of purchase. We reserve the right to modify prices at any time. Digital products are delivered instantly upon payment confirmation.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">4. Seller Terms</h2>
          <p>Sellers must complete KYC verification before listing products. Sellers are responsible for the accuracy of their listings and for fulfilling orders promptly. {APP_NAME} charges a commission on each sale as specified in the seller agreement.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
          <p>Content uploaded by sellers remains their intellectual property. By listing on {APP_NAME}, sellers grant us a license to distribute their content. Buyers receive a personal, non-transferable license to access purchased content.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
          <p>Users may not: (a) use the platform for illegal purposes, (b) infringe on intellectual property rights, (c) distribute malware, (d) attempt to access other users' accounts, (e) engage in price manipulation, (f) submit false or misleading information.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
          <p>{APP_NAME} is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid for the specific transaction giving rise to the claim.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from your profile settings.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
          <p>We may update these terms at any time. Users will be notified of material changes via email or platform notification. Continued use after changes constitutes acceptance.</p>
          </CardBody></Card>

          <Card><CardBody>
          <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
          <p>For questions about these terms, contact us at support@zalnio.com or visit our Contact page.</p>
          </CardBody></Card>
        </div>
      </div>
    </>
  );
}
