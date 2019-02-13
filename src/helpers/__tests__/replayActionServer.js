import replayActionServer from '../replayActionServer';

describe('replayActionServer', () => {
  it('should replay any actions received', () => {
    const store = {
      dispatch: jest.fn(),
      getState: jest.fn(),
      subscribe: jest.fn(),
    };
    const peers = {
      setReduxActionHandler: jest.fn(),
    };
    const payload = {
      meta: {
        sender: 1,
      },
      value: 123,
    };

    replayActionServer(peers)(store);

    expect(peers.setReduxActionHandler).toHaveBeenCalledTimes(1);
    expect(peers.setReduxActionHandler.mock.calls[0][0]).toBeInstanceOf(Function);

    peers.setReduxActionHandler.mock.calls[0][0](payload);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(payload);
  });
});
