const Post = require('../models/Post');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Access denied: Please dock to StarNet first');
    return res.redirect('/login');
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) {
    req.flash('error', 'Transmission not found in our database');
    return res.redirect('/posts');
  }
  if (!post.author.equals(req.user._id)) {
    req.flash('error', 'Access denied: Insufficient clearance level');
    return res.redirect(`/posts/${id}`);
  }
  next();
}; 