import { Employee } from "../../db/models/index.js";
import { askEmployee, summarizeIfLong } from "./chat.service.js";
import { extractText, getEgyptDateTime, MAX_KNOWLEDGE_LENGTH } from "./knowledge.js";

// Appends an uploaded file's text to the employee's knowledge.
// Returns { status, error } to send back on failure, or null on success.
const addFileToKnowledge = async (employee, file) => {
  let text;
  try {
    text = await extractText(file);
    if (text === null) return { status: 400, error: "Unsupported file type." };
    text = await summarizeIfLong(text);
  } catch (err) {
    console.error("❌ File analysis failed:", err);
    return { status: 500, error: "File analysis failed." };
  }

  const knowledge = `${employee.knowledgeText || ""}\n\n--- New Upload at ${getEgyptDateTime()} ---\n${text}`;
  if (knowledge.length > MAX_KNOWLEDGE_LENGTH) {
    return { status: 400, error: "The total knowledge size exceeds the allowed limit." };
  }

  employee.knowledgeText = knowledge;
  await employee.save();
  console.log("✅ Knowledge updated for employee:", employee.id);
  return null;
};

export const uploadAndChat = async (req, res) => {
  const { message: question, employeeId } = req.body;

  if (!question && !req.file) {
    return res.status(400).json({ error: "Either message or file is required." });
  }

  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found." });

    if (req.file) {
      const failure = await addFileToKnowledge(employee, req.file);
      if (failure) return res.status(failure.status).json({ error: failure.error });
    }

    const reply = await askEmployee(employee, question);
    if (!reply) {
      return res.status(500).json({ error: "No response generated from Cohere." });
    }
    return res.json({ reply });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};
