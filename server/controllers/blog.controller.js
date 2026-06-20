const Blog = require('../models/Blog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getPublishedBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.tag) filter.tags = req.query.tag;
  const [blogs, total] = await Promise.all([
    Blog.find(filter).populate('author', 'name avatar email').sort('-publishedAt').skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('author', 'name avatar email');
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(blog));
});

exports.getFeaturedBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ isPublished: true, isFeatured: true })
    .populate('author', 'name avatar').sort('-publishedAt').limit(6);
  res.json(ApiResponse.success(blogs));
});

exports.getAllBlogs = asyncHandler(async (req, res) => {
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
  req.body.author = req.user._id;
  const blog = await Blog.create(req.body);
  res.status(201).json(ApiResponse.created(blog, 'Blog created'));
});

exports.updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(blog, 'Blog updated'));
});

exports.deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(null, 'Blog deleted'));
});

exports.addComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  const comment = { user: req.user._id, name: req.user.name, email: req.user.email, comment: req.body.comment };
  blog.comments.push(comment);
  await blog.save();
  res.json(ApiResponse.success(blog.comments[blog.comments.length - 1], 'Comment added'));
});

exports.getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  res.json(ApiResponse.success(blog));
});

exports.getMyBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { author: req.user._id };
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Blog.countDocuments(filter),
  ]);
  res.json(ApiResponse.success({
    blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }));
});

exports.getBlogCategories = asyncHandler(async (req, res) => {
  const categories = await Blog.distinct('category', { isPublished: true, category: { $ne: null, $ne: '' } });
  res.json(ApiResponse.success(categories));
});
