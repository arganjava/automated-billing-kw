(function () {
  'use strict';

  angular
    .module('chat')
    .controller('ReportController', ReportController);

  ReportController.$inject = ['$scope', '$state', 'Authentication', 'Socket', 'ReportService'];

  function ReportController($scope, $state, Authentication, Socket, ReportService) {
    var vm = this;

    vm.messages = [];
    vm.messageText = '';
    vm.spreadsheetID = '';
    vm.sendMessage = sendMessage;
    vm.generateReport = generateReport;

    init();

    function init() {
      // If user is not signed in then redirect back home
      if (!Authentication.user) {
        $state.go('home');
      }

      // Make sure the Socket is connected
      if (!Socket.socket) {
        Socket.connect();
      }

      // Add an event listener to the 'chatMessage' event
      Socket.on('chatMessage', function (message) {
        vm.messages.unshift(message);
      });

      // Remove the event listener when the controller instance is destroyed
      $scope.$on('$destroy', function () {
        Socket.removeListener('chatMessage');
      });
    }


    function generateReport() {
	  vm.messageText='';
      ReportService.generateSpreadsheetByID(vm.spreadsheetID)
        .then(function (data) {
          console.info(data);
		  if(data.error){
		  vm.messageText= data.error;
		  }else{
		  vm.messageText= 'https://docs.google.com/spreadsheets/d/'+vm.spreadsheetID;
		  vm.spreadsheetID = '';
		  }
        })
        .catch(function (err) {
          console.info(err);
		  		  vm.messageText= err;
        });
      // Create a new message object
     /* var message = {
        text: vm.messageText
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', message);

      // Clear the message text
      vm.messageText = '';*/
    }

    // Create a controller method for sending messages
    function sendMessage() {
      // Create a new message object
      var message = {
        text: vm.messageText
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', message);

      // Clear the message text
      vm.messageText = '';
    }
  }
}());
