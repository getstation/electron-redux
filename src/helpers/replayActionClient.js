export default function replayActionClient(peer) {
  return (store) => {
    peer.setNotificationHandler('redux-action', (payload) => {
      store.dispatch(payload);
    });
  };
}
