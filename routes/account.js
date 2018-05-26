var express = require('express');
var account = express.Router();

var passport = require('passport')

var mongoose = require('mongoose')

function userLogged(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/auth');
}

/* GET home page. */
account.get('/', userLogged, function(req, res, next) {
  res.render('account', { title: 'AutoArtist', name: req.user.name, authed: req.isAuthenticated() });
});

module.exports = account;
