import { ipcMain, webContents } from 'electron';
import { applyMiddleware, createStore } from 'redux';
import { firstConnectionHandler } from 'stream-electron-ipc';
import { server } from '../../src';
import reducer from '../reducers';

const { forwardToClients, replayActionServer } = server(firstConnectionHandler);

const store = createStore(
  reducer,
  { a: 'xyz'.repeat(10000) },
  applyMiddleware(
    forwardToClients,
  ),
);

replayActionServer(store);

ipcMain.on('test:dispatch-from-main', () => {
  store.dispatch({
    type: 'test2',
  });
});

store.subscribe(() => {
  webContents.getAllWebContents().forEach((wc) => {
    wc.send('test:reply-from-main', store.getState());
  });
});
