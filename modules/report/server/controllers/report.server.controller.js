'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash'),
  reportService = require(path.resolve('./service/reportService')),
  authentication = require(path.resolve('./config/authentication.js'));
var indexUpdateRowSheetStart = 2;
var Promise = require('bluebird');


/**
 * Create a Report
 */
exports.create = function (req, res) {
  var spreadId = req.body.spreadsheetId;
  console.info(spreadId);

  reportService.checkSheetId(spreadId, function (err, response) {
    if (err) {
      res.status(500).json({status:500, message: err});
    } else {
      reportService.checkCalculationSheet(spreadId, function (err, response) {
        if (err) {
          res.status(500).json({status:500, message: err});
        } else {
          reportService.checkCalculationSheet(spreadId, function (err, response) {
            if (err) {
              res.status(500).json({status:500, message: err});
            } else {
              reportService.callContent(spreadId, function (containers) {
                if (containers instanceof Error) {
                  res.status(500).json({error: containers});
                } else {
                  var lengContainer = containers.length;
                  var getDataIndex = 0;
                  callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers);
                }
              });
              res.send(200);
            }
          });
        }
      });
    }
  })

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
    callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers);

  });
  res.send(200);

};


function callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, container, containers) {
  let self = this;
  var promises = [];
  return Promise.try(function () {
    promises.push(new Promise(function (resolve, reject) {
      reportService.callEachService(spreadId, indexUpdateRowSheetStart, container, function (data) {

        getDataIndex++;
        if (getDataIndex < lengContainer) {
          console.info('Index ++ ' + getDataIndex + ' and container ++' + lengContainer);
          indexUpdateRowSheetStart++;
          process.nextTick(function () {
            console.info('Next Upload');
            callEachService.call(self, spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers);
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
