const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  uploadProductImages,
  uploadAvatar,
  uploadDocument,
  uploadVideo,
  uploadAudio,
} = require('../middleware/upload');
const {
  uploadImage,
  uploadImages,
  uploadDocument: uploadDoc,
  uploadVideo: uploadVid,
  uploadAudio: uploadAud,
  deleteFile,
  deleteFiles,
} = require('../controllers/upload.controller');

router.post('/image', authenticate, uploadAvatar, uploadImage);
router.post('/images', authenticate, authorize('seller', 'admin', 'super_admin'), uploadProductImages, uploadImages);
router.post('/document', authenticate, uploadDocument, uploadDoc);
router.post('/video', authenticate, authorize('seller', 'admin', 'super_admin'), uploadVideo, uploadVid);
router.post('/audio', authenticate, authorize('seller', 'admin', 'super_admin'), uploadAudio, uploadAud);
router.delete('/:publicId', authenticate, deleteFile);
router.post('/delete-multiple', authenticate, deleteFiles);

router.post('/avatar', authenticate, uploadAvatar, uploadImage);

module.exports = router;
