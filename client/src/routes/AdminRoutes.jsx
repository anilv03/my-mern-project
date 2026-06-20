import { lazy } from 'react';
import { Route } from 'react-router-dom';

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminSellers = lazy(() => import('../pages/admin/Sellers'));
const AdminProducts = lazy(() => import('../pages/admin/Products'));
const AdminCategories = lazy(() => import('../pages/admin/Categories'));
const AdminOrders = lazy(() => import('../pages/admin/Orders'));
const AdminSellerOrders = lazy(() => import('../pages/admin/SellerOrders'));
const AdminUserPurchases = lazy(() => import('../pages/admin/UserPurchases'));
const AdminPayments = lazy(() => import('../pages/admin/Payments'));
const AdminCoupons = lazy(() => import('../pages/admin/Coupons'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminRefunds = lazy(() => import('../pages/admin/Refunds'));
const AdminWalletManagement = lazy(() => import('../pages/admin/WalletManagement'));
const AdminSettlements = lazy(() => import('../pages/admin/Settlements'));
const AdminReferralAnalytics = lazy(() => import('../pages/admin/ReferralAnalytics'));
const AdminReferralRewards = lazy(() => import('../pages/admin/ReferralRewards'));
const AdminCreatorProgram = lazy(() => import('../pages/admin/CreatorProgram'));
const AdminCMS = lazy(() => import('../pages/admin/CMS'));
const AdminFlashSales = lazy(() => import('../pages/admin/FlashSales'));
const AdminReports = lazy(() => import('../pages/admin/Reports'));
const AdminNotifications = lazy(() => import('../pages/admin/Notifications'));
const AdminSupportTickets = lazy(() => import('../pages/admin/SupportTickets'));
const AdminRolesPermissions = lazy(() => import('../pages/admin/AdminRolesPermissions'));
const AdminWithdrawalRequests = lazy(() => import('../pages/admin/WithdrawalRequests'));
const AdminSellerVerification = lazy(() => import('../pages/admin/SellerVerificationDetails'));
const AdminProductApprovalWorkflow = lazy(() => import('../pages/admin/ProductApprovalWorkflow'));
const AdminDeliverySettlements = lazy(() => import('../pages/admin/DeliverySettlements'));
const AdminSellerReferralTrees = lazy(() => import('../pages/admin/SellerReferralTrees'));

const AdminRoutes = (
  <Route>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="sellers" element={<AdminSellers />} />
    <Route path="products" element={<AdminProducts />} />
    <Route path="categories" element={<AdminCategories />} />
    <Route path="orders" element={<AdminOrders />} />
    <Route path="seller-orders" element={<AdminSellerOrders />} />
    <Route path="users/:userId/purchases" element={<AdminUserPurchases />} />
    <Route path="payments" element={<AdminPayments />} />
    <Route path="coupons" element={<AdminCoupons />} />
    <Route path="refunds" element={<AdminRefunds />} />
    <Route path="withdrawals" element={<AdminWithdrawalRequests />} />
    <Route path="wallet" element={<AdminWalletManagement />} />
    <Route path="settlements" element={<AdminSettlements />} />
    <Route path="referrals" element={<AdminReferralAnalytics />} />
    <Route path="referral-rewards" element={<AdminReferralRewards />} />
    <Route path="seller-verification" element={<AdminSellerVerification />} />
    <Route path="product-approvals" element={<AdminProductApprovalWorkflow />} />
    <Route path="delivery-settlements" element={<AdminDeliverySettlements />} />
    <Route path="seller-referral-trees" element={<AdminSellerReferralTrees />} />
    <Route path="creator-program" element={<AdminCreatorProgram />} />
    <Route path="cms" element={<AdminCMS />} />
    <Route path="flash-sales" element={<AdminFlashSales />} />
    <Route path="reports" element={<AdminReports />} />
    <Route path="notifications" element={<AdminNotifications />} />
    <Route path="tickets" element={<AdminSupportTickets />} />
    <Route path="roles" element={<AdminRolesPermissions />} />
    <Route path="settings" element={<AdminSettings />} />
  </Route>
);

export default AdminRoutes;
