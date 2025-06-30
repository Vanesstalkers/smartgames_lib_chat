async (context, { text, channel }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const userId = user.id();

  const time = Date.now();
  const chatEvent = {
    text,
    user: { id: userId, name: user.name },
    time,
    parents: [userId, channel],
  };
  const { _id } = await db.mongo.insertOne('chat', chatEvent);
  chatEvent._id = _id.toString();

  user.broadcastToSessions({
    type: 'updateStore',
    data: {
      user: {
        [userId]: {
          personalChatMap: { [channel]: { lastView: Date.now(), items: { [_id]: chatEvent } } },
        },
      },
    },
  });

  const userOnline = await db.redis.hget('users', channel, { json: true });
  if (userOnline) {
    await lib.store.broadcaster.publishAction.call(session, `user-${channel}`, 'broadcastToSessions', {
      type: 'updateStore',
      data: { user: { [channel]: { personalChatMap: { [userId]: { items: { [_id]: chatEvent } } } } } },
    });
  } else {
    await lib.store.broadcaster.publishAction.call(session, `lobby-${session.lobbyId}`, 'delayedChatEvent', {
      userId,
      targetId: channel,
      chatEvent,
    });
  }

  return { status: 'ok' };
};
