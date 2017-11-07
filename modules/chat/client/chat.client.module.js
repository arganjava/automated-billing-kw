(function (app) {
  'use strict';

  app.registerModule('chat', ['core']);
  app.registerModule('report.service');
  app.registerModule('chat.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));
