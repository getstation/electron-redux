// in the renderer store
import { ipcRenderer } from 'electron';
import { applyMiddleware, createStore } from 'redux';
import { getClient, NodeIpcClientDuplex } from 'stream-node-ipc';
import { client } from '../../src';
import reducer from '../reducers';

const ipcClient1 = getClient('getstation-electron-redux-test');
const duplex1 = new NodeIpcClientDuplex(ipcClient1);

const getStore = async (duplex) => {
  const { forwardToServer, getInitialStateClient, replayActionClient } = client(duplex);
  const initialState = await getInitialStateClient();

  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(
      forwardToServer,
    ),
  );

  replayActionClient(store);

  return store;
};

describe('forwards actions to and from renderer', () => {
  let store1;

  before(async () => {
    store1 = await getStore(duplex1);
  });

  it('should have a valid initial state', (done) => {
    const state = store1.getState();
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
    store1.dispatch({
      type: 'test1',
    });
  });

  it('should forward action from main to renderer', (done) => {
    ipcRenderer.once('test:reply-from-main', (_, newMainState) => {
      if (newMainState.test === 2) {
        return setTimeout(() => {
          const localState = store1.getState();
          if (localState.test === 2) return done();
          return done(new Error(`Invalid local state ${JSON.stringify(localState)}`));
        }, 10); // wait for the state to dispatch the update
      }
      return done(new Error(`Invalid main state ${JSON.stringify(newMainState)}`));
    });
    ipcRenderer.send('test:dispatch-from-main');
  });
});
