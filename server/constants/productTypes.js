const PRODUCT_TYPES = {
  EBOOK: 'ebook',
  EBOOK_COMBO: 'ebook_combo',
  VIDEO_COURSE: 'video_course',
  AUDIOBOOK: 'audiobook',
  SUBSCRIPTION: 'subscription',
  NEW_BOOK: 'new_book',
  USED_BOOK: 'used_book',
};

const DELIVERY_TYPES = {
  INSTANT_DOWNLOAD: 'instant_download',
  STREAM_ONLY: 'stream_only',
  PHYSICAL_SHIPPING: 'physical_shipping',
};

const DIGITAL_PRODUCTS = [
  PRODUCT_TYPES.EBOOK,
  PRODUCT_TYPES.EBOOK_COMBO,
  PRODUCT_TYPES.VIDEO_COURSE,
  PRODUCT_TYPES.AUDIOBOOK,
  PRODUCT_TYPES.SUBSCRIPTION,
];

const PHYSICAL_PRODUCTS = [
  PRODUCT_TYPES.NEW_BOOK,
  PRODUCT_TYPES.USED_BOOK,
];

const PRODUCT_TYPES_ARRAY = Object.values(PRODUCT_TYPES);

const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
  OUT_OF_STOCK: 'out_of_stock',
};

module.exports = {
  PRODUCT_TYPES,
  DELIVERY_TYPES,
  DIGITAL_PRODUCTS,
  PHYSICAL_PRODUCTS,
  PRODUCT_TYPES_ARRAY,
  PRODUCT_STATUS,
};
