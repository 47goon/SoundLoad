var express = require('express');
var router = express.Router();

var mongoose = require('mongoose')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'AutoArtist', authed: req.isAuthenticated() });
});

router.get('/logout', function (req, res){
  req.session.destroy(function (err) {
  	//req.logout()
  	res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
