'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash'),
  reportService = require(path.resolve('./service/reportService')),
spreadsheetService = require(path.resolve('./service/spreadsheetService')),
  User = mongoose.model('User'),
authentication = require(path.resolve('./config/authentication.js'));
var indexUpdateRowSheetStart = 2;
var Promise = require('bluebird');
var moment = require('moment');


/**
 * Create a Report
 */
exports.create = function (req, res) {
  var spreadId = req.body.spreadsheetId;
  var timeGenerate = moment().format('DD MMM YYYY HH:mm:ss')
  User.findById(req.session.passport.user, function (err, user) {
    if (err) {
      res.json({ error: err.message });
    } else {
      spreadsheetService.checkSheetId(spreadId, function (err, response) {
        if (err) {
          res.json({ error: err.message });
        } else {
          spreadsheetService.checkCalculationSheet(spreadId, function (err, response) {
            if (err) {
              res.json({ error: err.message });
            } else {
              spreadsheetService.createUsageReport(spreadId, function (err, response) {
                if (err !== null && err.message.indexOf("already exist") < 1) {
                  res.json({ error: err.message });
                } else {
                  reportService.callContent(spreadId, function (containers) {
                    if (containers instanceof Error) {
                      res.json({ error: err.message });
                    } else {
                      var lengContainer = containers.length;
                      var getDataIndex = 0;
                      callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers, user.displayName, timeGenerate);
                    }
                  });
                  res.send(200);
                }
              });
            }
          });
        }
      });

    }

  });
};

/**
 * Show the current Report
 */
exports.read = function (req, res) {

};

/**
 * Update a Report
 */
exports.update = function (req, res) {

};

/**
 * Delete an Report
 */
exports.delete = function (req, res) {

};

/**
 * List of Reports
 */
exports.list = function (req, res) {
  var spreadId = req.params.spreadId;
  var loopLength = 0;
  reportService.callContent(spreadId, function (containers) {
    var lengContainer = containers.length;
    var getDataIndex = 0;
    callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers, '');

  });
  res.send(200);

};


function callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, container, containers, username, timeGenerate) {
  let self = this;
  var promises = [];
  return Promise.try(function () {
    promises.push(new Promise(function (resolve, reject) {
      reportService.callEachService(spreadId, indexUpdateRowSheetStart, container, username, timeGenerate, function (data) {

        getDataIndex++;
        if (getDataIndex < lengContainer) {
          console.info('Index ++ ' + getDataIndex + ' and container ++' + lengContainer);
          indexUpdateRowSheetStart++;
          process.nextTick(function () {
            console.info('Next Upload');
            callEachService.call(self, spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers, username, timeGenerate);
            resolve(data);
          });
        } else {
          console.info('Stop Here......');
        }
      });
    }));
    return Promise.settle(promises);
  });

}

exports.createToken = function (req, res) {
  var test = { name: 'Argan' };
  var token = req.params.tokenId;
  authentication.getNewToken(token);
};


exports.sampleCallbackURL = function (req, res) {
  console.info("GET Request Interactive Text")
  console.info(JSON.stringify(req.body))
  res.send(200);
};
