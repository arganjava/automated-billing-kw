var fs = require('fs');
var GoogleAuth = require('google-auth-library');
var path = require('path');
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = path.resolve('./config/');
var TOKEN_PATH = TOKEN_DIR + '/sheets.googleapis.com-nodejs-quickstart.json';


module.exports = {

  authorize: function (callback) {
    readCredential(function (oauth2Client) {
      fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
          var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
          });
          callback({ error: 'Authorize this app by visiting this url: ' + authUrl });
        } else {
          oauth2Client.credentials = JSON.parse(token);
          callback(oauth2Client);
        }
      });
    });
  },

  getNewToken: function (code, callback) {
    readCredential(function (oauth2Client) {
      getToken(oauth2Client, code);
    });
  }
};

function generateToken(code) {
  readCredential(function (oauth2Client) {
    getToken(oauth2Client, code);
  });
}

function readCredential(callback) {
  fs.readFile(path.resolve('./config/credentials.json'), function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    var credentials = JSON.parse(content);
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new GoogleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    callback(oauth2Client);
  });
}

function getToken(oauth2Client, code) {
  oauth2Client.getToken(code, function (err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    storeToken(token);
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
