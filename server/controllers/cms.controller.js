const Blog = require('../models/Blog');
const Page = require('../models/Page');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// --- Blogs ---
exports.getBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate('author', 'name').sort('-createdAt').skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.createBlog = asyncHandler(async (req, res) => {
  const data = { ...req.body, author: req.user._id };
  data.isPublished = req.body.status === 'published';
  if (data.isPublished && !data.publishedAt) data.publishedAt = new Date();
  delete data.status;
  if (typeof data.coverImage === 'string' && data.coverImage) {
    data.coverImage = { url: data.coverImage };
  }
  const blog = await Blog.create(data);
  res.status(201).json(ApiResponse.created(blog, 'Blog created'));
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  data.isPublished = req.body.status === 'published';
  if (data.isPublished && !data.publishedAt) data.publishedAt = new Date();
  delete data.status;
  if (typeof data.coverImage === 'string' && data.coverImage) {
    data.coverImage = { url: data.coverImage };
  }
  const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(blog, 'Blog updated'));
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(null, 'Blog deleted'));
});

// --- Pages ---
exports.getPages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [pages, total] = await Promise.all([
    Page.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Page.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    items: pages, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.createPage = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
  const page = await Page.create(data);
  res.status(201).json(ApiResponse.created(page, 'Page created'));
});

exports.updatePage = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
  const page = await Page.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!page) throw ApiError.notFound('Page not found');
  res.json(ApiResponse.success(page, 'Page updated'));
});

exports.deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndDelete(req.params.id);
  if (!page) throw ApiError.notFound('Page not found');
  res.json(ApiResponse.success(null, 'Page deleted'));
});
