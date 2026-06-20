import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { fetchSubscriptionDetail, renewSubscription } from '../../store/slices/contentSlice';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Loader';
import { formatDate, formatPrice } from '../../lib/helpers';

export default function SubscriptionDetail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subscription, isLoading, isSuccess, message } = useSelector(state => state.content);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    dispatch(fetchSubscriptionDetail());
  }, [dispatch]);

  const handleRenew = async () => {
    if (!subscription?._id) return;
    setRenewing(true);
    try {
      await dispatch(renewSubscription(subscription._id)).unwrap();
      setShowRenewModal(false);
      dispatch(fetchSubscriptionDetail());
    } catch {
    }
    setRenewing(false);
  };

  if (isLoading && !subscription) return <PageLoader />;

  const hasActive = subscription?.hasActive;

  return (
    <>
      <Helmet><title>My Subscription | Zalnio</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">My Subscription</h1>
          <p className="text-gray-500 mt-1">Manage your subscription plan.</p>
        </div>

        {!hasActive ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active subscription</h3>
                <p className="text-gray-500 mb-6">Subscribe to a plan to unlock premium content.</p>
                <Link to="/subscriptions"><Button variant="primary">View Plans</Button></Link>
              </div>
            </CardBody>
          </Card>
        ) : subscription ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current Plan</p>
                    <p className="text-2xl font-bold">{subscription.plan?.name || 'Premium'}</p>
                  </div>
                  <Badge variant="success" size="md" className="bg-green-400 text-green-900">Active</Badge>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Subscription Details</h3>
                </CardHeader>
                <CardBody>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Plan</dt>
                      <dd className="font-medium text-gray-900">{subscription.plan?.name || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Billing</dt>
                      <dd className="font-medium text-gray-900 capitalize">{subscription.billingInterval?.replace(/_/g, ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Price</dt>
                      <dd className="font-medium text-gray-900">{formatPrice(subscription.price)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Auto Renew</dt>
                      <dd className="font-medium text-gray-900">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</dd>
                    </div>
                    {subscription.trialEndsAt && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Trial Ends</dt>
                        <dd className="font-medium text-gray-900">{formatDate(subscription.trialEndsAt)}</dd>
                      </div>
                    )}
                  </dl>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Validity Period</h3>
                </CardHeader>
                <CardBody>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Activation Date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(subscription.currentPeriodStart)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Expiry Date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(subscription.currentPeriodEnd)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Days Remaining</dt>
                      <dd className={`font-bold text-lg ${subscription.daysRemaining <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                        {subscription.daysRemaining} days
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Progress</dt>
                      <dd className="font-medium text-gray-900">{subscription.daysElapsed}/{subscription.totalDays} days</dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${subscription.usagePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{subscription.usagePercent}% of billing period used</p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {subscription.plan?.features?.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Plan Features</h3>
                </CardHeader>
                <CardBody>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subscription.plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        {feature.isIncluded !== false ? (
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {feature.text || feature}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowRenewModal(true)}
                    className="flex-1"
                  >
                    Renew Subscription
                  </Button>
                  <Link to="/subscriptions" className="flex-1">
                    <Button variant="outline" size="lg" fullWidth>Change Plan</Button>
                  </Link>
                  <Link to="/my-learning" className="flex-1">
                    <Button variant="ghost" size="lg" fullWidth>Go to My Learning</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>

      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title="Renew Subscription" size="md">
        <div className="text-sm text-gray-600 space-y-4">
          <p>Your subscription <strong>{subscription?.plan?.name}</strong> will be renewed.</p>
          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{subscription.plan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing</span>
                <span className="font-medium capitalize">{subscription.billingInterval?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Amount</span>
                <span>{formatPrice(subscription.price)}</span>
              </div>
            </div>
          )}
          <p>Your new billing period will start after the current one ends.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" fullWidth onClick={() => setShowRenewModal(false)}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleRenew} isLoading={renewing}>Confirm Renewal</Button>
        </div>
      </Modal>
    </>
  );
}
