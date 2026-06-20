import { lazy } from 'react';
import { Route } from 'react-router-dom';

const SellerDashboard = lazy(() => import('../pages/seller/Dashboard'));
const SellerProducts = lazy(() => import('../pages/seller/Products'));
const SellerAddProduct = lazy(() => import('../pages/seller/AddProduct'));
const SellerEditProduct = lazy(() => import('../pages/seller/EditProduct'));
const SellerOrders = lazy(() => import('../pages/seller/Orders'));
const ShippingLabel = lazy(() => import('../pages/seller/ShippingLabel'));
const Invoice = lazy(() => import('../pages/seller/Invoice'));
const SellerEarnings = lazy(() => import('../pages/seller/Earnings'));
const SellerWallet = lazy(() => import('../pages/seller/WalletPage'));
const SellerWithdrawals = lazy(() => import('../pages/seller/Withdrawals'));
const SellerAnalytics = lazy(() => import('../pages/seller/Analytics'));
const SellerReferrals = lazy(() => import('../pages/seller/Referrals'));
const SellerReviews = lazy(() => import('../pages/seller/Reviews'));
const SellerBlogs = lazy(() => import('../pages/seller/Blogs'));
const SellerAddBlog = lazy(() => import('../pages/seller/AddBlog'));
const SellerEditBlog = lazy(() => import('../pages/seller/EditBlog'));
const SellerSettings = lazy(() => import('../pages/seller/Settings'));
const SellerStoreProfile = lazy(() => import('../pages/seller/StoreProfile'));
const SellerNotifications = lazy(() => import('../pages/seller/Notifications'));
const SellerSupportTickets = lazy(() => import('../pages/seller/SupportTickets'));
const SellerCoupons = lazy(() => import('../pages/seller/Coupons'));
const SellerFlashSales = lazy(() => import('../pages/seller/FlashSales'));
const SellerKyc = lazy(() => import('../pages/seller/Kyc'));
const SellerKycForm = lazy(() => import('../pages/seller/KycForm'));
const SellerShipping = lazy(() => import('../pages/seller/Shipping'));

const SellerRoutes = (
  <Route>
    <Route index element={<SellerDashboard />} />
    <Route path="products" element={<SellerProducts />} />
    <Route path="products/add" element={<SellerAddProduct />} />
    <Route path="products/edit/:id" element={<SellerEditProduct />} />
    <Route path="orders" element={<SellerOrders />} />
    <Route path="orders/:orderId/shipping-label" element={<ShippingLabel />} />
    <Route path="orders/:orderId/invoice" element={<Invoice />} />
    <Route path="earnings" element={<SellerEarnings />} />
    <Route path="wallet" element={<SellerWallet />} />
    <Route path="withdrawals" element={<SellerWithdrawals />} />
    <Route path="analytics" element={<SellerAnalytics />} />
    <Route path="referrals" element={<SellerReferrals />} />
    <Route path="reviews" element={<SellerReviews />} />
    <Route path="blogs" element={<SellerBlogs />} />
    <Route path="blogs/add" element={<SellerAddBlog />} />
    <Route path="blogs/edit/:id" element={<SellerEditBlog />} />
    <Route path="profile" element={<SellerStoreProfile />} />
    <Route path="notifications" element={<SellerNotifications />} />
    <Route path="tickets" element={<SellerSupportTickets />} />
    <Route path="coupons" element={<SellerCoupons />} />
    <Route path="flash-sales" element={<SellerFlashSales />} />
    <Route path="kyc" element={<SellerKyc />} />
    <Route path="kyc/form" element={<SellerKycForm />} />
    <Route path="settings" element={<SellerSettings />} />
    <Route path="shipping" element={<SellerShipping />} />
  </Route>
);

export default SellerRoutes;
