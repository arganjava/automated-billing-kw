"use strict"
let pdf = require('handlebars-pdf')
var fs = require('fs');
var Promise = require('bluebird');
let path = require('path')
let reportPath = "./config/report/";
let spreadsheetService = require('../service/spreadsheetService');
var Dropbox = require('dropbox');
var dropboxAuth = JSON.parse(fs.readFileSync(path.resolve('./config/dropboxAuth.json')))
var rootDropboxFolder = '/Usage Report/';
var moment = require('moment');
var Client = require('node-rest-client').Client;
var q = require('q');
var client = new Client();
var shortenerGoogleKey = 'AIzaSyAMI4AI8jK_9BJF2rp6LZUd8PjwO44SSjw';
var indexUpdateRowSheet = 2;
var googleLinkToken = "ya29.GlvqBIRGkDTUYPKT1wl5_N9IfUCfhUoxNr9ekAVWu7SOqLLVJgTXNLnXTdTens08XZJsV_FgWgu4p0TCE0Rp5bfzOXXWrzWWv66932wIDU1Xf3oNUc08l-hlq_Zr"


function startGenerateReport(spreadId, callback) {

  spreadsheetService.listMajors(spreadId, function (err, res) {
    if (!err) {
      return res;
    }
  }).then(function (res) {
    insertFile(res).then(function (dataParam) {
      console.info('After insertFile ' + dataParam)
      insertContents(spreadId, dataParam).then(function (container) {
        console.info('After insertContents ' + container)
        uploadFileToDropbox(spreadId, container).then(function (results) {
          console.info('After uploadFileToDropbox ' + results)
          generateDropboxLink(spreadId, results).then(function (links) {
            console.info('After generateDropboxLink ' + links)
            generateGoogleLink(spreadId, links).then(function (shortLinks) {
              console.info('After generateDropboxLink ' + shortLinks)
              updateRowSheet(spreadId, shortLinks, function (sheet) {
                callback(sheet);
              })
            })
          })
        })

      })
    })
  }).catch(function (err) {
    return err;
  });
}

module.exports = {
  callService: function (spreadId, callback) {
    startGenerateReport(spreadId, function (end) {
      callback(end);
    });
  },
  callContent: function (spreadId, callback) {
    spreadsheetService.listMajors(spreadId).then(function (res) {
      if (res instanceof Error) {
        callback(res);
      }
      insertFile(res).then(function (dataParam) {
        console.info('After insertFile ')
        insertContents(spreadId, dataParam).then(function (container) {
          console.info('After insertContents ');
          callback(container);
        });
      });
    }).catch(function (err) {
      return err;
    });
  },
  callEachService: function (spreadId, index, container, username, timeGenerate, callback) {
    console.info(JSON.stringify(container._settledValueField.nameDropboxFile));
    uploadEachFileToDropbox(spreadId, container).then(function (results) {
      process.nextTick(() => {
        console.info('After uploadFileToDropbox ' + results);
      })
      if (results instanceof Error) {
        var fileGenerate = JSON.stringify(container._settledValueField);
        console.log("nameDropboxFile : " + fileGenerate.nameDropboxFile);
        console.log("filename : " + fileGenerate.filename);
        console.log("response : " + fileGenerate.response);
        console.log("indexSheet : " + index);
      }
      if (!results[0]._settledValueField.response) {
        callback(results);
      } else {
        generateEachDropboxLink(spreadId, results).then(function (links) {
          process.nextTick(() => {
            console.info('After generateDropboxLink ' + JSON.stringify(links));
          })
          if (links instanceof Error) {
            var fileGenerate = JSON.stringify(container._settledValueField);
            console.log("nameDropboxFile : " + fileGenerate.nameDropboxFile);
            console.log("filename : " + fileGenerate.filename);
            console.log("response : " + fileGenerate.response);
            console.log("indexSheet : " + index);
          }
          generateEachGoogleLink(spreadId, links).then(function (shortLinks) {
            process.nextTick(() => {
              console.info('After generateDropboxLink ' + JSON.stringify(shortLinks));
            })
            if (shortLinks instanceof Error) {
              var fileGenerate = JSON.stringify(container._settledValueField);
              console.log("nameDropboxFile : " + fileGenerate.nameDropboxFile);
              console.log("filename : " + fileGenerate.filename);
              console.log("response : " + fileGenerate.response);
              console.log("indexSheet : " + index);
            }
            updateEachRowSheetWithIndex(spreadId, index, shortLinks, username, timeGenerate, function (sheet) {
              if (!sheet.error) {
                process.nextTick(function () {
                  callback(sheet);
                });
              } else {
                callback(sheet);
              }
            });
          }).catch(function (e) {
            callback(e);
          });
        }).catch(function (e) {
          callback(e);
        });

      }
    }).catch(function (e) {
      callback(e);
    });
  }
}


