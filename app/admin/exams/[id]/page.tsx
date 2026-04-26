"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AudioUploader } from "@/components/ui/AudioUploader";

interface Question {
  id?: string;
  questionNumber: number;
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
  id?: string;
  title: string;
  sectionType: string;
  duration: number;
  questions: Question[];
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  type: string;
  price: number;
  status: boolean;
  maxViolations: number;
  maxAudioReplay: number;
  sections: Section[];
}

export default function AdminExamEditPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const isNew = examId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [exam, setExam] = useState<Partial<Exam>>({
    title: "",
    description: "",
    type: "FREE",
    price: 0,
    status: true,
    maxViolations: 5,
    maxAudioReplay: 2,
    sections: [],
  });

  useEffect(() => {
    if (!isNew && examId) {
      fetch(`/api/admin/exams/${examId}`)
        .then((res) => res.json())
        .then((data) => {
          setExam(data);
        })
        .catch(() => setError("Failed to load exam"))
        .finally(() => setLoading(false));
    }
  }, [examId, isNew]);

  const handleSave = async () => {
    if (!exam.title) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isNew ? "/api/admin/exams" : `/api/admin/exams/${examId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exam),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      router.push(`/admin/exams/${data.id}`);
      router.refresh();
    } catch (e) {
      setError("Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const sectionTypes = ["LISTENING", "STRUCTURE", "READING"];
    const newSection: Section = {
      title: "",
      sectionType: sectionTypes[exam.sections?.length || 0] || "READING",
      duration: 30,
      questions: [],
    };
    setExam({ ...exam, sections: [...(exam.sections || []), newSection] });
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const sections = [...(exam.sections || [])];
    sections[index] = { ...sections[index], ...updates };
    setExam({ ...exam, sections });
  };

  const removeSection = (index: number) => {
    const sections = [...(exam.sections || [])];
    sections.splice(index, 1);
    setExam({ ...exam, sections });
  };

  const addQuestion = (sectionIndex: number) => {
    const sections = [...(exam.sections || [])];
    const questions = [...(sections[sectionIndex].questions || [])];
    questions.push({
      questionNumber: questions.length + 1,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
    });
    sections[sectionIndex] = { ...sections[sectionIndex], questions };
    setExam({ ...exam, sections });
  };

  const updateQuestion = (sectionIndex: number, qIndex: number, updates: Partial<Question>) => {
    const sections = [...(exam.sections || [])];
    const questions = [...(sections[sectionIndex].questions || [])];
    questions[qIndex] = { ...questions[qIndex], ...updates };
    sections[sectionIndex] = { ...sections[sectionIndex], questions };
    setExam({ ...exam, sections });
  };

  const removeQuestion = (sectionIndex: number, qIndex: number) => {
    const sections = [...(exam.sections || [])];
    const questions = [...(sections[sectionIndex].questions || [])];
    questions.splice(qIndex, 1);
    // Renumber
    questions.forEach((q, i) => (q.questionNumber = i + 1));
    sections[sectionIndex] = { ...sections[sectionIndex], questions };
    setExam({ ...exam, sections });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/exams" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Exams
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Create Exam" : "Edit Exam"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/exams")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Exam"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={exam.title || ""}
              onChange={(e) => setExam({ ...exam, title: e.target.value })}
              placeholder="TOEFL ITP Practice Test"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={exam.description || ""}
              onChange={(e) => setExam({ ...exam, description: e.target.value })}
              placeholder="Full-length practice test..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={exam.type || "FREE"}
                onChange={(e) => setExam({ ...exam, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <Input
                type="number"
                value={exam.price || 0}
                onChange={(e) => setExam({ ...exam, price: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Violations</label>
              <Input
                type="number"
                value={exam.maxViolations || 5}
                onChange={(e) => setExam({ ...exam, maxViolations: parseInt(e.target.value) || 5 })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio Replays</label>
              <Input
                type="number"
                value={exam.maxAudioReplay || 2}
                onChange={(e) => setExam({ ...exam, maxAudioReplay: parseInt(e.target.value) || 2 })}
                min={0}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="status"
              checked={exam.status ?? true}
              onChange={(e) => setExam({ ...exam, status: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Active (visible to users)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sections</CardTitle>
          <Button variant="outline" size="sm" onClick={addSection}>
            + Add Section
          </Button>
        </CardHeader>
        <CardContent>
          {(!exam.sections || exam.sections.length === 0) ? (
            <p className="text-gray-500 text-center py-8">
              No sections yet. Click "Add Section" to create one.
            </p>
          ) : (
            <div className="space-y-6">
              {exam.sections?.map((section, sIdx) => (
                <div key={sIdx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                          placeholder="Listening Comprehension"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={section.sectionType}
                          onChange={(e) => updateSection(sIdx, { sectionType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LISTENING">Listening</option>
                          <option value="STRUCTURE">Structure</option>
                          <option value="READING">Reading</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                        <Input
                          type="number"
                          value={section.duration}
                          onChange={(e) => updateSection(sIdx, { duration: parseInt(e.target.value) || 30 })}
                          min={1}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(sIdx)}
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Questions */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Questions ({section.questions?.length || 0})
                      </h4>
                      <Button variant="outline" size="sm" onClick={() => addQuestion(sIdx)}>
                        + Add Question
                      </Button>
                    </div>

                    {(!section.questions || section.questions.length === 0) ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No questions yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {section.questions.map((q, qIdx) => (
                          <div key={qIdx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant="info">Q{qIdx + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(sIdx, qIdx)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ✕
                              </Button>
                            </div>

                            {section.sectionType === "LISTENING" && (
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
                                <AudioUploader
                                  value={q.audioUrl || ""}
                                  onChange={(url) => updateQuestion(sIdx, qIdx, { audioUrl: url })}
                                />
                              </div>
                            )}

                            {section.sectionType === "READING" && (
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Passage</label>
                                <textarea
                                  value={q.passageText || ""}
                                  onChange={(e) => updateQuestion(sIdx, qIdx, { passageText: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  rows={4}
                                  placeholder="Reading passage text..."
                                />
                              </div>
                            )}

                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                              <Input
                                value={q.questionText}
                                onChange={(e) => updateQuestion(sIdx, qIdx, { questionText: e.target.value })}
                                placeholder="What is the main idea of the passage?"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {["A", "B", "C", "D"].map((opt) => (
                                <div key={opt}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Option {opt}
                                  </label>
                                  <Input
                                    value={q[`option${opt}` as keyof Question] as string}
                                    onChange={(e) => updateQuestion(sIdx, qIdx, { [`option${opt}`]: e.target.value } as any)}
                                    placeholder={`Option ${opt}`}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correct Answer
                              </label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => updateQuestion(sIdx, qIdx, { correctAnswer: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>

                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                              <Input
                                value={q.explanation || ""}
                                onChange={(e) => updateQuestion(sIdx, qIdx, { explanation: e.target.value })}
                                placeholder="Why is this the correct answer?"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
