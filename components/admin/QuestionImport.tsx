"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Question {
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

interface ImportedData {
  questions: Question[];
  errors: string[];
}

interface QuestionImportProps {
  onImport: (questions: Question[]) => void;
  sectionType?: "LISTENING" | "STRUCTURE" | "READING";
}

export function QuestionImport({ onImport, sectionType = "READING" }: QuestionImportProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ImportedData | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sectionTypes = [
    { value: "LISTENING", label: "Listening", icon: "🎧" },
    { value: "STRUCTURE", label: "Structure", icon: "📐" },
    { value: "READING", label: "Reading", icon: "📚" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    setPreview(null);

    try {
      // Upload file first
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();

      // Parse file
      const parseRes = await fetch("/api/admin/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filepath: uploadData.filepath,
          sectionType,
        }),
      });

      if (!parseRes.ok) {
        const data = await parseRes.json();
        throw new Error(data.error || "Parse failed");
      }

      const parseData = await parseRes.json();
      setPreview({
        questions: parseData.sections[0]?.questions || [],
        errors: parseData.errors || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = () => {
    if (preview?.questions) {
      onImport(preview.questions);
      setPreview(null);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError("");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📥</span>
          Import Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!preview ? (
          <div className="space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Download Template</p>
                <p className="text-sm text-blue-700">Use this CSV template to format your questions</p>
              </div>
              <a
                href="/templates/questions_template.csv"
                download
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Download CSV
              </a>
            </div>

            {/* Upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">📁</div>
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-gray-600">Processing...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-900 font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV files only, max 5MB
                    </p>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Format instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>First row must be headers</li>
                <li>Columns: Question, Passage, AudioURL, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation</li>
                <li>CorrectAnswer must be: A, B, C, or D</li>
                <li>For Listening: include AudioURL column</li>
                <li>For Reading: include Passage column</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview header */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">
                  Preview: {preview.questions.length} questions ready to import
                </p>
                {preview.errors.length > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {preview.errors.length} validation errors found
                  </p>
                )}
              </div>
              <Badge variant="success">{preview.questions.length} questions</Badge>
            </div>

            {/* Errors */}
            {preview.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Validation Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {preview.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {preview.errors.length > 10 && (
                    <li>... and {preview.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {/* Questions preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">Questions Preview (first 5)</h4>
              </div>
              <div className="divide-y max-h-64 overflow-y-auto">
                {preview.questions.slice(0, 5).map((q, idx) => (
                  <div key={idx} className="p-4">
                    <p className="font-medium text-gray-900 text-sm">
                      Q{idx + 1}: {q.questionText.substring(0, 80)}
                      {q.questionText.length > 80 ? "..." : ""}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>A: {q.optionA.substring(0, 30)}...</span>
                      <span>B: {q.optionB.substring(0, 30)}...</span>
                      <span>Answer: {q.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
              {preview.questions.length > 5 && (
                <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                  + {preview.questions.length - 5} more questions
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} className="flex-1" disabled={preview.errors.length > 0}>
                Import {preview.questions.length} Questions
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}