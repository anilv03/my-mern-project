import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';
import cartReducer, { syncCartToStorage } from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import sellerReducer from './slices/sellerSlice';
import adminReducer from './slices/adminSlice';
import wishlistReducer, { syncWishlistToStorage } from './slices/wishlistSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import walletReducer from './slices/walletSlice';
import cashbackReducer from './slices/cashbackSlice';
import referralReducer from './slices/referralSlice';
import creatorRewardReducer from './slices/creatorRewardSlice';
import earningReducer from './slices/earningSlice';
import flashSaleReducer from './slices/flashSaleSlice';
import blogReducer from './slices/blogSlice';
import newsletterReducer from './slices/newsletterSlice';
import payoutReducer from './slices/payoutSlice';
import refundReducer from './slices/refundSlice';
import reportReducer from './slices/reportSlice';
import publicReducer from './slices/publicSlice';
import couponReducer from './slices/couponSlice';
import ticketReducer from './slices/supportTicketSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import contentReducer from './slices/contentSlice';
import chatReducer from './slices/chatSlice';
import shippingReducer from './slices/shippingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    categories: categoryReducer,
    cart: cartReducer,
    orders: orderReducer,
    seller: sellerReducer,
    admin: adminReducer,
    wishlist: wishlistReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    wallet: walletReducer,
    cashback: cashbackReducer,
    referral: referralReducer,
    creatorReward: creatorRewardReducer,
    earning: earningReducer,
    flashSale: flashSaleReducer,
    blog: blogReducer,
    newsletter: newsletterReducer,
    payout: payoutReducer,
    refund: refundReducer,
    report: reportReducer,
    public: publicReducer,
    coupons: couponReducer,
    tickets: ticketReducer,
    subscriptions: subscriptionReducer,
    content: contentReducer,
    chat: chatReducer,
    shipping: shippingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
});

store.subscribe(() => {
  const { cart, wishlist } = store.getState();
  syncCartToStorage(cart);
  syncWishlistToStorage(wishlist);
});
