const defaults = {
  url: process.env.AMQP_URL || "amqp://localhost:5672",
};

module.export = defaults;
