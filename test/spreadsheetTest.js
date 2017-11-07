let google = require('googleapis');
let authentication = require("../config/authentication");
var HashMap = require('hashmap');
const companyIndex = 1;
const itemIndex = 3;
const lineNUmberIndex = 2;
const incomingCallIndex = 7;
const outgoingCallIndex = 8;
const dataGBIndex = 13;

function listMajors(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: '17LnJ11pK9a5ppy7NVbhpA0XcjYuCc02Ovs44QHZnrIw',
    range: 'A2:AK',
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var rows = response.values;
    if (rows.length == 0) {
      console.log('No data found.');
    } else {
      console.log('Name, Major:');
      var map = new HashMap();
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        let numData = row[dataGBIndex].replace(',', '');
        let dataGB = parseFloat(numData) / 1000;
        let objMap = {
          lineNumber: row[lineNUmberIndex],
          item: row[itemIndex],
          dataGB: dataGB,
          incomingCall: row[incomingCallIndex],
          outgoingCall: row[outgoingCallIndex]
        };
        if (map.has(row[companyIndex])) {
          let arry = map.get(row[companyIndex]);
          arry.push(objMap);
          map.set(row[companyIndex], arry);
        } else {
          let arrMap = [];
          arrMap.push(objMap);
          map.set(row[companyIndex], arrMap);
        }
      }
      console.info(map);
    }
  });
}


checkAuthentication();

function checkAuthentication(callback) {
  authentication.authorize(function (auth) {
    if (auth.error) {
      console.info(auth.error);
    } else {
      console.info(auth)
      listMajors(auth);
    }
  });
}

