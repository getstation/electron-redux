const forwardToClients = peers => (store) => {
  peers.handleNewConnections(store);

  return next => (action) => {
    if (action.meta && action.meta.scope === 'local') return next(action);
    // change scope to avoid endless-loop
    const rendererAction = {
      ...action,
      meta: {
        ...action.meta,
        scope: 'local',
      },
    };

    peers.broadcast(rendererAction);

    return next(action);
  };
};

export default forwardToClients;
