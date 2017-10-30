let spreadsheetService = require('../service/spreadsheetService');
let authentication = require("../config/authentication");


function start() {
  spreadsheetService.listMajors(function (res) {
    console.info(res);
  });
}

function injectToken() {
  let token = "4/xIQuxw0pqXZqlDZMwdrlnPyOu-KvZLIAGDfcPkgJv94";
  authentication.getNewToken(token, function (res) {
    console.info(res);
  });
}
start();
//injectToken();
