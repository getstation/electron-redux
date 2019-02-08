// in the renderer store
import { ipcRenderer } from 'electron';
import { applyMiddleware, createStore } from 'redux';
import { ElectronIpcRendererDuplex } from 'stream-electron-ipc';
import { client } from '../../src';
import reducer from '../reducers';

const duplex = new ElectronIpcRendererDuplex();

const { forwardToServer, getInitialStateClient, replayActionClient } = client(duplex);

describe('forwards actions to and from renderer', () => {
  let store;
  before(async () => {
    const initialState = await getInitialStateClient();

    store = createStore(
      reducer,
      initialState,
      applyMiddleware(
        forwardToServer,
      ),
    );

    replayActionClient(store);
  });

  it('should have a valid initial state', (done) => {
    const state = store.getState();
    const initialState = { a: 'xyz'.repeat(10000) };
    if (state.toString() === '[object Object]'
      && JSON.stringify(state) === JSON.stringify(initialState)
    ) return done();
    return done(new Error(`Invalid state ${JSON.stringify(state)}`));
  });

  it('should forward action from renderer to main', (done) => {
    ipcRenderer.once('test:reply-from-main', (_, newMainState) => {
      if (newMainState.test === 1) return done();
      return done(new Error(`Invalid main state ${JSON.stringify(newMainState)}`));
    });
    store.dispatch({
      type: 'test1',
    });
  });

  it('should forward action from main to renderer', (done) => {
    ipcRenderer.once('test:reply-from-main', (_, newMainState) => {
      if (newMainState.test === 2) {
        return setTimeout(() => {
          const localState = store.getState();
          if (localState.test === 2) return done();
          return done(new Error(`Invalid local state ${JSON.stringify(localState)}`));
        }, 10); // wait for the state to dispatch the update
      }
      return done(new Error(`Invalid main state ${JSON.stringify(newMainState)}`));
    });
    ipcRenderer.send('test:dispatch-from-main');
  });
});
