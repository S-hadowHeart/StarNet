const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { isLoggedIn, isAuthor } = require('../middleware/index');

// Get all posts (feed)
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
    res.render('posts/index', { posts });
  } catch (e) {
    req.flash('error', 'Signal interference detected');
    res.redirect('/');
  }
});

// Show new post form
router.get('/new', isLoggedIn, (req, res) => {
  res.render('posts/new');
});

// Create new post
router.post('/', isLoggedIn, async (req, res) => {
  try {
    const { title, content, image, tags } = req.body;
    
    // Validate title
    if (!title || title.trim().length < 3) {
      req.flash('error', 'Signal title must be at least 3 characters to establish transmission');
      return res.redirect('/posts/new');
    }
    
    if (title.length > 200) {
      req.flash('error', 'Signal title exceeds maximum transmission bandwidth');
      return res.redirect('/posts/new');
    }
    
    // Validate content
    if (!content || content.trim().length === 0) {
      req.flash('error', 'Signal content cannot be empty');
      return res.redirect('/posts/new');
    }
    
    // Validate image URL if provided
    if (image && !image.startsWith('http')) {
      req.flash('error', 'Invalid cosmic image URL format');
      return res.redirect('/posts/new');
    }
    
    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) : [];
    
    const post = new Post({ 
      title: title.trim(),
      content: content.trim(),
      image,
      tags: tagArray
    });
    post.author = req.user._id;
    await post.save();
    req.flash('success', 'Transmission successfully launched!');
    res.redirect('/');
  } catch (e) {
    console.error('Transmission error:', e);
    if (e.name === 'ValidationError') {
      req.flash('error', 'Invalid transmission data: ' + Object.values(e.errors).map(err => err.message).join(', '));
    } else {
      req.flash('error', 'Transmission failed: ' + e.message);
    }
    res.redirect('/posts/new');
  }
});

// Show single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author')
      .populate({
        path: 'comments',
        populate: {
          path: 'author'
        }
      });
    if (!post) {
      req.flash('error', 'Transmission not found in our database');
      return res.redirect('/posts');
    }
    res.render('posts/show', { post });
  } catch (e) {
    req.flash('error', 'Signal interference detected');
    res.redirect('/posts');
  }
});

// Show edit form
router.get('/:id/edit', isLoggedIn, isAuthor, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Transmission not found');
      return res.redirect('/posts');
    }
    res.render('posts/edit', { post });
  } catch (e) {
    req.flash('error', 'Failed to access transmission editor');
    res.redirect('/posts');
  }
});

// Edit post
router.put('/:id', isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, tags } = req.body;

    // Validate title
    if (!title || title.trim().length < 3) {
      req.flash('error', 'Signal title must be at least 3 characters long');
      return res.redirect(`/posts/${id}/edit`);
    }
    
    if (title.length > 200) {
      req.flash('error', 'Signal title cannot exceed 200 characters');
      return res.redirect(`/posts/${id}/edit`);
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      req.flash('error', 'Signal content cannot be empty');
      return res.redirect(`/posts/${id}/edit`);
    }

    // Validate image URL if provided
    if (image && !image.startsWith('http')) {
      req.flash('error', 'Please provide a valid cosmic image URL starting with http:// or https://');
      return res.redirect(`/posts/${id}/edit`);
    }

    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) : [];

    const post = await Post.findByIdAndUpdate(id, {
      title: title.trim(),
      content: content.trim(),
      image,
      tags: tagArray
    }, { new: true });

    req.flash('success', 'Transmission successfully updated!');
    res.redirect(`/posts/${post._id}`);
  } catch (e) {
    console.error('Transmission update error:', e);
    if (e.name === 'ValidationError') {
      req.flash('error', 'Invalid transmission data: ' + Object.values(e.errors).map(err => err.message).join(', '));
    } else {
      req.flash('error', 'Failed to update transmission: ' + e.message);
    }
    res.redirect(`/posts/${req.params.id}/edit`);
  }
});

// Delete post
router.delete('/:id', isLoggedIn, isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Transmission successfully terminated');
    res.redirect('/');
  } catch (e) {
    req.flash('error', 'Failed to terminate transmission');
    res.redirect('/');
  }
});

// Like/Unlike post
router.post('/:id/like', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.user._id)) {
      await post.updateOne({ $push: { likes: req.user._id }});
      req.flash('success', 'Quantum resonance established!');
    } else {
      await post.updateOne({ $pull: { likes: req.user._id }});
      req.flash('success', 'Quantum resonance terminated');
    }
    res.redirect(`/posts/${post._id}`);
  } catch (e) {
    req.flash('error', 'Signal interference detected');
    res.redirect('/');
  }
});

// Add comment
router.post('/:id/comments', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Transmission not found in our database');
      return res.redirect('/');
    }
    if (!req.body.content || req.body.content.trim().length === 0) {
      req.flash('error', 'Cosmic echo cannot be empty');
      return res.redirect(`/posts/${req.params.id}`);
    }
    const comment = {
      content: req.body.content,
      author: req.user._id
    };
    post.comments.push(comment);
    await post.save();
    req.flash('success', 'Cosmic echo transmitted successfully!');
    res.redirect(`/posts/${post._id}`);
  } catch (e) {
    console.error('Failed to transmit echo:', e);
    req.flash('error', 'Failed to transmit cosmic echo: ' + e.message);
    res.redirect(`/posts/${req.params.id}`);
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', isLoggedIn, async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    const comment = post.comments.id(commentId);
    if (!comment.author.equals(req.user._id)) {
      req.flash('error', 'Access denied: Insufficient clearance level');
      return res.redirect(`/posts/${id}`);
    }
    post.comments.pull(commentId);
    await post.save();
    req.flash('success', 'Cosmic echo successfully terminated');
    res.redirect(`/posts/${id}`);
  } catch (e) {
    req.flash('error', 'Failed to terminate cosmic echo');
    res.redirect('/posts');
  }
});

module.exports = router; 