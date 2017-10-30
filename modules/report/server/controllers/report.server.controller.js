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

/**
 * Create a Report
 */
exports.create = function (req, res) {

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
    var collectData = [];
    var lengContainer = containers.length;
    var getDataIndex = 0;
    callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers, res);
      res.send(200);
  })

};


function callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, container, containers, res) {
  reportService.callEachService(spreadId, indexUpdateRowSheetStart, container, function (data) {
    getDataIndex++;
    if (getDataIndex < lengContainer) {
      console.info('Index ++ '+getDataIndex);
      indexUpdateRowSheetStart++;
      callEachService(spreadId, lengContainer, getDataIndex, indexUpdateRowSheetStart, containers[getDataIndex], containers, res);
    }
  })
}

exports.createToken = function (req, res) {
  var test = {name: 'Argan'};
  var token = req.params.tokenId;
  authentication.getNewToken(token);
};
