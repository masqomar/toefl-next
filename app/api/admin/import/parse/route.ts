import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import path from "path";

interface Question {
  questionText: string;
  passageText?: string;
  audioUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
}

interface Section {
  title: string;
  sectionType: string;
  duration: number;
  questions: Question[];
}

interface ParseResult {
  success: boolean;
  sections: Section[];
  errors: string[];
  totalQuestions: number;
}

function parseCSV(content: string): Question[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const questions: Question[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handle quoted fields)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Expected columns: questionText, passageText, audioUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation
    if (values.length >= 8) {
      questions.push({
        questionText: values[0] || "",
        passageText: values[1] || "",
        audioUrl: values[2] || "",
        optionA: values[3] || "",
        optionB: values[4] || "",
        optionC: values[5] || "",
        optionD: values[6] || "",
        correctAnswer: (values[7] || "A").toUpperCase(),
        explanation: values[8] || "",
      });
    }
  }

  return questions;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { filepath, sectionType, sectionTitle, sectionDuration } = body;

    if (!filepath) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file
    const fullPath = path.join(process.cwd(), "public", filepath.replace(/^\//, ""));
    const content = await readFile(fullPath, "utf-8");

    // Parse CSV
    const questions = parseCSV(content);

    if (questions.length === 0) {
      return NextResponse.json({ error: "No valid questions found in file" }, { status: 400 });
    }

    // Validate questions
    const errors: string[] = [];
    questions.forEach((q, idx) => {
      if (!q.questionText) errors.push(`Row ${idx + 2}: Question text is required`);
      if (!q.optionA) errors.push(`Row ${idx + 2}: Option A is required`);
      if (!q.optionB) errors.push(`Row ${idx + 2}: Option B is required`);
      if (!q.optionC) errors.push(`Row ${idx + 2}: Option C is required`);
      if (!q.optionD) errors.push(`Row ${idx + 2}: Option D is required`);
      if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
        errors.push(`Row ${idx + 2}: Correct answer must be A, B, C, or D`);
      }
    });

    // Group questions by section type
    const sections: Section[] = [];
    const sectionKey = sectionType || "READING";

    sections.push({
      title: sectionTitle || `${sectionKey} Section`,
      sectionType: sectionKey,
      duration: sectionDuration || 30,
      questions,
    });

    const result: ParseResult = {
      success: errors.length === 0,
      sections,
      errors,
      totalQuestions: questions.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}