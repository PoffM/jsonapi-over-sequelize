import express from "express";
import httpContext from "express-http-context";
import { Sequelize } from "sequelize";
import { createEndpoints } from "./endpoints";
import { createDbModels } from "./models";
import { createRepos } from "./repos";
import { createRequestContext, getRequestContext } from "./requestContext";

const sequelize = new Sequelize({
  database: "companydb",
  dialect: "postgres",
  host: "192.168.99.100",
  password: "p",
  port: 5432,
  username: "postgres",
  logging: sql => {
    console.log(sql);
    getRequestContext()?.sqlLogs.push(sql);
  }
});

const models = createDbModels({ sequelize });
const repos = createRepos({ models });

const app = express();

app.use(httpContext.middleware);

app.use((_, __, next) => {
  const context = createRequestContext({ sequelize });
  httpContext.set("context", context);
  next();
});

const endpoints = createEndpoints({ repos });

for (const endpoint of endpoints) {
  app[endpoint.verb](endpoint.path, endpoint.handler);
}

app.listen(3000, () => {
  console.log("app up");
});
