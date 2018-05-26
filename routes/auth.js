var express = require('express');
var router = express.Router();

var passport = require('passport')

var YoutubeClient = require("../ToYoutube/client")



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('auth', { title: 'AutoArtist Auth' });
});

router.get('/ConnectYoutube', passport.authenticate('google', {
    scope: ['profile', "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get( '/oauth2callback', passport.authenticate( 'google', { successRedirect: '/upload', failureRedirect: '/'} ), function(req, res, next) {
});

// router.get('/ConnectYoutube', function(req, res, next) {
//   var url = YoutubeClient.oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube'
//   });
//   res.redirect(url)
// });

// router.get('/oauth2callback', function(req, res, next) {
// 	var code = req.query.code;
//   	YoutubeClient.oAuth2Client.getToken(code, function(err, tokens){
//   		YoutubeClient.oAuth2Client.credentials = tokens
//   		console.log(tokens);
//   	});
// 	res.redirect("/upload")
// });

module.exports = router;
