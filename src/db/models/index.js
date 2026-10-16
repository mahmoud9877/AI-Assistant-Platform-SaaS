import User from "./user.model.js";
import Employee from "./employee.model.js";

User.hasMany(Employee, { foreignKey: "createdBy", as: "employees" });
Employee.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

export { User, Employee };
