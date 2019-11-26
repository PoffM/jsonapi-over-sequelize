import { createContext } from "dataloader-sequelize";
import httpContext from "express-http-context";

export type MyAppRequestContext = ReturnType<typeof createRequestContext>;

export function createRequestContext({ sequelize }) {
  const sequelizeContext = createContext(sequelize);

  const sqlLogs: string[] = [];

  return { sequelizeContext, sqlLogs };
}

export function getRequestContext(): MyAppRequestContext | null {
  return httpContext.get("context");
}
