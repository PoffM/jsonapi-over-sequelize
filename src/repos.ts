import { ResourceObject } from "jsonapi-typescript";
import { JsonApiOverDbModelRepo } from "./jsonapi-over-sequelize/JsonApiOverDbModelRepo";
import { createDbModels, DepartmentDbModel, EmployeeDbModel } from "./models";

interface ReposParams {
  models: ReturnType<typeof createDbModels>;
}

export type DepartmentResource = ResourceObject<
  "department",
  {
    name: string;
  }
>;
export type EmployeeResource = ResourceObject<
  "employee",
  {
    name: string;
    nameUppercase: string;
  }
>;

export function createRepos({ models }: ReposParams) {
  const { DepartmentRepo, EmployeeRepo } = models;

  const departmentRepo = new JsonApiOverDbModelRepo<
    DepartmentResource,
    DepartmentDbModel
  >({
    dbRepo: DepartmentRepo,
    typeName: "department",
    attributeResolvers: {
      name: "name"
    }
  });

  const employeeRepo = new JsonApiOverDbModelRepo<
    EmployeeResource,
    EmployeeDbModel
  >({
    dbRepo: EmployeeRepo,
    includeResolvers: {
      department: async emp =>
        emp.dept_id
          ? (await departmentRepo.findOne(String(emp.dept_id), {})).data
          : null
    },
    attributeResolvers: {
      name: "name",
      nameUppercase: model => model.name.toUpperCase()
    },
    typeName: "employee"
  });

  return { departmentRepo, employeeRepo };
}
