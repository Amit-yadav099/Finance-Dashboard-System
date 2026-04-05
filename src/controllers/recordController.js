const FinancialRecord = require('../models/FinancialRecord');

// Create record – Analyst & Admin only
exports.createRecord = async (req, res) => {
  const record = new FinancialRecord({ ...req.body, userId: req.user._id });
  await record.save();
  res.status(201).json(record);
};

// Get records with filtering, pagination, search (soft-delete excluded automatically)
exports.getRecords = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { deletedAt: null };

  // Role-based: viewer/analyst see only own records, admin sees all
  if (req.user.role !== 'admin') {
    filter.userId = req.user._id;
  }

  // Filters
  if (req.query.type) filter.type = req.query.type;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
  }
  // Search in description
  if (req.query.search) {
    filter.description = { $regex: req.query.search, $options: 'i' };
  }

  const records = await FinancialRecord.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
  const total = await FinancialRecord.countDocuments(filter);
  res.json({ records, page, totalPages: Math.ceil(total / limit), total });
};

// Update record – only owner (if analyst) or admin
exports.updateRecord = async (req, res) => {
  const record = await FinancialRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  if (req.user.role !== 'admin' && record.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  Object.assign(record, req.body);
  await record.save();
  res.json(record);
};

// Soft delete record – same permission as of the update
exports.deleteRecord = async (req, res) => {
  const record = await FinancialRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  if (req.user.role !== 'admin' && record.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  record.deletedAt = new Date();
  await record.save();
  res.json({ message: 'Record soft deleted' });
};