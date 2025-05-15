const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Home page - Show feed
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author')
      .populate({
        path: 'comments',
        populate: {
          path: 'author'
        }
      })
      .sort({ createdAt: -1 });
    res.render('index', { posts });
  } catch (e) {
    req.flash('error', 'Something went wrong');
    res.redirect('/');
  }
});

module.exports = router;
