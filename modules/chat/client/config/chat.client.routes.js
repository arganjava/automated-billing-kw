(function () {
  'use strict';

  angular
    .module('chat.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('chat', {
        url: '/report',
        templateUrl: '/modules/chat/client/views/chat.client.view.html',
        controller: 'ReportController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
}());
