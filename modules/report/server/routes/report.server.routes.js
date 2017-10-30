'use strict';
var path = require('path');

module.exports = function (app) {
  var report = require(path.resolve('./modules/report/server/controllers/report.server.controller'));

  app.route('/report')
    .post(report.create);
  app.route('/report/:spreadId')
    .get(report.list);
};
