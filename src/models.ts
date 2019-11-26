import { INTEGER, Model, Sequelize, STRING, BuildOptions } from "sequelize";

interface ModelsParams {
  sequelize: Sequelize;
}

export type DbRepo<TModel> = typeof Model & {
  new (values?: object, options?: BuildOptions): TModel;
};

export interface DepartmentDbModel extends Model {
  readonly id: number;
  name: string;
}
export type DepartmentDbRepo = DbRepo<DepartmentDbModel>;

export interface EmployeeDbModel extends Model {
  readonly id: number;
  name: string;
  dept_id?: number;
}
export type EmployeeDbRepo = DbRepo<EmployeeDbModel>;

export function createDbModels({ sequelize }: ModelsParams) {
  const DepartmentRepo = <DepartmentDbRepo>sequelize.define(
    "departments",
    {
      id: {
        primaryKey: true,
        type: INTEGER
      },
      name: {
        allowNull: false,
        type: STRING
      }
    },
    {
      schema: "company",
      tableName: "departments",
      timestamps: false
    }
  );

  const EmployeeRepo = <EmployeeDbRepo>sequelize.define(
    "employees",
    {
      dept_id: {
        type: INTEGER
      },
      id: {
        primaryKey: true,
        type: INTEGER
      },
      name: {
        allowNull: false,
        type: STRING
      }
    },
    {
      schema: "company",
      tableName: "employees",
      timestamps: false
    }
  );
  EmployeeRepo.belongsTo(DepartmentRepo, {
    as: "department",
    foreignKey: "dept_id"
  });

  return { DepartmentRepo, EmployeeRepo };
}