//startGenerateReport('1fHZu9Z9ZStCe7icFEGpKwHLgJKCJWqzYzsUDYQKJ6qA');

//updateRowSheet('1fHZu9Z9ZStCe7icFEGpKwHLgJKCJWqzYzsUDYQKJ6qA')

function generateDropboxLink(spreadId, parameters) {
  var promises = [];
  return Promise.try(function () {
    parameters.forEach(function (object, i) {
      var file = object._settledValueField;
      promises.push(new Promise(function (resolve, reject) {
        var args = {
          data: {
            path: file.response.path_display, settings: {
              "requested_visibility": "public"
            }
          },
          headers: {
            "Content-Type": "application/json", "Authorization": "Bearer " + dropboxAuth.access_token
          }
        };
        client.post("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", args, function (data, response) {
          console.info('generateDropboxLink ' + JSON.stringify(data.error));
          data.companyCycle = file.companyCycle;
          if (!data.error) {
            resolve(data);
          } else {
            reject(response);
          }
        });
      }))
    })
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
  })
}

function generateGoogleLink(spreadId, paramLinks) {


  return Promise.try(function () {
    var promises = [];
    paramLinks.forEach(function (object, i) {
      var file = object._settledValueField;
      var args = {
        data: {
          longUrl: file.url,
          "Authorization": "Bearer " + googleLinkToken
        },
        headers: {
          "Content-Type": "application/json"
        }
      };
      promises.push(new Promise(function (resolve, reject) {
        client.post("https://www.googleapis.com/urlshortener/v1/url?key=" + shortenerGoogleKey, args, function (data, response) {
          console.info('generateGoogleLink ' + JSON.stringify(data.error))
          data.companyCycle = file.companyCycle;
          if (!data.error) {
            resolve(data);
          } else {
            reject(response);
          }
        });
      }))
    })
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
  })
}

function updateRowSheetWithIndex(spreadId, index, objectLinks, cb) {
  let data = [];
  for (var i = 0; i < objectLinks.length; i++) {
    var object = objectLinks[i];
    var link = object._settledValueField;
    if (link.companyCycle !== undefined) {
      var companyCycle = link.companyCycle.replace('^', ' ')
      data.push(["", "", companyCycle + ' ' + link.id]);
    }
  }
  spreadsheetService.updateSheetAndRow(spreadId, index, data).then(function (resSheet) {
    cb(resSheet);
  });
}

function updateRowSheet(spreadId, objectLinks, cb) {
  let data = [];
  for (var i = 0; i < objectLinks.length; i++) {
    var object = objectLinks[i];
    var link = object._settledValueField;
    if (link.companyCycle !== undefined) {
      var companyCycle = link.companyCycle.replace('^', ' ')
      data.push(["", "", companyCycle + ' ' + link.id]);
    }
  }
  spreadsheetService.updateSheetAndRow(spreadId, indexUpdateRowSheet, data).then(function (resSheet) {
    cb(resSheet);
  });
}

