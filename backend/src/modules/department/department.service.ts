import { fn, col, UniqueConstraintError } from "sequelize";
import { AppError } from "../../core/app-error.js";
import { Department } from "../../db/models/department.model.js";
import { Employee } from "../../db/models/employee.model.js";

export interface DepartmentView {
  id: number;
  name: string;
  /** EVE employees in this department. */
  employeeCount: number;
}

export class DepartmentService {
  /** Every department, alphabetically, with how many employees each has. */
  async list(): Promise<DepartmentView[]> {
    const [departments, counts] = await Promise.all([
      Department.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]] }),
      Employee.findAll({
        attributes: ["departmentId", [fn("COUNT", col("id")), "count"]],
        group: ["departmentId"],
        raw: true,
      }) as unknown as Promise<{ departmentId: number | null; count: number }[]>,
    ]);
    const countById = new Map(counts.map((row) => [row.departmentId, Number(row.count)]));
    return departments.map(({ id, name }) => ({ id, name, employeeCount: countById.get(id) ?? 0 }));
  }

  async create(name: string): Promise<DepartmentView> {
    const department = await DepartmentService.saving(() => Department.create({ name: name.trim() }));
    return { id: department.id, name: department.name, employeeCount: 0 };
  }

  async rename(id: number, name: string): Promise<DepartmentView> {
    const department = await DepartmentService.get(id);
    department.name = name.trim();
    await DepartmentService.saving(() => department.save());
    return { id, name: department.name, employeeCount: await Employee.count({ where: { departmentId: id } }) };
  }

  async remove(id: number): Promise<void> {
    const department = await DepartmentService.get(id);
    const employees = await Employee.count({ where: { departmentId: id } });
    if (employees > 0) {
      throw new AppError(
        `"${department.name}" still has ${employees} EVE employee${employees === 1 ? "" : "s"}. Move them to another department first.`,
        409
      );
    }
    await department.destroy();
  }

  private static async get(id: number): Promise<Department> {
    const department = await Department.findByPk(id);
    if (!department) throw new AppError("Department not found", 404);
    return department;
  }

  // Names are unique ignoring case; a clash becomes a readable 409.
  private static async saving<T>(save: () => Promise<T>): Promise<T> {
    try {
      return await save();
    } catch (err) {
      if (err instanceof UniqueConstraintError) throw new AppError("A department with this name already exists.", 409);
      throw err;
    }
  }
}
