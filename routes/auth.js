const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const Post = require('../models/Post');
const { isLoggedIn } = require('../middleware/index');

router.get('/login', (req, res) => {
    res.render('login'); // Make sure views/login.ejs exists
  });
  
  router.get('/signup', (req, res) => {
    res.render('signup'); // Make sure views/signup.ejs exists
  });

  
// Signup page
router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get('/submit', (req, res) => {
  res.render('submit');
});

router.get('/explore', async (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = {};
    
    // Add search functionality
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Add sorting
    let sortOption = { createdAt: -1 }; // Default sort by recent
    if (sort === 'popular') {
      sortOption = { likes: -1 };
    }
    
    const posts = await Post.find(query)
      .populate('author')
      .sort(sortOption);
      
    res.render('explore', { posts, search, sort });
  } catch (e) {
    req.flash('error', 'Something went wrong');
    res.redirect('/');
  }
});
  

// Signup logic
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/signup');
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login logic
router.post('/login', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/login'
}), (req, res) => {
  req.flash('success', 'Welcome back, Commander!');
  const redirectUrl = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Safe travels, Commander!');
    res.redirect('/');
  });
});

// Profile routes
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers following');
    const posts = await Post.find({ author: req.params.id })
      .populate('author')
      .sort({ createdAt: -1 });
    res.render('profile', { user, posts });
  } catch (e) {
    req.flash('error', 'Commander not found in our database');
    res.redirect('/');
  }
});

// Update profile
router.put('/profile/:id', isLoggedIn, async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bio },
      { new: true }
    );
    req.flash('success', 'Mission log updated successfully!');
    res.redirect(`/profile/${user._id}`);
  } catch (e) {
    req.flash('error', 'Failed to update mission log');
    res.redirect(`/profile/${req.params.id}`);
  }
});

// Follow/Unfollow user
router.post('/follow/:id', isLoggedIn, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);
    
    if (!userToFollow.followers.includes(req.user._id)) {
      await userToFollow.updateOne({ $push: { followers: req.user._id }});
      await currentUser.updateOne({ $push: { following: req.params.id }});
      req.flash('success', `Connected to Commander ${userToFollow.username}'s fleet`);
    } else {
      await userToFollow.updateOne({ $pull: { followers: req.user._id }});
      await currentUser.updateOne({ $pull: { following: req.params.id }});
      req.flash('success', `Disconnected from Commander ${userToFollow.username}'s fleet`);
    }
    res.redirect(`/profile/${req.params.id}`);
  } catch (e) {
    req.flash('error', 'Connection protocol failed');
    res.redirect('/');
  }
});

router.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Safe travels, Commander!');
    res.redirect('/');
  });
});

module.exports = router;
