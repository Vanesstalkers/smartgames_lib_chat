async (context, { text, channel }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  await lib.store.broadcaster.publishAction.call(session, channel, 'updateChat', {
    text,
    // сохраняем user.name, потому что после перезапуска сервера в store может не быть нужного user
    user: { id: user.id(), name: user.name },
  });
  return { status: 'ok' };
};
