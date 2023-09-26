const invoker = (channel, replyTo, correlationId) => (name, args, options) =>
  new Promise((resolve) => {
    channel.responseEmitter.once(correlationId, resolve);
    channel.sendToQueue(
      name,
      Buffer.from(
        JSON.stringify(typeof args === "undefined" ? "undefined" : args)
      ),
      {
        replyTo,
        correlationId,
        ...options,
      }
    );
  });

module.exports = invoker;
