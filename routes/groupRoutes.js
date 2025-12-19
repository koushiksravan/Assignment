const express = require('express');
const router = express.Router();
const Group = require('../models/Group');

// Create group
router.post('/', async (req, res) => {
  try {
    const { name, members, createdBy } = req.body;
    const group = new Group({ name, members, createdBy });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get groups for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).populate('members');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;