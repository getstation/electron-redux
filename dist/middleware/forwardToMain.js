'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _electron = require('electron');

var forwardToMain = function forwardToMain(store) {
  return function (next) {
    return function (action) {
      // eslint-disable-line no-unused-vars
      if (typeof action === 'function') return next(action);
      if (action.type.substr(0, 2) !== '@@' && action.type.substr(0, 10) !== 'redux-form' && (!action.meta || !action.meta.scope || action.meta.scope !== 'local')) {
        var webContentsId = _electron.remote.getCurrentWebContents().id;
        var newAction = _extends({}, action, {
          meta: _extends({}, action.meta, {
            webContentsId
          })
        });
        _electron.ipcRenderer.send('redux-action', newAction);

        return next(newAction);
      }

      return next(action);
    };
  };
};

exports.default = forwardToMain;