import rpcchannel from 'stream-json-rpc';
import getInitialStateClient from './helpers/getInitialStateClient';
import replayActionClient from './helpers/replayActionClient';
import replayActionServer from './helpers/replayActionServer';
import forwardToClients from './middleware/forwardToClients';
import forwardToServer from './middleware/forwardToServer';
import Peers from './middleware/peers';

const defaultNamespace = 'electron-redux-peer';

export const client = (duplex, peerNamespace = defaultNamespace) => {
  const channel = rpcchannel(duplex);
  const peer = channel.peer(peerNamespace);

  return {
    forwardToServer: forwardToServer(peer),
    replayActionClient: replayActionClient(peer),
    getInitialStateClient: getInitialStateClient(peer),
  };
};

export const server = (duplexCallback, peerNamespace = defaultNamespace) => {
  const peers = new Peers(duplexCallback, peerNamespace);

  return {
    forwardToClients: forwardToClients(peers),
    replayActionServer: replayActionServer(peers),
  };
};
