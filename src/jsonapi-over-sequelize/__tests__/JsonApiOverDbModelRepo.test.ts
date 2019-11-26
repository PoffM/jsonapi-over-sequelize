import { DbRepo, DepartmentDbModel, EmployeeDbModel } from "../../models";
import { EmployeeResource, DepartmentResource } from "../../repos";
import { JsonApiOverDbModelRepo } from "../JsonApiOverDbModelRepo";
import { Model } from "sequelize";

const MOCK_EMPLOYEES: Omit<EmployeeDbModel, keyof Model>[] = [
  {
    id: 1,
    name: "Asdf Asdf",
    dept_id: 1
  },
  {
    id: 2,
    name: "Mat Poff",
    dept_id: 1
  },
  {
    id: 3,
    name: "Qert Yuiop"
  }
];

const MOCK_DEPARTMENTS: Omit<DepartmentDbModel, keyof Model>[] = [
  {
    id: 1,
    name: "Warehouse"
  }
];

const mockEmployeeDbFindByPk = jest.fn();
const mockEmployeeDbFindAll = jest.fn();
const mockDepartmentDbFindByPk = jest.fn();

const mockEmployeeModelStatic = ({
  findByPk: mockEmployeeDbFindByPk,
  findAll: mockEmployeeDbFindAll
} as unknown) as DbRepo<EmployeeDbModel>;

const mockDepartmentModelStatic = ({
  findByPk: mockDepartmentDbFindByPk
} as unknown) as DbRepo<DepartmentDbModel>;

const employeeRepo = new JsonApiOverDbModelRepo<
  EmployeeResource,
  EmployeeDbModel
>({
  dbRepo: mockEmployeeModelStatic,
  typeName: "employee",
  attributeResolvers: {
    name: "name",
    nameUppercase: model => model.name.toUpperCase()
  },
  includeResolvers: {
    department: async emp =>
      emp.dept_id
        ? (await departmentRepo.findOne(String(emp.dept_id), {})).data
        : null
  }
});

const departmentRepo = new JsonApiOverDbModelRepo<
  DepartmentResource,
  DepartmentDbModel
>({
  dbRepo: mockDepartmentModelStatic,
  typeName: "department",
  attributeResolvers: {
    name: "name"
  }
});

describe("JsonApiOverDbModelRepo", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockEmployeeDbFindAll.mockImplementation(async () => MOCK_EMPLOYEES);
    mockEmployeeDbFindByPk.mockImplementation(async id =>
      MOCK_EMPLOYEES.find(emp => emp.id === id)
    );
    mockDepartmentDbFindByPk.mockImplementation(async id =>
      MOCK_DEPARTMENTS.find(dep => dep.id === id)
    );
  });

  it("Finds one resource", async () => {
    const employeeDoc = await employeeRepo.findOne("2");
    expect(employeeDoc).toEqual(
      expect.objectContaining({
        data: {
          attributes: {
            name: "Mat Poff",
            nameUppercase: "MAT POFF"
          },
          id: "2",
          type: "employee"
        }
      })
    );

    expect(mockEmployeeDbFindByPk.mock.calls).toEqual([[2, expect.anything()]]);
  });

  it("Includes a related resource.", async () => {
    const employeeDoc = await employeeRepo.findOne("2", {
      include: "department"
    });

    expect(employeeDoc).toEqual(
      expect.objectContaining({
        data: {
          id: "2",
          type: "employee",
          attributes: {
            name: "Mat Poff",
            nameUppercase: "MAT POFF"
          }
        },
        included: [
          {
            attributes: {
              name: "Warehouse"
            },
            id: "1",
            type: "department"
          }
        ]
      })
    );

    expect(mockEmployeeDbFindByPk.mock.calls).toEqual([[2, expect.anything()]]);
    expect(mockDepartmentDbFindByPk.mock.calls).toEqual([
      [1, expect.anything()]
    ]);
  });

  it("Finds a collection of resources.", async () => {
    const employeesDoc = await employeeRepo.findAll();
    expect(employeesDoc).toEqual(
      expect.objectContaining({
        data: [
          {
            attributes: {
              name: "Asdf Asdf",
              nameUppercase: "ASDF ASDF"
            },
            id: "1",
            type: "employee"
          },
          {
            attributes: {
              name: "Mat Poff",
              nameUppercase: "MAT POFF"
            },
            id: "2",
            type: "employee"
          },
          {
            attributes: {
              name: "Qert Yuiop",
              nameUppercase: "QERT YUIOP"
            },
            id: "3",
            type: "employee"
          }
        ]
      })
    );

    expect(mockEmployeeDbFindAll.mock.calls).toEqual([
      [
        expect.objectContaining({
          limit: 20,
          offset: 0
        })
      ]
    ]);
    expect(mockDepartmentDbFindByPk).toHaveBeenCalledTimes(0);
  });

  it("Finds a collection of resources with included resources.", async () => {
    const employeesDoc = await employeeRepo.findAll({
      include: "department"
    });

    expect(employeesDoc).toEqual(
      expect.objectContaining({
        data: [
          {
            attributes: {
              name: "Asdf Asdf",
              nameUppercase: "ASDF ASDF"
            },
            id: "1",
            type: "employee"
          },
          {
            attributes: {
              name: "Mat Poff",
              nameUppercase: "MAT POFF"
            },
            id: "2",
            type: "employee"
          },
          {
            attributes: {
              name: "Qert Yuiop",
              nameUppercase: "QERT YUIOP"
            },
            id: "3",
            type: "employee"
          }
        ],
        included: [
          {
            attributes: {
              name: "Warehouse"
            },
            id: "1",
            type: "department"
          }
        ]
      })
    );
    expect(mockEmployeeDbFindAll.mock.calls).toEqual([
      [
        expect.objectContaining({
          limit: 20,
          offset: 0
        })
      ]
    ]);
    expect(mockDepartmentDbFindByPk).toHaveBeenCalledTimes(2);
  });
});
