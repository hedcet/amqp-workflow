const amqp = require("amqplib");
const { v4 } = require("uuid");

const defaults = require("./defaults.js");
const { DELEGATOR_ALREADY_STARTED } = require("./errors.js");
const invoker = require("./utils/invoker.js");

const makeDelegator = (options = {}) => {
  const {
    namespace = "amqp",
    url,
    onClose,
    onError,
  } = { ...defaults, ...options };

  let connection;
  let channel;

  const start = async () => {
    if (channel) throw new Error(DELEGATOR_ALREADY_STARTED);

    connection = await amqp.connect(url);
    if (typeof onClose === "function") connection.on("close", onClose);
    if (typeof onError === "function") connection.on("error", onError);

    channel = await connection.createChannel();
  };

  const invoke = async (name, args, options) => {
    if (!channel) throw new Error(DELEGATOR_NOT_STARTED);

    const { queue } = await channel.assertQueue("", { exclusive: true });
    const invocation = invoker(channel, queue, v4());
    const r = await invocation(`${namespace}.${name}`, args, options);
    await channel.deleteQueue(queue);
    return r;
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
