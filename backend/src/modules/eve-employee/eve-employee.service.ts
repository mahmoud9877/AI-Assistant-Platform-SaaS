import fs from "fs/promises";
import path from "path";
import { Op, type Includeable, type InferAttributes, type WhereOptions } from "sequelize";
import { AppError } from "../../core/app-error.js";
import { Department } from "../../db/models/department.model.js";
import { Employee, type EmployeeStatus, type ReplyLanguage, type Tone } from "../../db/models/employee.model.js";

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
  introduction?: string;
  tone?: Tone;
  replyLanguage?: ReplyLanguage;
  customInstructions?: string | null;
}

/** Filters for the office's employee list. */
export interface EmployeeFilters {
  /** Matches the employee's or their department's name. */
  search?: string;
  departmentId?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// customInstructions are the owner's business; the owner reads them through getSettings().
const PRIVATE_FIELDS = ["knowledgeText", "customInstructions", "createdAt", "updatedAt"] as const;
const CARD_ATTRIBUTES = ["id", "name", "role", "departmentId", "photoUrl", "status"];
const UPDATABLE_FIELDS = ["name", "role", "status", "introduction", "tone", "replyLanguage"] as const;

// Every employee query loads its department's name, which responses show as `department`.
const WITH_DEPARTMENT: Includeable = { model: Department, as: "department", attributes: ["name"] };

type EmployeeData = InferAttributes<Employee>;

/** An employee as the API returns it: no private fields, `department` as the department's name. */
export type PublicEmployee = Omit<EmployeeData, (typeof PRIVATE_FIELDS)[number] | "department"> & {
  department: string | null;
};

/** Everything the owner can edit about their EVE. */
export type EmployeeSettings = PublicEmployee & { customInstructions: string | null };

export class EmployeeService {
  /** @param uploadsDir where uploaded photos are stored, so replaced or orphaned ones can be removed. */
  constructor(private readonly uploadsDir?: string) {}

  async list(
    page: number,
    limit: number,
    { search, departmentId }: EmployeeFilters = {}
  ): Promise<{ employees: PublicEmployee[]; pagination: Pagination }> {
    const where: WhereOptions[] = [];
    if (departmentId) where.push({ departmentId });
    if (search?.trim()) {
      // \ % and _ are LIKE wildcards; escape them so they match literally.
      const pattern = `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      where.push({ [Op.or]: [{ name: { [Op.like]: pattern } }, { "$department.name$": { [Op.like]: pattern } }] });
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: { [Op.and]: where },
      attributes: { exclude: [...PRIVATE_FIELDS] },
      include: [WITH_DEPARTMENT],
      order: [["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
      // Lets the search refer to the joined department's name; one department per employee, so no duplicates.
      subQuery: false,
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

  /** The owner's full view of their EVE, for the settings page. */
  async getSettings(id: number, ownerId: number): Promise<EmployeeSettings> {
    const employee = await this.getOwned(id, ownerId);
    return { ...EmployeeService.toPublic(employee), customInstructions: employee.customInstructions ?? null };
  }

  /** Deletes the EVE with its conversations and knowledge (by cascade) and its photo. */
  async remove(id: number, ownerId: number): Promise<void> {
    const employee = await this.getOwned(id, ownerId);
    const { photoUrl } = employee;
    await employee.destroy();
    await this.removePhoto(photoUrl);
  }

  async update(
    id: number,
    ownerId: number,
    input: UpdateEmployeeInput,
    photoUrl: string | null
  ): Promise<PublicEmployee> {
    const employee = await this.getOwned(id, ownerId);
    const previousPhoto = employee.photoUrl;

    for (const field of UPDATABLE_FIELDS) {
      if (input[field] !== undefined) employee.set(field, input[field]);
    }
    if (input.departmentId !== undefined) {
      employee.departmentId =
        input.departmentId === null ? null : await EmployeeService.existingDepartmentId(input.departmentId);
    }
    if (input.customInstructions !== undefined) {
      employee.customInstructions = input.customInstructions?.trim() || null;
    }
    if (photoUrl) employee.photoUrl = photoUrl;

    await employee.save();
    if (photoUrl && previousPhoto !== photoUrl) await this.removePhoto(previousPhoto);
    await employee.reload({ include: [WITH_DEPARTMENT] });
    return EmployeeService.toPublic(employee);
  }

  private async getOwned(id: number, ownerId: number): Promise<Employee> {
    const employee = await this.getById(id);
    if (employee.createdBy !== ownerId) {
      throw new AppError("You can only change your own employees", 403);
    }
    return employee;
  }

  // Best effort: a photo that is already gone is not an error.
  private async removePhoto(photoUrl: string | null): Promise<void> {
    if (!photoUrl || !this.uploadsDir || !photoUrl.startsWith("/uploads/")) return;
    await fs.unlink(path.join(this.uploadsDir, path.basename(photoUrl))).catch(() => {});
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
