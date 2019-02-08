# shared-redux
[![CircleCI](https://circleci.com/gh/getstation/shared-redux/tree/master.svg?style=svg)](https://circleci.com/gh/getstation/shared-redux/tree/master)

## Motivations
1) Using redux with electron poses a couple of problems. Processes ([main](https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md#main-process) and [renderer](https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md#renderer-process)) are isolated.
2) At [Station](https://github.com/getstation), we have the core the app that runs inside a Worker process (invisible renderer). This implies the following:
    - The worker process acts as the redux server
    - We need a way to have the main process and any other renderer to directly talk to the worker
    - Those 2 points make it tricky to use electron own IPC methods because they force the main process to act as the server

## Differences with electron-redux
- This fork doesn't enforce [FSA](https://github.com/acdlite/flux-standard-action#example)
- Supports only ImmutableJS (for now)
- Change dispatch execution order: the process from where the action is dispatched reduces action immediately instead of waiting for the the main to dispatch action in other processes.
- **Can be used by electron or node in the same way**. This also means that, if used in Electron, any renderer process can act as the "server" instead of the main process.

![shared-redux basic](https://user-images.githubusercontent.com/1098371/52342828-ba9cdc00-2a16-11e9-8a82-9dcee4647711.png)

### The solution
`shared-redux` offers a plug and play solution:
  - Choose a process: it acts as the single source of truth for your redux store
  - Choose how your processes communicate: We leverage [stream-json-rpc](https://github.com/getstation/stream-json-rpc) to have a transport agnostic lib. You can plug any stream-compatible layer or write your own.
    - `stream-json-rpc` already implements a Stream layer for electron own IPC and [node-ipc](https://github.com/RIAEvangelist/node-ipc)

## Install

```sh
# npm
npm install --save shared-redux
# yarn
yarn add shared-redux
```

`shared-redux` comes as redux middleware:

```javascript
// in the server store
import { server } from 'shared-redux';
import { firstConnectionHandler } from 'stream-electron-ipc';
// Or if you want to use node-ipc
// import { firstConnectionHandler } from 'stream-node-ipc';

// firstConnectionHandler have the following signature:
// (callback: (socket: Duplex) => void) => void;
// This method should use own Duplex implementation on top of the protocol you have chosen,
// and call the given callback with the Duplex as a parameter once a new client is connected.
// See https://github.com/getstation/stream-json-rpc/blob/master/packages/stream-electron-ipc/src/index.ts for details.
const { forwardToClients, replayActionServer } = server(firstConnectionHandler);

// reducers are shared amongst processes, so keep them pure!
const todoApp = combineReducers(reducers);

const store = createStore(
  todoApp,
  initialState, // optional
  applyMiddleware(
    ...otherMiddleware,
    forwardToClients, // IMPORTANT! This goes last
  )
);

replayActionServer(store);
```

```javascript
// in the client store
import { client } from 'shared-redux';
import { ElectronIpcRendererDuplex } from 'stream-electron-ipc';
// Or any other protocol wrapped in a Duplex

const duplex = new ElectronIpcRendererDuplex();

const { forwardToServer, getInitialStateClient, replayActionClient } = client(duplex);

// reducers are shared amongst processes, so keep them pure!
const todoApp = combineReducers(reducers);
const initialState = await getInitialStateClient();

const store = createStore(
  todoApp,
  initialState,
  applyMiddleware(
    forwardToServer, // IMPORTANT! This goes first
    ...otherMiddleware,
  )
);

replayActionClient(store);
```

And that's it! You are now ready to fire actions without having to worry about synchronising your state between processes.
