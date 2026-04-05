const FinancialRecord = require('../models/FinancialRecord');
const mongoose = require('mongoose');

exports.getSummary = async (req, res) => {
  const match = { deletedAt: null };
  if (req.user.role !== 'admin') match.userId = req.user._id;

  // Optional date filters
  if (req.query.startDate || req.query.endDate) {
    match.date = {};
    if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) match.date.$lte = new Date(req.query.endDate);
  }

  const [aggregated] = await FinancialRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      },
    },
  ]);

  const totalIncome = aggregated?.totalIncome || 0;
  const totalExpenses = aggregated?.totalExpenses || 0;
  const netBalance = totalIncome - totalExpenses;

  // Category-wise totals
  const categoryTotals = await FinancialRecord.aggregate([
    { $match: match },
    { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.category': 1 } },
  ]);

  // Recent activity (last 5 records)
  const recent = await FinancialRecord.find(match)
    .sort({ date: -1 })
    .limit(5)
    .populate('userId', 'name');

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyTrends = await FinancialRecord.aggregate([
    { $match: { ...match, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    totalIncome,
    totalExpenses,
    netBalance,
    categoryTotals,
    recentActivity: recent,
    monthlyTrends,
  });
};