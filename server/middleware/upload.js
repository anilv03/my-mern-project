const multer = require('multer');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const ApiError = require('../utils/ApiError');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/zip', 'application/epub+zip'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska', 'video/x-flv', 'video/x-ms-wmv'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} is not allowed`), false);
  }
};

const createCloudinaryStorage = (folder, resourceType = 'image') => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `zalnio/${folder}`,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'mp4', 'webm', 'mp3', 'wav'],
      transformation: [{ quality: 'auto' }],
    },
  });
};

const uploadProductImages = multer({
  storage: createCloudinaryStorage('products'),
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: { fileSize: MAX_IMAGE_SIZE },
}).array('images', 10);

const uploadAvatar = multer({
  storage: createCloudinaryStorage('avatars'),
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('avatar');

const rawStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: { folder: `zalnio/${folder}`, resource_type: 'raw' },
});

const documentStorage = rawStorage('documents');
const videoStorage = rawStorage('videos');
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'zalnio/audio', resource_type: 'video' },
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES),
  limits: { fileSize: MAX_DOCUMENT_SIZE },
}).single('document');

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
  limits: { fileSize: MAX_VIDEO_SIZE },
}).single('video');

const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: fileFilter(ALLOWED_AUDIO_TYPES),
  limits: { fileSize: MAX_AUDIO_SIZE },
}).single('audio');

module.exports = {
  uploadProductImages,
  uploadAvatar,
  uploadDocument,
  uploadVideo,
  uploadAudio,
};
