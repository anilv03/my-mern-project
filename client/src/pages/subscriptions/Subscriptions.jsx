import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Loader';
import { formatPrice, formatDate } from '../../lib/helpers';
import { fetchPlans, fetchMySubscription, subscribeToPlan, cancelMySubscription, resetSubscriptionSuccess } from '../../store/slices/subscriptionSlice';

export default function Subscriptions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { plans, currentSubscription, isLoading, isSuccess } = useSelector(state => state.subscriptions);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    dispatch(fetchPlans());
    if (isAuthenticated) {
      dispatch(fetchMySubscription());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isSuccess) {
      setShowConfirm(false);
      dispatch(resetSubscriptionSuccess());
    }
  }, [isSuccess, dispatch]);

  const handleSubscribe = (plan) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    setSelectedPlan(plan);
    setShowConfirm(true);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlan) return;
    await dispatch(subscribeToPlan({
      planId: selectedPlan._id,
      billingInterval: 'monthly',
      paymentMethod: 'razorpay',
      paymentId: 'manual_' + Date.now(),
    }));
    dispatch(fetchMySubscription());
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    await dispatch(cancelMySubscription({
      id: currentSubscription._id,
      reason: cancelReason || 'User requested',
    }));
    setShowCancel(false);
    dispatch(fetchMySubscription());
  };

  if (isLoading && plans.length === 0) return <PageLoader />;

  return (
    <>
      <Helmet><title>Subscriptions | Zalnio</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Subscription Plans</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choose the perfect plan for your learning journey. Cancel anytime.
          </p>
        </div>

        {currentSubscription ? (
          <Card className="max-w-2xl mx-auto mb-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Current Subscription</h2>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold">{currentSubscription.plan?.name || 'Active Plan'}</p>
                  <p className="text-sm text-gray-500">{formatPrice(currentSubscription.price)}/{currentSubscription.billingInterval?.replace('_', ' ')}</p>
                </div>
                <p className="text-sm text-gray-500">Valid till {formatDate(currentSubscription.currentPeriodEnd)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/my-learning')}>Go to My Learning</Button>
                <Button variant="ghost" onClick={() => setShowCancel(true)}>Cancel Subscription</Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto ${currentSubscription ? 'opacity-75 pointer-events-none' : ''}`}>
          {plans.map(plan => {
            const monthlyPrice = plan.pricing?.monthly || plan.billingIntervals?.find(b => b.interval === 'monthly')?.price || 0;
            const features = plan.features?.filter(f => f.isIncluded).map(f => f.text) || [];
            const isPopular = plan.isFeatured || plan.billingIntervals?.some(b => b.isPopular);

            return (
              <Card key={plan._id} className={`relative flex flex-col ${isPopular ? 'ring-2 ring-primary-500 shadow-lg scale-105' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary" size="md">Most Popular</Badge>
                  </div>
                )}
                <CardBody className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(monthlyPrice)}</span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  {features.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
                <CardFooter>
                  <Button
                    variant={isPopular ? 'primary' : 'outline'}
                    fullWidth
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                  >
                    {currentSubscription ? 'Switch to This Plan' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Frequently Asked Questions</h2></CardHeader>
            <CardBody>
              <div className="space-y-6">
                {[{
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of the billing period.',
                }, {
                  q: 'How do subscriptions work?',
                  a: 'Subscriptions are billed monthly. You get access to all content included in your plan as long as your subscription is active.',
                }, {
                  q: 'Can I switch between plans?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.',
                }, {
                  q: 'Is there a free trial?',
                  a: 'We offer a 7-day free trial on select plans. No payment required to start.',
                }].map((faq, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-gray-900 mb-1">{faq.q}</h3>
                    <p className="text-sm text-gray-500">{faq.a}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {showConfirm && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Confirm Subscription</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">
                You are subscribing to <strong>{selectedPlan.name}</strong> at <strong>{formatPrice(selectedPlan.pricing?.monthly || 0)}/month</strong>.
              </p>
              <p className="text-sm text-gray-500">Your subscription will be activated immediately.</p>
            </CardBody>
            <CardFooter>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button fullWidth onClick={handleConfirmSubscribe}>Confirm & Subscribe</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Cancel Subscription</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">Are you sure you want to cancel your subscription?</p>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Reason (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </CardBody>
            <CardFooter>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setShowCancel(false)}>Keep Subscription</Button>
                <Button variant="danger" fullWidth onClick={handleCancelSubscription}>Yes, Cancel</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
