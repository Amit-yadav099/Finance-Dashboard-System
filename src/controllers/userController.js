const User = require('../models/User');

// Get all users (with pagination, search, soft-delete filter)
exports.getUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const filter = { deletedAt: null };
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(filter).skip(skip).limit(limit).select('-password');
  const total = await User.countDocuments(filter);
  res.json({ users, page, totalPages: Math.ceil(total / limit), total });
};

// Create user (admin)
exports.createUser = async (req, res) => {
 
  const { name, email, password, role, isActive } = req.body;
  const exists = await User.findOne({ email });
 
  if (exists) return res.status(400).json({ error: 'Email already used' });
  const user = await User.create({ name, email, password, role, isActive });
 
  res.status(201).json(user);
};

// Update user (admin)
exports.updateUser = async (req, res) => {

  const { id } = req.params;
  const updates = req.body;

  const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);

};

// Soft delete user

exports.deleteUser = async (req, res) => {

  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { deletedAt: new Date() });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User soft deleted' });

};