import type { Includeable, InferAttributes } from "sequelize";
import { AppError } from "../../core/app-error.js";
import { Department } from "../../db/models/department.model.js";
import { Employee, type EmployeeStatus } from "../../db/models/employee.model.js";

export interface CreateEmployeeInput {
  name: string;
  departmentId: number | string;
  introduction: string;
}

export interface UpdateEmployeeInput {
  name?: string | null;
  departmentId?: number | string | null;
  role?: string;
  status?: EmployeeStatus;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PRIVATE_FIELDS = ["knowledgeText", "createdAt", "updatedAt"] as const;
const CARD_ATTRIBUTES = ["id", "name", "role", "departmentId", "photoUrl", "status"];
const UPDATABLE_FIELDS = ["name", "role", "status"] as const;

// Every employee query loads its department's name, which responses show as `department`.
const WITH_DEPARTMENT: Includeable = { model: Department, as: "department", attributes: ["name"] };

type EmployeeData = InferAttributes<Employee>;

/** An employee as the API returns it: no private fields, `department` as the department's name. */
export type PublicEmployee = Omit<EmployeeData, (typeof PRIVATE_FIELDS)[number] | "department"> & {
  department: string | null;
};

export class EmployeeService {
  async list(page: number, limit: number): Promise<{ employees: PublicEmployee[]; pagination: Pagination }> {
    const { count, rows } = await Employee.findAndCountAll({
      attributes: { exclude: [...PRIVATE_FIELDS] },
      include: [WITH_DEPARTMENT],
      order: [["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      employees: rows.map(EmployeeService.toPublic),
      pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
    };
  }

  count(): Promise<number> {
    return Employee.count();
  }

  async listOwnedBy(userId: number): Promise<PublicEmployee[]> {
    const employees = await Employee.findAll({
      where: { createdBy: userId },
      attributes: CARD_ATTRIBUTES,
      include: [WITH_DEPARTMENT],
    });
    return employees.map(EmployeeService.toPublic);
  }

  async getCard(id: number): Promise<PublicEmployee> {
    const employee = await Employee.findByPk(id, { attributes: CARD_ATTRIBUTES, include: [WITH_DEPARTMENT] });
    if (!employee) throw new AppError("Employee not found", 404);
    return EmployeeService.toPublic(employee);
  }

  findById(id: number): Promise<Employee | null> {
    return Employee.findByPk(id, { include: [WITH_DEPARTMENT] });
  }

  async getById(id: number): Promise<Employee> {
    const employee = await this.findById(id);
    if (!employee) throw new AppError("Employee not found", 404);
    return employee;
  }

  async create(ownerId: number, input: CreateEmployeeInput, photoUrl: string | null): Promise<PublicEmployee> {
    const { name, introduction } = input;
    const departmentId = await EmployeeService.existingDepartmentId(input.departmentId);

    const employee = await Employee.create({ name, departmentId, introduction, photoUrl, createdBy: ownerId });
    return this.getCard(employee.id);
  }

  async update(
    id: number,
    ownerId: number,
    input: UpdateEmployeeInput,
    photoUrl: string | null
  ): Promise<PublicEmployee> {
    const employee = await this.getById(id);
    if (employee.createdBy !== ownerId) {
      throw new AppError("You can only update your own employees", 403);
    }

    for (const field of UPDATABLE_FIELDS) {
      if (input[field] !== undefined) employee.set(field, input[field]);
    }
    if (input.departmentId !== undefined) {
      employee.departmentId =
        input.departmentId === null ? null : await EmployeeService.existingDepartmentId(input.departmentId);
    }
    if (photoUrl) employee.photoUrl = photoUrl;

    await employee.save();
    await employee.reload({ include: [WITH_DEPARTMENT] });
    return EmployeeService.toPublic(employee);
  }

  static toPublic(employee: Employee): PublicEmployee {
    const { department, ...data } = employee.toJSON() as EmployeeData & { department?: { name: string } | null };
    for (const field of PRIVATE_FIELDS) delete (data as Partial<EmployeeData>)[field];
    return { ...data, department: department?.name ?? null };
  }

  // Multipart forms send ids as strings.
  private static async existingDepartmentId(value: number | string): Promise<number> {
    const id = Number(value);
    if (!Number.isInteger(id) || !(await Department.findByPk(id, { attributes: ["id"] }))) {
      throw new AppError("Unknown department. Pick one from the list.", 400);
    }
    return id;
  }
}