function insertFile(resParam) {
  var timeGenerate = moment().format('DD MMM YYYY')
  var pathDir  = moment().format('DD:MM:YY - hh:mm:ss:SSSS');
var timeDirectory = moment().format('DD:MM:YY - HH:mm:ss');
var month = moment().format('MMM');

  var index = 0;
  return Promise.try(function () {
    let array = [];
    resParam.data.forEach(function (value, key) {
      index++;
      console.info("KEY : " + JSON.stringify(key))
      let nameFile = key;
      if(nameFile.indexOf("/") > -1){
        nameFile = nameFile.replace("/", " ");
      }
      let document = {
        template: template(),
        context: {detailDatas: value, company: key, cycleDesc: resParam.cycle, timeGenerate: timeGenerate},
        path: reportPath + "/" + pathDir + "/" + Math.random() + nameFile + timeDirectory + '-' + month + '.pdf',
        nameDropboxFile: rootDropboxFolder + timeDirectory + '/' + key + '-' + month + index + '.pdf'
      }
      var dataJson = {companyCycle: key+' '+resParam.cycle, nameDropboxFile: document.nameDropboxFile};

      array.push(new Promise(function (resolve, reject) {
        pdf.create(document).then(function (pathDoc) {
          dataJson.filename = pathDoc.filename;
          process.nextTick(function () {
            resolve(dataJson);
          });
        }).catch(function (err) {
          process.nextTick(function () {
            console.error(err);
          })
          dataJson.filename = document.path;
          reject(dataJson);
         // return err;
        })
      }));

    });
    return Promise.settle(array);
  }).catch(function (err) {
    console.info('Eror File '+err);
  })
}

function updateEachRowSheetWithIndex(spreadId, index, objectLinks, username, timeGenerate, cb) {
  let data = [];
  var link = objectLinks[0]._settledValueField;
  if (link.companyCycle !== undefined) {
    var companyCycle = link.companyCycle.replace('^', ' ')
    data.push(["", "", companyCycle + ' ' + link.id, username, timeGenerate]);
  }else {
    data.push(["", "", ""]);
  }
  spreadsheetService.updateSheetAndRow(spreadId, index, data).then(function (resSheet) {
    cb(resSheet);
  });

}

function generateEachGoogleLink(spreadId, paramLinks) {
  return Promise.try(function () {
    var promises = [];
    var file = paramLinks[0]._settledValueField;
    var args = {
      data: {
        longUrl: file.url,
        "Authorization": "Bearer " + googleLinkToken
      },
      headers: {
        "Content-Type": "application/json"
      }
    };
    promises.push(new Promise(function (resolve, reject) {
      client.post("https://www.googleapis.com/urlshortener/v1/url?key=" + shortenerGoogleKey, args, function (data, response) {
        console.info('generateGoogleLink ' + JSON.stringify(data.error))
        data.companyCycle = file.companyCycle;
        if (!data.error) {
          resolve(data);
        } else {
          reject(response);
        }
      });
    }).catch(function (err) {
      console.info(' generate google link err '+err);
    }))
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
    return err;
  })
}

function generateEachDropboxLink(spreadId, parameters) {
  var promises = [];
  return Promise.try(function () {
    var file = parameters[0]._settledValueField;
    promises.push(new Promise(function (resolve, reject) {
      var args = {
        data: {
          path: file.response.path_display, settings: {
            "requested_visibility": "public"
          }
        },
        headers: {
          "Content-Type": "application/json", "Authorization": "Bearer " + dropboxAuth.access_token
        }
      };
      client.post("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", args, function (data, response) {
        console.info('generateDropboxLink ' + JSON.stringify(data.error));
        data.companyCycle = file.companyCycle;
        if (!data.error) {
          resolve(data);
        } else {
          reject(response);
		  return data.error;
        }
      });
    }).catch(function (err) {
      return err;
    }))
    return Promise.settle(promises);
  }).catch(function (err) {
    return err;
  })
}

