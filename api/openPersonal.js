async (context, { id: channelUserId, name }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const userId = user.id();

  if (!user.name) throw new Error('Для открытия личного чата должно быть указано имя пользователя');

  user.set({ personalChatMap: { [channelUserId]: { name } } });
  await user.saveChanges('chat.api.openPersonal');

  const processOwner = { f: 'chat.api.openPersonal' };
  await lib.store.broadcaster.publishData(
    `user-${channelUserId}`,
    {
      personalChatMap: { [userId]: { name: user.name } },
    },
    processOwner
  );

  return { status: 'ok' };
};
