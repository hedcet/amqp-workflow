const amqp = require("amqplib");

const defaults = require("./defaults.js");
const {
  INVALID_NAME,
  INVALID_TASK,
  WORKER_ALREADY_STARTED,
} = require("./errors.js");
const taskRunner = require("./utils/taskRunner.js");

const makeWorker = (options = {}) => {
  const {
    expires = 300000,
    maxPriority = 3,
    name,
    namespace = "amqp",
    onClose,
    onError,
    prefetch = 1,
    task,
    url,
  } = {
    ...defaults,
    ...options,
  };

  if (typeof name !== "string") throw new Error(INVALID_NAME);
  if (typeof task !== "function") throw new Error(INVALID_TASK);

  const _name = `${namespace}.${name}`;

  let connection;
  let channel;

  const start = async () => {
    if (channel) throw new Error(WORKER_ALREADY_STARTED);

    connection = await amqp.connect(url);
    if (typeof onClose === "function") connection.on("close", onClose);
    if (typeof onError === "function") connection.on("error", onError);

    channel = await connection.createChannel();
    await channel.assertQueue(_name, { expires, maxPriority });
    await channel.prefetch(prefetch);
    channel.consume(_name, taskRunner(channel, task));
  };

  const stop = async () => {
    if (channel) await channel.close();
    channel = undefined;

    if (connection) await connection.close();
    connection = undefined;
  };

  return { start, stop };
};

module.exports = makeWorker;