function uploadEachFileToDropbox(spreadId, localPathFile) {
  var dbx = new Dropbox({ accessToken: dropboxAuth.access_token });
  var array = [];
  return Promise.try(function () {
    var file = localPathFile._settledValueField;

    var args = {
      data: {
        path: file.nameDropboxFile,
        contents: file.contents,
        settings: {
          "requested_visibility": "public"
        }
      },
      headers: {
        "Content-Type": "application/json", "Authorization": "Bearer " + dropboxAuth.access_token
      }
    };

    array.push(new Promise(function (resolve, reject) {
      dbx.filesUpload({path: file.nameDropboxFile, contents: file.contents}).then(function (response) {
          var dataJson = {
            filename: file.filename,
            response: response,
            companyCycle: file.companyCycle,
            spreadId: spreadId
          };
          console.info('uploadFileToDropbox ' + JSON.stringify(response.error));
          if (!response.error) {
            resolve(dataJson);
          fs.unlink(file.filename);
          }
        }).catch(function (err) {
          console.error(err)
          reject(err);
        });
      }).catch(function (err) {
      console.error(err)
      return err;
    }));
    return Promise.settle(array);
  }).catch(function (err) {
    console.info(err);
    return err;
  })

}




function uploadFileToDropbox(spreadId, localPathFile) {
  var dbx = new Dropbox({accessToken: dropboxAuth.access_token});
  var array = [];
  return Promise.try(function () {
    localPathFile.forEach(function (object, i) {
      var file = object._settledValueField;
      array.push(new Promise(function (resolve, reject) {
          dbx.filesUpload({path: file.nameDropboxFile, contents: file.contents}).then(function (response) {
            var dataJson = {
              filename: file.filename,
              response: response,
              companyCycle: file.companyCycle,
              spreadId: spreadId
            };
            console.info('uploadFileToDropbox ' + JSON.stringify(response.error));
            if (!response.error) {
              resolve(dataJson);
            }
          })
        })
      );
    });
    return Promise.settle(array);
  }).catch(function (err) {
    console.info(err);
  })

}

function insertContents(spreadId, localPathFile) {

  var promises = [];

  return Promise.try(function () {
    localPathFile.forEach(function (object, i) {
      var file = object._settledValueField;
        promises.push(new Promise(function (resolve, reject) {
          fs.readFile(file.filename, function (err, contents) {
            if (!err) {
              var dataJson = {
                filename: file.filename,
                nameDropboxFile: file.nameDropboxFile,
                contents: contents,
                companyCycle: file.companyCycle
              };
              resolve(dataJson);
            } else {
              reject(err);
            }
          });
        }));
    });
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
  })
}


function template() {

  return "<h2 style='text-align: center'>" +
    "{{company}}" +
    "</h2>" +
    "<h5 style='text-align: center'>" +
    "{{timeGenerate}}" +
    "</h5>" +
    "<h3 style='text-align: center'>" +
    "{{cycleDesc}}" +
    "</h3>" +
    "<table class=\"table\">" +
    "<thead>" +
    "<tr>" +
    "<th>Item</th>" +
    "<th>Line Number</th>" +
    "<th>Data GB</th>" +
    "<th>Incoming Call</th>" +
    "<th>Outgoing Call</th>" +
    "<th>Outgoing SMS</th>" +
    "</tr>" +
    "</thead>" +
    "<tbody>" +
    "{{#each detailDatas}}" +
    "<tr>" +
    "<td>{{this.item}}</td>" +
    "<td>{{this.lineNumber}}</td>" +
    "<td style='text-align: right'>{{this.dataGB}}</td>" +
    "<td style='text-align: right'>{{this.incomingCall}}</td>" +
    "<td style='text-align: right'>{{this.outgoingCall}}</td>" +
    "<td style='text-align: right'>{{this.outgoingSMS}}</td>" +
    "</tr>" +
    "{{/each}}" +
    "</tbody>" +
    "</table>" +
    "<style type='text/css'> " +
    "tbody tr:nth-child(odd) {" +
    "   background-color: #ccc;" +
    "}" +
    "</style>";
}

