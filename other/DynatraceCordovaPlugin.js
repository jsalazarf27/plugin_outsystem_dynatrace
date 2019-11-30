var exec = require("cordova/exec");
var emptyFunction = function() {};

module.exports = {
  endVisit: function(success, error) {
    success = success || emptyFunction;
    error = error || emptyFunction;

    exec(success, error, "DynatraceCordovaPlugin", "endVisit", []);
  },
  enterAction: function(actionName, success, error) {
    success = success || emptyFunction;
    error = error || emptyFunction;

    exec(success, error, "DynatraceCordovaPlugin", "enterAction", [
      { name: actionName }
    ]);
  },
  leaveAction: function(actionName, success, error) {
    success = success || emptyFunction;
    error = error || emptyFunction;

    exec(success, error, "DynatraceCordovaPlugin", "leaveAction", [
      { name: actionName }
    ]);
  }
};
