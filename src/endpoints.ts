import { RequestHandler } from "express";
import { JsonApiOverDbModelRepo } from "./jsonapi-over-sequelize/JsonApiOverDbModelRepo";
import { createRepos } from "./repos";

export interface EndpointsParams {
  repos: ReturnType<typeof createRepos>;
}

export interface EndpointSpec {
  verb: "get" | "post" | "patch" | "delete";
  path: string;
  handler: RequestHandler;
}

function findOneEndpoint(repo: JsonApiOverDbModelRepo<any, any>): EndpointSpec {
  return {
    verb: "get",
    path: `/${repo.config.typeName}s/:id`,
    handler: async (req, res) => {
      const doc = await repo.findOne(req.params.id, req.query);
      res.json(doc);
    }
  };
}

function findAllEndpoint(repo: JsonApiOverDbModelRepo<any, any>): EndpointSpec {
  return {
    verb: "get",
    path: `/${repo.config.typeName}s`,
    handler: async (req, res) => {
      const doc = await repo.findAll(req.query);
      res.json(doc);
    }
  };
}

function operationsEndpoint(): EndpointSpec {
  return {
    verb: "patch",
    path: "/operations",
    handler: async (req, res) => {
      res.json({ todo: true });
    }
  };
}

export function createEndpoints({ repos }: EndpointsParams): EndpointSpec[] {
  return [
    findAllEndpoint(repos.departmentRepo),
    findOneEndpoint(repos.departmentRepo),
    findAllEndpoint(repos.employeeRepo),
    findOneEndpoint(repos.employeeRepo)
  ];
}
