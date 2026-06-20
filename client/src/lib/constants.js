export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const PRODUCT_TYPES = {
  EBOOK: 'ebook',
  EBOOK_COMBO: 'ebook_combo',
  VIDEO_COURSE: 'video_course',
  AUDIOBOOK: 'audiobook',
  SUBSCRIPTION: 'subscription',
  NEW_BOOK: 'new_book',
  USED_BOOK: 'used_book',
};

export const DELIVERY_TYPES = {
  INSTANT_DOWNLOAD: 'instant_download',
  STREAM_ONLY: 'stream_only',
  PHYSICAL_SHIPPING: 'physical_shipping',
};

export const DIGITAL_PRODUCTS = [
  PRODUCT_TYPES.EBOOK,
  PRODUCT_TYPES.EBOOK_COMBO,
  PRODUCT_TYPES.VIDEO_COURSE,
  PRODUCT_TYPES.AUDIOBOOK,
  PRODUCT_TYPES.SUBSCRIPTION,
];

export const PHYSICAL_PRODUCTS = [
  PRODUCT_TYPES.NEW_BOOK,
  PRODUCT_TYPES.USED_BOOK,
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Zalnio';
export const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || '₹';
export const CURRENCY_CODE = import.meta.env.VITE_CURRENCY_CODE || 'INR';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'discount', label: 'Biggest Discount' },
];

export const ITEMS_PER_PAGE = [12, 24, 36, 48];
