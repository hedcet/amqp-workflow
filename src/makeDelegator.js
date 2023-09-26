const amqp = require("amqplib");
const emitter = require("events");
const { v4 } = require("uuid");

const defaults = require("./defaults.js");
const { DELEGATOR_ALREADY_STARTED } = require("./errors.js");
const invoker = require("./utils/invoker.js");

const makeDelegator = (options = {}) => {
  const {
    expires = 300000,
    namespace = "amqp",
    onClose,
    onError,
    replyTo = v4(),
    url,
  } = { ...defaults, ...options };

  let connection;
  let channel;

  const start = async () => {
    if (channel) throw new Error(DELEGATOR_ALREADY_STARTED);

    connection = await amqp.connect(url);
    if (typeof onClose === "function") connection.on("close", onClose);
    if (typeof onError === "function") connection.on("error", onError);

    channel = await connection.createChannel();
    await channel.assertQueue(replyTo, { expires });
    channel.responseEmitter = new emitter();
    channel.responseEmitter.setMaxListeners(0);
    channel.consume(
      replyTo,
      (message) => {
        channel.responseEmitter.emit(
          message.properties.correlationId,
          JSON.parse(message.content.toString())
        );
      },
      { noAck: true }
    );
  };

  const invoke = async (name, args, options) => {
    if (!channel) throw new Error(DELEGATOR_NOT_STARTED);

    const invocation = invoker(channel, replyTo, v4());
    return await invocation(`${namespace}.${name}`, args, options);
  };

  const stop = async () => {
    if (channel) await channel.close();
    channel = undefined;

    if (connection) await connection.close();
    connection = undefined;
  };

  return { invoke, start, stop };
};

module.exports = makeDelegator;
