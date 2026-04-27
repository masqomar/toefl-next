"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionCard, FormGrid, FormField, EmptyState, Tabs, LoadingSpinner } from "@/components/admin/AdminComponents";
import { QuestionImport } from "@/components/admin/QuestionImport";
import { AudioUploader } from "@/components/ui/AudioUploader";

interface Question {
  id?: string;
  questionNumber?: number;
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
  const [activeTab, setActiveTab] = useState("basic");

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

  const [selectedSection, setSelectedSection] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);

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
    if (!exam.title?.trim()) {
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
    const types = ["LISTENING", "STRUCTURE", "READING"];
    const durations: Record<string, number> = { LISTENING: 30, STRUCTURE: 25, READING: 55 };
    const type = types[exam.sections?.length || 0] || "READING";

    const newSection: Section = {
      title: `${type} Section`,
      sectionType: type,
      duration: durations[type],
      questions: [],
    };
    setExam({ ...exam, sections: [...(exam.sections || []), newSection] });
    setSelectedSection((exam.sections?.length || 0));
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
    setSelectedSection(Math.max(0, selectedSection - 1));
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
    questions.forEach((q, i) => (q.questionNumber = i + 1));
    sections[sectionIndex] = { ...sections[sectionIndex], questions };
    setExam({ ...exam, sections });
  };

  const handleImportQuestions = (questions: Question[], sectionIndex: number) => {
    const sections = [...(exam.sections || [])];
    const existingQuestions = sections[sectionIndex].questions || [];
    const newQuestions = questions.map((q, i) => ({
      ...q,
      questionNumber: existingQuestions.length + i + 1,
    }));
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      questions: [...existingQuestions, ...newQuestions],
    };
    setExam({ ...exam, sections });
    setShowImportModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner message="Loading exam..." />
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "📋" },
    { id: "sections", label: "Sections", icon: "📚" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const currentSection = exam.sections?.[selectedSection];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/admin/exams" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center gap-1">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Create Exam" : "Edit Exam"}</h1>
        </div>
        <div className="flex gap-3">
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

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          <SectionCard title="Basic Information" icon="📋">
            <div className="space-y-4">
              <FormField
                label="Exam Title"
                value={exam.title || ""}
                onChange={(v) => setExam({ ...exam, title: v as string })}
                placeholder="TOEFL ITP Practice Test"
                required
              />
              <FormField
                label="Description"
                value={exam.description || ""}
                onChange={(v) => setExam({ ...exam, description: v as string })}
                type="textarea"
                placeholder="Describe your exam..."
                rows={3}
              />
            </div>
          </SectionCard>

          <SectionCard title="Pricing" icon="💰">
            <FormGrid cols={2}>
              <FormField
                label="Type"
                value={exam.type || "FREE"}
                onChange={(v) => setExam({ ...exam, type: v as string })}
                type="select"
                options={[
                  { value: "FREE", label: "Free" },
                  { value: "PAID", label: "Paid" },
                ]}
              />
              <FormField
                label="Price ($)"
                value={exam.price || 0}
                onChange={(v) => setExam({ ...exam, price: v as number })}
                type="number"
                min={0}
                step={0.01}
                hint="Enter 0 for free exams"
              />
            </FormGrid>
          </SectionCard>
        </div>
      )}

      {activeTab === "sections" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section List */}
          <div className="lg:col-span-1">
            <SectionCard
              title="Sections"
              icon="📚"
              actions={
                <Button size="sm" variant="outline" onClick={addSection}>
                  + Add
                </Button>
              }
            >
              {!exam.sections?.length ? (
                <EmptyState
                  icon="📚"
                  title="No sections"
                  description="Add a section to start"
                  action={<Button size="sm" onClick={addSection}>Add Section</Button>}
                />
              ) : (
                <div className="space-y-2">
                  {exam.sections.map((section, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSection(idx)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSection === idx
                          ? "bg-blue-50 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{section.title}</p>
                          <p className="text-xs text-gray-500">
                            {section.sectionType} • {section.duration}min
                          </p>
                        </div>
                        <Badge variant="default">{section.questions?.length || 0}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Section Editor */}
          <div className="lg:col-span-3">
            {currentSection ? (
              <div className="space-y-6">
                <SectionCard
                  title={currentSection.title}
                  icon={currentSection.sectionType === "LISTENING" ? "🎧" : currentSection.sectionType === "STRUCTURE" ? "📐" : "📚"}
                  actions={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSection(selectedSection)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  }
                >
                  <FormGrid cols={3}>
                    <FormField
                      label="Title"
                      value={currentSection.title}
                      onChange={(v) => updateSection(selectedSection, { title: v as string })}
                    />
                    <FormField
                      label="Type"
                      value={currentSection.sectionType}
                      onChange={(v) => updateSection(selectedSection, { sectionType: v as string })}
                      type="select"
                      options={[
                        { value: "LISTENING", label: "Listening" },
                        { value: "STRUCTURE", label: "Structure" },
                        { value: "READING", label: "Reading" },
                      ]}
                    />
                    <FormField
                      label="Duration (minutes)"
                      value={currentSection.duration}
                      onChange={(v) => updateSection(selectedSection, { duration: v as number })}
                      type="number"
                      min={1}
                    />
                  </FormGrid>
                </SectionCard>

                {/* Questions */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Questions ({currentSection.questions?.length || 0})
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowImportModal(true)}
                    >
                      📥 Import
                    </Button>
                    <Button size="sm" onClick={() => addQuestion(selectedSection)}>
                      + Add
                    </Button>
                  </div>
                </div>

                {showImportModal && (
                  <QuestionImport
                    sectionType={currentSection.sectionType as "LISTENING" | "STRUCTURE" | "READING"}
                    onImport={(questions) => handleImportQuestions(questions, selectedSection)}
                  />
                )}

                {!currentSection.questions?.length ? (
                  <Card>
                    <CardContent className="py-12">
                      <EmptyState
                        icon="❓"
                        title="No questions yet"
                        description="Add questions manually or import from CSV"
                        action={
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => setShowImportModal(true)}>
                              📥 Import CSV
                            </Button>
                            <Button onClick={() => addQuestion(selectedSection)}>
                              + Add Question
                            </Button>
                          </div>
                        }
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {currentSection.questions.map((q, qIdx) => (
                      <Card key={qIdx}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <Badge variant="info">Question {qIdx + 1}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeQuestion(selectedSection, qIdx)}
                              className="text-red-600"
                            >
                              ✕
                            </Button>
                          </div>

                          {currentSection.sectionType === "LISTENING" && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
                              <AudioUploader
                                value={q.audioUrl || ""}
                                onChange={(url) => updateQuestion(selectedSection, qIdx, { audioUrl: url })}
                              />
                            </div>
                          )}

                          {currentSection.sectionType === "READING" && (
                            <div className="mb-4">
                              <FormField
                                label="Passage Text"
                                value={q.passageText || ""}
                                onChange={(v) => updateQuestion(selectedSection, qIdx, { passageText: v as string })}
                                type="textarea"
                                rows={4}
                                placeholder="Reading passage..."
                              />
                            </div>
                          )}

                          <FormField
                            label="Question Text"
                            value={q.questionText}
                            onChange={(v) => updateQuestion(selectedSection, qIdx, { questionText: v as string })}
                            type="textarea"
                            rows={2}
                            required
                          />

                          <FormGrid cols={2} className="mt-4">
                            <FormField
                              label="Option A"
                              value={q.optionA}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { optionA: v as string })}
                              required
                            />
                            <FormField
                              label="Option B"
                              value={q.optionB}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { optionB: v as string })}
                              required
                            />
                            <FormField
                              label="Option C"
                              value={q.optionC}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { optionC: v as string })}
                              required
                            />
                            <FormField
                              label="Option D"
                              value={q.optionD}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { optionD: v as string })}
                              required
                            />
                          </FormGrid>

                          <FormGrid cols={2} className="mt-4">
                            <FormField
                              label="Correct Answer"
                              value={q.correctAnswer}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { correctAnswer: v as string })}
                              type="select"
                              options={[
                                { value: "A", label: "A" },
                                { value: "B", label: "B" },
                                { value: "C", label: "C" },
                                { value: "D", label: "D" },
                              ]}
                            />
                            <FormField
                              label="Explanation"
                              value={q.explanation || ""}
                              onChange={(v) => updateQuestion(selectedSection, qIdx, { explanation: v as string })}
                            />
                          </FormGrid>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon="📚"
                    title="Select a section"
                    description="Choose a section from the list to edit questions"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
          <SectionCard title="Anti-Cheat Settings" icon="🔒">
            <FormGrid cols={2}>
              <FormField
                label="Max Violations"
                value={exam.maxViolations || 5}
                onChange={(v) => setExam({ ...exam, maxViolations: v as number })}
                type="number"
                min={1}
                max={10}
                hint="Auto-submit after this many violations"
              />
              <FormField
                label="Audio Replay Limit"
                value={exam.maxAudioReplay || 2}
                onChange={(v) => setExam({ ...exam, maxAudioReplay: v as number })}
                type="number"
                min={0}
                max={10}
                hint="Max replays per audio (0 = no limit)"
              />
            </FormGrid>
          </SectionCard>

          <SectionCard title="Status" icon="📊">
            <FormField
              label="Active"
              value={exam.status ?? true}
              onChange={(v) => setExam({ ...exam, status: v as boolean })}
              type="checkbox"
              hint="Exam will be visible to users"
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}