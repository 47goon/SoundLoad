const {google} = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

// get these from https://console.developers.google.com/apis/credentials (don't forget to activate Youtube API)
var YOUR_CLIENT_ID = "318585109488-0ekddkkf50rdkjp9ljck3d4umj5gbn22.apps.googleusercontent.com";
var YOUR_CLIENT_SECRET = "_Gxul-9jzkKoabalEiv-PQby";
var YOUR_REDIRECT_URL = "http://localhost:3000/auth/oauth2callback";

class Client{
	constructor(height, width) {
	    this.oAuth2Client = new OAuth2Client(
          YOUR_CLIENT_ID ,
          YOUR_CLIENT_SECRET,
          YOUR_REDIRECT_URL
        );
	}
}

module.exports = new Client()