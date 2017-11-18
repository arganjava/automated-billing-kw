let google = require('googleapis');
let authentication = require("../config/authentication");
var GoogleSpreadsheet = require("google-sheets-node-api");
var HashMap = require('hashmap');
var replaceall = require("replaceall");
const companyName = 'company';
const itemName = 'username';
const lineNUmberName = 'mobile';
const incomingCallName = 'incoming(min)';
const outgoingCallName = 'outgoing(min)';
const outgoingSMSName = 'smslocal(no.)';
const dataGBName = 'datalocal(mb)';

var self = module.exports = {
  listMajors: function (spreadId) {

    let companyIndex = 1;
    let itemIndex = 3;
    let lineNUmberIndex = 2;
    let incomingCallIndex = 7;
    let outgoingCallIndex = 8;
    let outgoingSMSIndex = 11;
    let dataGBIndex = 13;

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
            range: 'Usage Reports!A2:AK'
          }, function (err, response) {
            console.info(err);
            if (err) {
              reject(err);
              return new Error(err);
            } else {
              sheets.spreadsheets.get({
                auth: auth,
                spreadsheetId: spreadId
              }, function (err, response) {
                if (err) {
                  console.error(err);
                  reject(err);
                  return new Error(err);
                }
                var cycle = JSON.stringify(response.properties.title);
                cycle = cycle.replace('"', '').replace('"', '');


                sheets.spreadsheets.values.get({
                  auth: auth,
                  spreadsheetId: spreadId,
                  range: 'For Calculation!A1:AK',
                }, function (err, response) {
                  if (err) {
                    console.log('The API returned an error: ' + err);
                    reject(err);
                    return new Error(err);
                  } else {
                    var rows = response.values[0];
                    if (rows === null || rows.length === 0 || rows === undefined) {
                      return new Error('No data found.');
                    } else {
                      for (var i = 0; i < rows.length; i++) {
                        var row = rows[i];
                        row = replaceall('\n', ' ', row);
                        row = replaceall(' ', '', row);
                        row = row.toLowerCase();
                        row = row.trim();
                        if (row.indexOf(companyName) > -1) {
                          companyIndex = i;
                        } else if (row.indexOf(itemName) > -1) {
                          itemIndex = i;
                        } else if (row.indexOf(lineNUmberName) > -1) {
                          lineNUmberIndex = i;
                        } else if (row.indexOf(incomingCallName) > -1) {
                          incomingCallIndex = i;
                        } else if (row.indexOf(outgoingCallName) > -1) {
                          outgoingCallIndex = i;
                        } else if (row === outgoingSMSName) {
                          outgoingSMSIndex = i;
                        } else if (row === dataGBName) {
                          dataGBIndex = i;
                        }
                      }

                      sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: spreadId,
                        range: 'For Calculation!A2:AK'
                      }, function (err, response) {
                        if (err) {
                          console.log('The API returned an error: ' + err);
                          reject(err);
                          return new Error(err);
                        } else {
                          var rows = response.values;
                          if (rows.length === 0) {
                            return new Error('No data found.');
                          } else {
                            var map = new HashMap();
                            var range = response.range.split('!');
                            var sheet = range[0].replace("'", "").replace("'", " ");
                            for (var i = 0; i < rows.length; i++) {
                              var row = rows[i];
                              let numData = row[dataGBIndex] !== undefined ? row[dataGBIndex].replace(',', '') : 0.00;
                              let dataGB = parseFloat(numData) / 1000;
                              let objMap = {
                                lineNumber: row[lineNUmberIndex] !== undefined ? row[lineNUmberIndex] : " ",
                                item: row[itemIndex] !== undefined ? row[itemIndex] : " ",
                                dataGB: dataGB.toFixed(3),
                                incomingCall: row[incomingCallIndex] !== undefined ? row[incomingCallIndex] : 0.00,
                                outgoingCall: row[outgoingCallIndex] !== undefined ? row[outgoingCallIndex] : 0.00,
                                outgoingSMS: row[outgoingSMSIndex] !== undefined ? row[outgoingSMSIndex] : 0.00
                              };
                              let company = row[companyIndex];
                              if (company !== undefined) {
                                company = company.trim();
                              }
                              if (map.has(company)) {
                                let arry = map.get(company);
                                arry.push(objMap);
                                map.set(company, arry);
                              } else {
                                let arrMap = [];
                                arrMap.push(objMap);
                                map.set(company, arrMap);
                              }
                            }
                            var returnJson = {data: map, cycle: cycle};
                            resolve(returnJson);
                          }
                        }
                      });
                    }
                  }
                });
              });
            }

          });

        }

      });
    }).catch(function (err) {
      // console.info(err)
      return new Error(err);
    });

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

  },
  checkSheetId: function (spreadId, callback) {
    authentication.authorize(function (auth) {
      if (auth.error) {
        callback(auth.error, null);
      } else {
        var sheets = google.sheets('v4');
        var request = {
          auth: auth,
          spreadsheetId: spreadId,
          range: 'For Calculation!A2:AK',
        }


        sheets.spreadsheets.values.get(request, function (err, response) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, response);
          }
        });
      }
    });
  },

  checkCalculationSheet: function (spreadId, callback) {
    authentication.authorize(function (auth) {
      if (auth.error) {
        callback(auth.error, null);
      } else {
        var sheets = google.sheets('v4');
        var request = {
          auth: auth,
          spreadsheetId: spreadId,
          range: 'For Calculation!A2:AK',
        }
        sheets.spreadsheets.values.get(request, function (err, response) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, response);
          }
        });
      }
    });
  },
  checkUsageReportSheets: function (spreadId, callback) {
    authentication.authorize(function (auth) {
      if (auth.error) {
        callback(auth.error, null);
      } else {
        var sheets = google.sheets('v4');
        var request = {
          auth: auth,
          spreadsheetId: spreadId,
          range: 'Usage Reports!A2:AK',
        }
        sheets.spreadsheets.values.get(request, function (err, response) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, response);
          }
        });
      }
    });
  },
  createUsageReport: function (spreadId, callback) {
    authentication.authorize(function (auth) {
      if (auth.error) {
        callback(auth.error, null);
      } else {
        var sheets = google.sheets('v4');
        var request = {
          auth: auth,
          spreadsheetId: spreadId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: "Usage Reports"
                  }
                }
              }
            ]
          }
        }
        sheets.spreadsheets.batchUpdate(request, function (err, response) {
          if (err) {
            callback(err, null);
          } else {
            var data = [['Company', 'Link', 'Text for Invoice', 'Generate by', 'Update at']]
            self.updateSheetAndRow(spreadId, 1, data).then(function (response) {
              callback(null, response);
            }).catch(function (err) {
              callback(err, null);
            });
          }
        });
      }
    });
  }
}

