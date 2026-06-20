const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { cloudinary } = require('../config/cloudinary');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  res.status(200).json(
    ApiResponse.success({
      url: req.file.path,
      public_id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Image uploaded successfully')
  );
});

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('No image files provided');
  }

  const files = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    isPrimary: false,
  }));

  if (files.length > 0) files[0].isPrimary = true;

  res.status(200).json(
    ApiResponse.success(files, `${files.length} images uploaded successfully`)
  );
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No document file provided');

  res.status(200).json(
    ApiResponse.success({
      url: req.file.path,
      public_id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Document uploaded successfully')
  );
});

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No video file provided');

  res.status(200).json(
    ApiResponse.success({
      url: req.file.path,
      public_id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      thumbnail: null,
    }, 'Video uploaded successfully')
  );
});

const uploadAudio = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No audio file provided');

  res.status(200).json(
    ApiResponse.success({
      url: req.file.path,
      public_id: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Audio uploaded successfully')
  );
});

const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  if (!publicId) throw ApiError.badRequest('Public ID is required');

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result === 'not found') {
    throw ApiError.notFound('File not found on cloud storage');
  }

  res.status(200).json(ApiResponse.success({ publicId, result: result.result }, 'File deleted successfully'));
});

const deleteFiles = asyncHandler(async (req, res) => {
  const { publicIds } = req.body;

  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    throw ApiError.badRequest('Public IDs array is required');
  }

  const results = await Promise.allSettled(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
  );

  const deleted = results.filter((r) => r.status === 'fulfilled' && r.value.result === 'ok').length;
  const failed = results.filter((r) => r.status === 'rejected' || r.value.result !== 'ok').length;

  res.status(200).json(
    ApiResponse.success({ deleted, failed }, `Deleted ${deleted} files, ${failed} failed`)
  );
});

module.exports = {
  uploadImage,
  uploadImages,
  uploadDocument,
  uploadVideo,
  uploadAudio,
  deleteFile,
  deleteFiles,
};
