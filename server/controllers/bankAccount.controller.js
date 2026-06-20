const BankAccount = require('../models/BankAccount');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.getBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await BankAccount.find({ user: req.user._id, isActive: true }).sort('-isDefault -createdAt');
  res.json(ApiResponse.success(accounts));
});

exports.createBankAccount = asyncHandler(async (req, res) => {
  const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isDefault } = req.body;

  if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
    throw ApiError.badRequest('Account holder name, account number, IFSC code, and bank name are required');
  }

  if (isDefault) {
    await BankAccount.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const account = await BankAccount.create({
    user: req.user._id,
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
    branchName,
    upiId,
    isDefault: isDefault || false,
  });

  res.status(201).json(ApiResponse.created(account, 'Bank account added'));
});

exports.updateBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findOne({ _id: req.params.id, user: req.user._id });
  if (!account) throw ApiError.notFound('Bank account not found');

  const { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isDefault } = req.body;

  if (isDefault) {
    await BankAccount.updateMany({ user: req.user._id, _id: { $ne: account._id } }, { isDefault: false });
  }

  Object.assign(account, { accountHolderName, accountNumber, ifscCode, bankName, branchName, upiId, isDefault });
  await account.save();

  res.json(ApiResponse.success(account, 'Bank account updated'));
});

exports.deleteBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!account) throw ApiError.notFound('Bank account not found');
  res.json(ApiResponse.success(null, 'Bank account deleted'));
});

exports.setDefaultBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findOne({ _id: req.params.id, user: req.user._id });
  if (!account) throw ApiError.notFound('Bank account not found');

  await BankAccount.updateMany({ user: req.user._id }, { isDefault: false });
  account.isDefault = true;
  await account.save();

  res.json(ApiResponse.success(account, 'Default bank account updated'));
});
