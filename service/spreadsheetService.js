let google = require('googleapis');
let authentication = require("../config/authentication");
var GoogleSpreadsheet = require("google-sheets-node-api");
var HashMap = require('hashmap');
const companyIndex = 1;
const itemIndex = 3;
const lineNUmberIndex = 2;
const incomingCallIndex = 7;
const outgoingCallIndex = 8;
const outgoingSMSIndex = 11;
const dataGBIndex = 13;

module.exports = {
  listMajors: function (spreadId) {
    return new Promise(function (resolve, reject) {
      authentication.authorize(function (auth) {
        if (auth.error) {
          // callback(new Error(auth.error));
          reject(auth);
        } else {
          var sheets = google.sheets('v4');
          sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: spreadId,
            range: 'A2:AK',
          }, function (err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
              reject(err)
            }
            var rows = response.values;
            if (rows.length == 0) {
              console.log('No data found.');
            } else {
              var map = new HashMap();
              var range = response.range.split('!');
              var sheet = range[0].replace("'", "").replace("'", " ");
              var cycle = sheet + 'Cycle Usage Report'
              for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                let numData = row[dataGBIndex].replace(',', '');
                let dataGB = parseFloat(numData) / 1000;
                let objMap = {
                  lineNumber: row[lineNUmberIndex],
                  item: row[itemIndex],
                  dataGB: dataGB.toFixed(3),
                  incomingCall: row[incomingCallIndex],
                  outgoingCall: row[outgoingCallIndex],
                  outgoingSMS: row[outgoingSMSIndex]
                };
                let company = row[companyIndex] + '^' + cycle;
             //   if (row[companyIndex] === 'Aspectus' || row[companyIndex] === 'CA TPTN') {
                  if (map.has(company)) {
                    let arry = map.get(company);
                    arry.push(objMap);
                    map.set(company, arry);
                  } else {
                    let arrMap = [];
                    arrMap.push(objMap);
                    map.set(company, arrMap);
                  }
               // }

              }
              resolve(map);
            }
          });
        }

      });
    }).catch(function (err) {
      // console.info(err)
      return err;
    })

  },
  updateSheetAndRow: function (spreadId, indexUpdateRowSheet, data) {

    return new Promise(function (resolve, reject) {
      authentication.authorize(function (auth) {
        if (auth.error) {
          reject(auth.error);
        } else {
          var sheets = google.sheets('v4');
          var request = {
            "auth": auth,
            "spreadsheetId": spreadId,
            "range": 'Usage Reports!A' + indexUpdateRowSheet + ':AK',
            resource: {values: data},
            valueInputOption: "USER_ENTERED"

          }
          sheets.spreadsheets.values.update(request, function (err, response) {
            console.log('Update Row Info', err, response);
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          });
        }
      });
    }).catch(function (err) {
      // console.info(err)
      return err;
    });

  }

}

