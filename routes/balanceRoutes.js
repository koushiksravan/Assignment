const express = require('express');
const router = express.Router();
const Balance = require('../models/Balance');

// Get balances for a user in a group
router.get('/user/:userId/group/:groupId', async (req, res) => {
  try {
    const { userId, groupId } = req.params;
    const owes = await Balance.find({ group: groupId, fromUser: userId }).populate('toUser');
    const owed = await Balance.find({ group: groupId, toUser: userId }).populate('fromUser');
    res.json({ owes, owed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settle balance
router.post('/settle', async (req, res) => {
  try {
    const { groupId, fromUser, toUser, amount } = req.body;
    const balance = await Balance.findOne({ group: groupId, fromUser, toUser });
    if (balance) {
      balance.amount -= amount;
      if (balance.amount <= 0) {
        await Balance.deleteOne({ _id: balance._id });
      } else {
        await balance.save();
      }
    }
    res.json({ message: 'Balance settled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simplify balances (basic implementation)
router.post('/simplify/:groupId', async (req, res) => {
  try {
    const balances = await Balance.find({ group: req.params.groupId }).populate('fromUser toUser');
    const netBalances = {};

    // Calculate net balance for each user
    balances.forEach(b => {
      const from = b.fromUser._id.toString();
      const to = b.toUser._id.toString();
      netBalances[from] = (netBalances[from] || 0) - b.amount;
      netBalances[to] = (netBalances[to] || 0) + b.amount;
    });

    // Now, simplify: users with negative net owe (debtors) to those with positive net (creditors)
    const creditors = [];
    const debtors = [];

    Object.keys(netBalances).forEach(user => {
      if (netBalances[user] < 0) debtors.push({ user, amount: -netBalances[user] });
      else if (netBalances[user] > 0) creditors.push({ user, amount: netBalances[user] });
    });

    // Sort
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplified = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debt = Math.min(debtors[i].amount, creditors[j].amount);
      simplified.push({
        from: debtors[i].user,
        to: creditors[j].user,
        amount: debt
      });
      debtors[i].amount -= debt;
      creditors[j].amount -= debt;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    res.json(simplified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;