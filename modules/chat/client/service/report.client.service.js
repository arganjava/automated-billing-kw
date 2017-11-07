(function () {
  'use strict';

  // Reports service used for communicating with the Reports REST endpoint
  angular
    .module('report.service')
    .factory('ReportService', ReportService);

  ReportService.$inject = ['$resource'];

  function ReportService($resource) {
    var Reports = $resource('/api/report', {}, {
      generateReport: {
        method: 'POST',
        url: '/api/report/generate',
        params: {
          spreadsheetId: '@spreadsheetId'
        }
      }
    });

    angular.extend(Reports, {
      generateSpreadsheetByID: function (spreadsheetId) {
        return this.generateReport({ spreadsheetId: spreadsheetId }).$promise;
      }

    });

    return Reports;
  }

  // TODO this should be Reports service
  /* angular
    .module('Reports.admin.services')
    .factory('AdminService', AdminService);

  AdminService.$inject = ['$resource'];

  function AdminService($resource) {
    return $resource('/api/report/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  } */
}());
