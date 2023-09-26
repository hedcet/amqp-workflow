const taskRunner = (channel, task) => async (message) => {
  try {
    const r = await task(JSON.parse(message.content.toString()));
    await channel.sendToQueue(
      message.properties.replyTo,
      Buffer.from(JSON.stringify(typeof r === "undefined" ? "undefined" : r)),
      { correlationId: message.properties.correlationId }
    );
    channel.ack(message);
    return r;
  } catch (e) {
    channel.ack(message);
    throw e;
  }
};

module.exports = taskRunner;
