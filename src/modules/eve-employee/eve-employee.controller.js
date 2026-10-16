import { Employee } from "../../db/models/index.js";
import { photoUrlFor } from "../../middleware/upload.js";
import { AppError, asyncHandler } from "../../utils/app-error.js";

const PUBLIC_EXCLUDE = ["knowledgeText", "createdAt", "updatedAt"];
const CARD_ATTRIBUTES = ["id", "name", "department", "photoUrl", "status"];

const withoutPrivateFields = (employee) => {
  const data = employee.toJSON();
  PUBLIC_EXCLUDE.forEach((key) => delete data[key]);
  return data;
};

export const getAllEveEmployees = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const { count, rows } = await Employee.findAndCountAll({
    attributes: { exclude: PUBLIC_EXCLUDE },
    order: [["id", "ASC"]],
    limit,
    offset: (page - 1) * limit,
  });

  return res.status(200).json({
    employees: rows,
    pagination: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
  });
});

export const countEveEmployees = asyncHandler(async (req, res) => {
  return res.status(200).json({ count: await Employee.count() });
});

export const getMyEveEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.findAll({
    where: { createdBy: req.user.id },
    attributes: CARD_ATTRIBUTES,
  });

  return res.status(200).json({ message: "Done", employees });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findByPk(req.params.id, { attributes: CARD_ATTRIBUTES });
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  return res.status(200).json(employee);
});

export const createEveEmployee = asyncHandler(async (req, res) => {
  const { name, department, introduction } = req.body;

  const eveEmployee = await Employee.create({
    name,
    department,
    introduction,
    photoUrl: photoUrlFor(req.file),
    createdBy: req.user.id,
    knowledgeText: `Hello, I'm ${name}. I work in the ${department}. About me: ${introduction}`,
  });

  return res.status(201).json({ message: "Done", eveEmployee });
});

export const updateEveEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }
  if (employee.createdBy !== req.user.id) {
    throw new AppError("You can only update your own employees", 403);
  }

  for (const field of ["name", "department", "role", "status"]) {
    if (req.body[field] !== undefined) employee[field] = req.body[field];
  }
  if (req.file) {
    employee.photoUrl = photoUrlFor(req.file);
  }

  await employee.save();
  return res.status(200).json(withoutPrivateFields(employee));
});
