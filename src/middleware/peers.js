import rpcchannel from 'stream-json-rpc';

const transit = require('transit-immutable-js');

export default class Peers {
  constructor(firstConnectionHandler, namespace) {
    this.firstConnectionHandler = firstConnectionHandler;
    this.peers = new Set(); // List of clients
    this.remotePeerIds = new WeakMap();
    this.handler = undefined;
    this.namespace = namespace;
  }

  handleNewConnections(store) {
    this.firstConnectionHandler((duplex) => {
      const channel = rpcchannel(duplex);
      const peer = channel.peer(this.namespace);
      peer.setRequestHandler('client-ask-initial-state', () => transit.toJSON(store.getState()));

      this.peers.add(peer);

      if (this.handler) {
        this.attachReduxActionHandler(peer);
      }

      peer.on('end', () => {
        this.peers.delete(peer);
      });
    });
  }

  isValidBroadcastTarget(peer, payload) {
    return !payload.meta
      || !this.remotePeerIds.has(peer)
      || this.remotePeerIds.get(peer) !== payload.meta.sender;
  }

  broadcast(payload) {
    this.peers.forEach((peer) => {
      // Do not send back to the original sender
      if (this.isValidBroadcastTarget(peer, payload)) {
        peer.notify('redux-action', payload);
      }
    });
  }

  setReduxActionHandler(handler) {
    this.handler = handler;
    const attachFn = this.attachReduxActionHandler.bind(this);
    this.peers.forEach(attachFn);
  }

  attachReduxActionHandler(peer) {
    peer.setNotificationHandler('redux-action', this.handlerWrapper(peer));
  }

  handlerWrapper(peer) {
    return (payload) => {
      if (!this.remotePeerIds.has(peer) && payload.meta && payload.meta.sender) {
        this.remotePeerIds.set(peer, payload.meta.sender);
      }
      this.handler(payload);
    };
  }
}
