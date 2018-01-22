'use strict';
var path = require('path');

module.exports = function (app) {
  var report = require(path.resolve('./modules/report/server/controllers/report.server.controller'));

  app.route('/api/report/generate')
    .post(report.create);
  app.route('/report/:spreadId')
    .get(report.list);
  app.route('/sample-callback')
    .post(report.sampleCallbackURL);

};
