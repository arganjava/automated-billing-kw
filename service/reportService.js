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
var timeDirectory = moment().format('DD:MM:YY - hh:mm');
var month = moment().format('MMM');
var Client = require('node-rest-client').Client;
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
    spreadsheetService.listMajors(spreadId, function (err, res) {
      if (!err) {
        return res;
      }
    }).then(function (res) {
      insertFile(res).then(function (dataParam) {
        console.info('After insertFile ' + dataParam)
        insertContents(spreadId, dataParam).then(function (container) {
          console.info('After insertContents ' + container);
          callback(container);
        });
      });
    }).catch(function (err) {
      return err;
    });
  },
  callEachService: function (spreadId, index, container, callback) {
    uploadEachFileToDropbox(spreadId, container).then(function (results) {
      console.info('After uploadFileToDropbox ' + results)
      generateEachDropboxLink(spreadId, results).then(function (links) {
        console.info('After generateDropboxLink ' + links)
        generateEachGoogleLink(spreadId, links).then(function (shortLinks) {
          console.info('After generateDropboxLink ' + shortLinks)
          updateEachRowSheetWithIndex(spreadId, index, shortLinks, function (sheet) {
            callback(sheet);
          })
        })
      })
    })
  },
  getToken: function (tokenId) {

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

/*
function generateLocalfile(spreadId, resParam, callback) {
  insertFile(resParam).then(function (response) {
    return response;
  })
}*/

function insertFile(resParam) {
  let array = [];
  var timeGenerate = moment().format('DD MMM YYYY')
  return Promise.try(function () {
    resParam.forEach(function (value, key) {
      let keySplit = key.split('^')
      let document = {
        template: template(),
        context: {detailDatas: value, company: keySplit[0], cycleDesc: keySplit[1], timeGenerate: timeGenerate},
        path: reportPath + Math.random() + keySplit[0] + '.pdf',
        nameDropboxFile: rootDropboxFolder + timeDirectory + '/' + keySplit[0] + '-' + month + '.pdf'
      }
      array.push(pdf.create(document).then(function () {
        var dataJson = {filename: document.path, companyCycle: key, nameDropboxFile: document.nameDropboxFile};
        return dataJson;
      }))
    });
    return Promise.settle(array);
  }).catch(function (err) {
    console.info(err);
  })
}

function updateEachRowSheetWithIndex(spreadId, index, objectLinks, cb) {
  let data = [];
  var link = objectLinks[0]._settledValueField;
  if (link.companyCycle !== undefined) {
    var companyCycle = link.companyCycle.replace('^', ' ')
    data.push(["", "", companyCycle + ' ' + link.id]);
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
    }))
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
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
        }
      });
    }))
    return Promise.settle(promises);
  }).catch(function (err) {
    console.info(err);
  })
}

function uploadEachFileToDropbox(spreadId, localPathFile) {
  var dbx = new Dropbox({ accessToken: dropboxAuth.access_token });
  var array = [];
  return Promise.try(function () {
    var file = localPathFile._settledValueField;
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
          fs.unlink(file.filename)
          }
        });
      }));
    return Promise.settle(array);
  }).catch(function (err) {
    console.info(err);
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
     // if (i < 2) {
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
    //  }
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

