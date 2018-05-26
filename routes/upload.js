var express = require('express');
var path = require('path');
var fs = require('fs')
var ffmpeg = require('fluent-ffmpeg');
var multer   =  require( 'multer' );

const kue = require('kue');
const queue = kue.createQueue();

var GoogleStrategy = require('passport-google-oauth20').Strategy
var refresh = require('passport-oauth2-refresh');

var SC = require("../lib/soundcloud.js")

const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp')
  },
  filename: function (req, file, cb) {
    let extArray = file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];
    cb(null, file.originalname + '-' + Date.now()+ '.' + extension)
  }
})
const uploadMult = multer({ storage: storage })
var upload = express.Router();

function userLogged(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/auth');
}

upload.get('/', userLogged, function(req, res, next) {
	res.render('upload', { title: 'AutoArtist', name: req.user.name, authed: true });
});

var YOUR_CLIENT_ID = "318585109488-0ekddkkf50rdkjp9ljck3d4umj5gbn22.apps.googleusercontent.com";
var YOUR_CLIENT_SECRET = "_Gxul-9jzkKoabalEiv-PQby";
var YOUR_REDIRECT_URL = "http://localhost:3000/auth/oauth2callback";

var oauth2Client = new OAuth2(
    YOUR_CLIENT_ID,
    YOUR_CLIENT_SECRET,
    YOUR_REDIRECT_URL
);

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
refresh.use(strategy);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

function uploadVideo(videoPath, userData, videoData){
	if (videoData.Fade_In == 'true'){
		console.log("DDDD")
		return
	}
	
	refresh.requestNewAccessToken('google', userData.refresh_token, function(err, accessToken, refreshToken) {
		console.log("Getting new access_token for " + userData.name)
		userData.access_token = accessToken

		oauth2Client.credentials = {
		    access_token: userData.access_token,
		    refresh_token: userData.refresh_token
		};

		const youtube = google.youtube({
		  version: 'v3',
		  auth: oauth2Client
		});

		const req = youtube.videos.insert({
		    part: 'id,snippet,status',
		    notifySubscribers: false,
		    resource: {
		      snippet: {
		        title: videoData.title,
		        description: videoData.description
		      },
		      status: {
		        privacyStatus: 'private'
		      }
		    },
		    media: {
		    	body: fs.createReadStream(videoPath)
		    }
		  }, (err, data) => {
		    if (err) {
		      throw err;
		    }
		    console.log(data);

		    // var User = require('mongoose').model('User')
		    // User.findOne({_id: userData._id }).remove().exec();

		    fs.unlink(videoPath, function(err){ if(err) return console.log(err); });  
		  });
	});
}

function processSongToVideoJob(data, done) {
	var pic = path.join(path.resolve(__dirname, '..'), "Quene", data.data.VideoFileName )
	var song = path.join(path.resolve(__dirname, '..'), "Quene", data.data.SongFileName )
	var startTime = process.hrtime();
	ffmpeg.ffprobe(song, function(err, metadata) {
		if (metadata.format.duration > 0){
			var proc = ffmpeg(pic)
			.videoBitrate('512k')
    		.videoCodec('libx264')
			.size('1920x1080')
			.autopad()
		  	.loop(metadata.format.duration)
		  	.fps(1)
		 	.addInput(song)
		  	.on('end', function() {
		  		var user = data.data.UserData
		  		var videoData = data.data.VideoData
		    	console.log('file has been converted succesfully');
		    	console.log(user.name + " is now going to start uploading")
		    	var elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
    			console.log('Function took ' + elapsedSeconds + ' seconds');
    			fs.unlink(pic,function(err){ if(err) return console.log(err); });  
    			fs.unlink(song,function(err){ if(err) return console.log(err); });  
    			setTimeout(function(){
    				uploadVideo( path.join(path.resolve(__dirname, '..'), "CompleteVideos", data.data.SongFileName + ".mp4" ), user, videoData)
    			}, 5000)
    			
    			done()
		  	})
		  	.on('error', function(err) {
		    	console.log('an error happened: ' + err.message);
		  	})
		  	.on('progress', function(progress) {
		  		console.log('Processing: ' + progress.frames + '% done');
		  	})
		  	.save(path.join(path.resolve(__dirname, '..'), "CompleteVideos", data.data.SongFileName + ".mp4" ));
		}else{
			console.log("NOPE")
		}
  	});
}

queue.process('SongToVideo', 10,function(job, done){
	processSongToVideoJob(job.data, done)
});

function createSongToVideoJob(SongFileName, VideoFileName, UserData, VideoData){
	let job = queue.create('SongToVideo', {
		from: 'MainApplication',
		type: 'SongToVideoJob',
		data: {
			SongFileName: SongFileName,
			VideoFileName: VideoFileName,
			UserData: UserData,
			VideoData: VideoData
		}
	}).removeOnComplete(true).save((err) => {
		if (err) throw err;
		console.log(`SongToVideo Job ${job.id} saved to the queue.`);
		//Moving Song
		fs.rename(path.join(path.resolve(__dirname, '..'), "tmp", SongFileName), path.join(path.resolve(__dirname, '..'), "Quene", SongFileName) , function (err) {
		  	if (err) throw err
		})
		//Moving Video
		fs.rename(path.join(path.resolve(__dirname, '..'), "tmp", VideoFileName), path.join(path.resolve(__dirname, '..'), "Quene", VideoFileName) , function (err) {
		  	if (err) throw err
		})
		
	});
}

// uploadMult.single( 'file' ), 
upload.post( '/', userLogged, uploadMult.array('files', 2) , function( req, res, next ) {
	var songFileName = ""
	var videoFileName = ""
	for (i = 0; i < req.files.length; i++) { 
    	if (req.files[i].mimetype == "audio/mp3"){
    		songFileName = req.files[i].filename
    	}else{
    		videoFileName = req.files[i].filename
    	}
	}

	var User = require('mongoose').model('User')
	User.findOne({ _id: req.user._id }, function(err, user) {
		if (user) {
			createSongToVideoJob(songFileName, videoFileName, user, req.body.VideoData)	
		}
	})
  	return res.status( 200 ).send( req.file );
});

function parseHrtimeToSeconds(hrtime) {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
}


module.exports = upload;
