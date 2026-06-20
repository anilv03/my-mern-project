const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ createdAt: -1 }).populate('userCount');
  res.json(ApiResponse.success(roles, 'Roles fetched successfully'));
});

const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  res.json(ApiResponse.success(role, 'Role fetched successfully'));
});

const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name) throw ApiError.badRequest('Role name is required');

  const existing = await Role.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) throw ApiError.conflict('Role with this name already exists');

  const role = await Role.create({ name, description, permissions });
  res.status(201).json(ApiResponse.created(role, 'Role created successfully'));
});

const updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified');

  if (name && name !== role.name) {
    const existing = await Role.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, _id: { $ne: role._id } });
    if (existing) throw ApiError.conflict('Role with this name already exists');
  }

  if (name) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissions) role.permissions = permissions;

  await role.save();
  res.json(ApiResponse.success(role, 'Role updated successfully'));
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound('Role not found');
  if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted');

  const User = require('../models/User');
  const userCount = await User.countDocuments({ role: role.name });
  if (userCount > 0) {
    throw ApiError.badRequest(`Cannot delete role: ${userCount} user(s) are assigned to this role`);
  }

  await role.deleteOne();
  res.json(ApiResponse.success(null, 'Role deleted successfully'));
});

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
