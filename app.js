var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var mongoose = require('mongoose')
var passport = require('passport')
var refresh = require('passport-oauth2-refresh')
var GoogleStrategy = require('passport-google-oauth20').Strategy

var session = require('express-session')
const MongoStore = require('connect-mongo')(session);

var index = require('./routes/index');
var upload = require('./routes/upload');
var auth = require('./routes/auth');
var account = require('./routes/account');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect("mongodb://localhost:27017/testDB")
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Connected to MongoDB")
});

var userSchema = new mongoose.Schema({
    _id: { type: String },
    access_token: String,
    refresh_token: String,
    name: String
}, { collection: "user" });

var User = db.model('User', userSchema);

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

var YOUR_CLIENT_ID = "318585109488-0ekddkkf50rdkjp9ljck3d4umj5gbn22.apps.googleusercontent.com";
var YOUR_CLIENT_SECRET = "_Gxul-9jzkKoabalEiv-PQby";
var YOUR_REDIRECT_URL = "http://localhost:3000/auth/oauth2callback";

var strategy = new GoogleStrategy({
    clientID:     YOUR_CLIENT_ID,
    clientSecret: YOUR_CLIENT_SECRET,
    callbackURL: YOUR_REDIRECT_URL,
    accessType: 'offline'
  },
  function(accessToken, refreshToken, profile, done) {
        process.nextTick( function() {
            User.findOne({ _id: profile.id }, function(err, res) {
                if (err)
                    return done(err);
                if (res) {
                    return done(null, res);
                } else {
                    var user = new User({
                        _id: profile.id,
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        name: profile.displayName
                    });
                    user.save(function(err) {
                        if (err)
                            return done(err);
                        return done(null, user);
                    });
                }
            })
        });
    }
)
passport.use(strategy);


app.use(session({
    secret: "COOKIE_SECRET",
    proxy: true,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/upload', upload);
app.use('/auth', auth);
app.use('/account', account);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
