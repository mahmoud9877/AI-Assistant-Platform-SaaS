import { DataTypes } from "sequelize";
import sequelize from "../connection.js";

const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { len: [2, 20] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { timestamps: true }
);

export default User;
