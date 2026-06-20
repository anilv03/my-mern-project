import { lazy } from 'react';
import { Route } from 'react-router-dom';

const Checkout = lazy(() => import('../pages/checkout/Checkout'));
const DigitalCheckout = lazy(() => import('../pages/checkout/DigitalCheckout'));
const OrderSuccess = lazy(() => import('../pages/orders/OrderSuccess'));
const OrderHistory = lazy(() => import('../pages/orders/OrderHistory'));
const OrderDetail = lazy(() => import('../pages/orders/OrderDetail'));
const MyPhysicalOrders = lazy(() => import('../pages/orders/MyPhysicalOrders'));
const Profile = lazy(() => import('../pages/user/Profile'));
const Wishlist = lazy(() => import('../pages/user/Wishlist'));
const Notifications = lazy(() => import('../pages/notifications/Notifications'));
const Wallet = lazy(() => import('../pages/wallet/Wallet'));
const Referral = lazy(() => import('../pages/referrals/Referral'));
const CreatorRewards = lazy(() => import('../pages/creator/CreatorRewards'));
const EarningsDashboard = lazy(() => import('../pages/earnings/EarningsDashboard'));
const MyLearning = lazy(() => import('../pages/learning/MyLearning'));
const MyLibrary = lazy(() => import('../pages/library/MyLibrary'));
const MyCourses = lazy(() => import('../pages/courses/MyCourses'));
const CourseDetail = lazy(() => import('../pages/courses/CourseDetail'));
const MyAudioBooks = lazy(() => import('../pages/audiobooks/MyAudioBooks'));
const AudioBookPlayer = lazy(() => import('../pages/audiobooks/AudioBookPlayer'));
const SubscriptionDetail = lazy(() => import('../pages/subscription/SubscriptionDetail'));
const Inbox = lazy(() => import('../pages/messages/Inbox'));
const Conversation = lazy(() => import('../pages/messages/Conversation'));

const UserRoutes = (
  <Route>
    <Route path="checkout" element={<Checkout />} />
    <Route path="checkout/digital" element={<DigitalCheckout />} />
    <Route path="order-success/:id" element={<OrderSuccess />} />
    <Route path="orders" element={<OrderHistory />} />
    <Route path="orders/:id" element={<OrderDetail />} />
    <Route path="my-physical-orders" element={<MyPhysicalOrders />} />
    <Route path="profile" element={<Profile />} />
    <Route path="wishlist" element={<Wishlist />} />
    <Route path="notifications" element={<Notifications />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="referrals" element={<Referral />} />
    <Route path="creator-rewards" element={<CreatorRewards />} />
    <Route path="earnings" element={<EarningsDashboard />} />
    <Route path="my-learning" element={<MyLearning />} />
    <Route path="my-library" element={<MyLibrary />} />
    <Route path="my-courses" element={<MyCourses />} />
    <Route path="my-courses/:productId" element={<CourseDetail />} />
    <Route path="my-audiobooks" element={<MyAudioBooks />} />
    <Route path="my-audiobooks/:productId" element={<AudioBookPlayer />} />
    <Route path="my-subscription" element={<SubscriptionDetail />} />
    <Route path="messages" element={<Inbox />} />
    <Route path="messages/:id" element={<Conversation />} />
  </Route>
);

export default UserRoutes;
