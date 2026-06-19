const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:userId', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/recommendations.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.json({ 
        recommendations: [],
        message: 'No recommendations yet — add more orders to generate suggestions'
      });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const allRules = JSON.parse(raw);

    // Get this user's current fridge items to personalise
    const Item = require('../models/Item');
    const userItems = await Item.find({ 
      userId: req.params.userId, 
      status: 'active' 
    }).select('name');
    
    const userItemNames = userItems.map(i => i.name.toLowerCase());

    // Filter rules relevant to this user's current fridge
    const relevant = allRules.filter(rule =>
      rule.if_you_have.some(item => 
        userItemNames.includes(item.toLowerCase())
      )
    );

    // If no relevant rules, return top general recommendations
    const result = relevant.length > 0 ? relevant.slice(0, 5) : allRules.slice(0, 5);

    res.json({ recommendations: result });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

module.exports = router;