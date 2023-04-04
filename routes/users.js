const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Category = require('../models/category');
const catchAsync = require('../utils/CatchAsync');
const { isLoggedIn } = require('../middleware');
const ExpressError = require('../utils/ExpressError');

router.get('/register', (req, res) => {
    res.render('users/register');
})
router.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { name, email, username, password } = req.body.user;
        const newUser = new User({ email, username, name });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (error) => {
            if (error) return next(error);
            req.flash('success', 'Anda berhasil terdaftar.');
            res.redirect('/categories');
        })

    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register');
    }
}));
router.get('/login', (req, res) => {
    res.render('users/login');
})
router.post('/login', passport.authenticate('local',
    { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }),
    catchAsync(async (req, res, next) => {
        req.flash('success', 'Anda berhasil login.');
        const redirectUrl = req.session.lastPath || '/categories';
        delete req.session.lastPath;
        res.redirect(redirectUrl);
    }));

router.get('/logout', isLoggedIn, catchAsync(async (req, res, next) => {
    req.logout((error) => {
        if (error) return next(error)
        req.flash('success', "Anda berhasil logout.");
        res.redirect('/categories');
    });
}))

router.get('/:userId', catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const posts = await Post.find({ author: user }).populate('comments');
    const categories = await Category.find({ author: user });
    let totCategories = Object.keys(categories).length;
    let totPosts = 0;
    for (let category of categories) {
        let post = Object.keys(category.posts).length;
        totPosts += post;
    };
    let authorCommentsObj = []
    for (let p of posts) {
        if (p.comments) {
            for (let c of p.comments) {
                authorCommentsObj.push(c.author)
            }
        }
    }
    const commentsCountedObj = await Comment.aggregate([
        { $match: { 'author': { $in: authorCommentsObj } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
    ])
    // console.log(commentsCountedObj)
    let totAnswerer = commentsCountedObj.length;
    let totAnswer = 0;
    for (let a of commentsCountedObj) {
        totAnswer += parseInt(a.count);
    }
    // console.log(totAnswerer)
    // console.log(totAnswer)
    res.render('users/show', { user, categories, totCategories, totPosts, totAnswerer, totAnswer });
}))

module.exports = router;