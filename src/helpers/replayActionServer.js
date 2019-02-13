export default function replayActionServer(peers) {
  return (store) => {
    peers.setReduxActionHandler((payload) => {
      store.dispatch(payload);
    });
  };
}
