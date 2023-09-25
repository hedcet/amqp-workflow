insipred from [amqp-delegate](https://itnext.io/delegating-work-using-nodejs-and-amqp-4d3cc1f62824)
```
const fetch = require("node-fetch");

const {
  makeWorker,
  makeDelegator,
} = require("../../amqp-workflow/src/index.js");

const namespace = "amqp"; // default namespace
const url = "amqp://username:password@localhost:5672";
makeWorker({
  name: "gd.docs",
  task: ({ appNo }) => ({ s3_path: `${appNo}.xxx.pdf` }),
  url,
})
  .start()
  .then(() => {
    const mgmt_list_queues = "http://localhost:15672/api/queues";
    const toBase64 = (text) => Buffer.from(text).toString("base64");
    fetch(mgmt_list_queues, {
      headers: { Authorization: `Basic ${toBase64("username:password")}` },
      method: "GET",
      redirect: "follow",
    })
      .then((r) => r.json())
      .then((r) =>
        console.log(
          "running",
          r.reduce((m, { name, state }) => {
            if (name.startsWith(`${namespace}.`)) m.push(name);
            return m;
          }, [])
        )
      );
  });

const workflow = makeDelegator({ url });
workflow
  .start()
  .then(() => workflow.invoke("gd.docs", { appNo: "US12345678" }))
  .then(console.log);
```
