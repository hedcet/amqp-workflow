const { INCORRECT_CORRELATION_ID } = require("../errors.js");

const invoker = (channel, replyTo, correlationId) => (name, args, options) =>
  new Promise((resolve, reject) => {
    channel.consume(
      replyTo,
      (message) => {
        try {
          if (message.properties.correlationId === correlationId)
            resolve(JSON.parse(message.content.toString()));
          else reject(INCORRECT_CORRELATION_ID);
        } catch (e) {
          reject(e);
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(name, Buffer.from(JSON.stringify(args)), {
      ...options,
      replyTo,
      correlationId,
    });
  });

module.exports = invoker;
