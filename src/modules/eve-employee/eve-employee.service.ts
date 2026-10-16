import { AppError } from "../../core/app-error.js";
import {
  Employee,
  type Department,
  type EmployeeStatus,
} from "../../db/models/employee.model.js";

export interface CreateEmployeeInput {
  name: string;
  department: Department;
  introduction: string;
}

export interface UpdateEmployeeInput {
  name?: string | null;
  department?: Department | null;
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
const CARD_ATTRIBUTES = ["id", "name", "department", "photoUrl", "status"];
const UPDATABLE_FIELDS = ["name", "department", "role", "status"] as const;

export type PublicEmployee = Omit<ReturnType<Employee["toJSON"]>, (typeof PRIVATE_FIELDS)[number]>;

export class EmployeeService {
  async list(page: number, limit: number): Promise<{ employees: Employee[]; pagination: Pagination }> {
    const { count, rows } = await Employee.findAndCountAll({
      attributes: { exclude: [...PRIVATE_FIELDS] },
      order: [["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      employees: rows,
      pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
    };
  }

  count(): Promise<number> {
    return Employee.count();
  }

  listOwnedBy(userId: number): Promise<Employee[]> {
    return Employee.findAll({ where: { createdBy: userId }, attributes: CARD_ATTRIBUTES });
  }

  async getCard(id: number): Promise<Employee> {
    const employee = await Employee.findByPk(id, { attributes: CARD_ATTRIBUTES });
    if (!employee) throw new AppError("Employee not found", 404);
    return employee;
  }

  findById(id: number): Promise<Employee | null> {
    return Employee.findByPk(id);
  }

  async getById(id: number): Promise<Employee> {
    const employee = await this.findById(id);
    if (!employee) throw new AppError("Employee not found", 404);
    return employee;
  }

  create(ownerId: number, input: CreateEmployeeInput, photoUrl: string | null): Promise<Employee> {
    const { name, department, introduction } = input;

    return Employee.create({
      name,
      department,
      introduction,
      photoUrl,
      createdBy: ownerId,
      knowledgeText: `Hello, I'm ${name}. I work in the ${department}. About me: ${introduction}`,
    });
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
    if (photoUrl) employee.photoUrl = photoUrl;

    await employee.save();
    return EmployeeService.toPublic(employee);
  }

  static toPublic(employee: Employee): PublicEmployee {
    const data = employee.toJSON();
    for (const field of PRIVATE_FIELDS) delete (data as Partial<typeof data>)[field];
    return data;
  }
}
