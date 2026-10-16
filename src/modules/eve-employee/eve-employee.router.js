import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as validators from "./eve-employee.validation.js";
import { uploadImage } from "../../middleware/upload.js";
import { validation } from "../../middleware/validation.js";
import * as eveEmployeeController from "./eve-employee.controller.js";

const router = Router();

router.use(auth());

router.get("/", validation(validators.list), eveEmployeeController.getAllEveEmployees);
router.get("/all", eveEmployeeController.countEveEmployees);
router.get("/my-employee", eveEmployeeController.getMyEveEmployees);
router.get("/:id", validation(validators.byId), eveEmployeeController.getEmployeeById);

router.post(
  "/",
  uploadImage.single("photoUrl"),
  validation(validators.create, ["body"]),
  eveEmployeeController.createEveEmployee
);

router.put(
  "/:id",
  uploadImage.single("photoUrl"),
  validation(validators.update, ["body", "params"]),
  eveEmployeeController.updateEveEmployee
);

export default router;
