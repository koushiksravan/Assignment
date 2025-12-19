const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Balance = require('../models/Balance');

// Add expense
router.post('/', async (req, res) => {
  try {
    const { description, amount, group, paidBy, splitType, splits } = req.body;
    let calculatedSplits = [];

    if (splitType === 'equal') {
      const numMembers = splits.length;
      const eachAmount = amount / numMembers;
      calculatedSplits = splits.map(userId => ({ user: userId, amount: eachAmount }));
    } else if (splitType === 'exact') {
      calculatedSplits = splits; // Assume amounts are provided
    } else if (splitType === 'percentage') {
      calculatedSplits = splits.map(split => ({ user: split.user, amount: (amount * split.percentage) / 100 }));
    }

    const expense = new Expense({ description, amount, group, paidBy, splitType, splits: calculatedSplits });
    await expense.save();

    // Update balances
    for (const split of calculatedSplits) {
      if (split.user.toString() !== paidBy.toString()) {
        await updateBalance(group, split.user, paidBy, split.amount);
      }
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expenses for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.groupId }).populate('paidBy splits.user');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to update balance
async function updateBalance(groupId, fromUser, toUser, amount) {
  // Try to find existing balance in same direction
  const existingBalance = await Balance.findOne({ group: groupId, fromUser, toUser });
  if (existingBalance) {
    existingBalance.amount += amount;
    await existingBalance.save();
    return;
  }

  // If there's an opposite balance, net them
  const opposite = await Balance.findOne({ group: groupId, fromUser: toUser, toUser: fromUser });
  if (opposite) {
    if (opposite.amount > amount) {
      opposite.amount -= amount;
      await opposite.save();
      return;
    } else if (opposite.amount === amount) {
      await Balance.deleteOne({ _id: opposite._id });
      return;
    } else {
      // opposite.amount < amount -> remove opposite and create remaining in current direction
      const remaining = amount - opposite.amount;
      await Balance.deleteOne({ _id: opposite._id });
      const balance = new Balance({ group: groupId, fromUser, toUser, amount: remaining });
      await balance.save();
      return;
    }
  }

  // No existing balances in either direction -> create new
  const balance = new Balance({ group: groupId, fromUser, toUser, amount });
  await balance.save();
}

module.exports = router;