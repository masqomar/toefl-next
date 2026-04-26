"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Question {
  answerId: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  passageText: string | null;
  audioUrl: string | null;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer: string | null;
}

interface Section {
  id: string;
  title: string;
  sectionType: string;
  duration: number;
  orderNumber: number;
  questions: Question[];
}

interface ExamData {
  sessionId: string;
  examId: string;
  examTitle: string;
  status: string;
  currentSection: number;
  startedAt: string;
  elapsedMinutes: number;
  sections: Section[];
}

interface ScoreResult {
  success: boolean;
  submitted: boolean;
  scores: {
    listening: { raw: number; total: number; scaled: number };
    structure: { raw: number; total: number; scaled: number };
    reading: { raw: number; total: number; scaled: number };
    totalScore: number;
    level: string;
  };
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(0);
  const [answeredInSection, setAnsweredInSection] = useState<Record<string, number>>({});
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [showConfirmNext, setShowConfirmNext] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const startRes = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
        if (!startRes.ok) {
          const err = await startRes.json();
          setError(err.error || "Failed to start exam");
          return;
        }
        const startData = await startRes.json();

        const sessionRes = await fetch(`/api/sessions/${startData.sessionId}`);
        if (!sessionRes.ok) {
          setError("Failed to load exam");
          return;
        }
        const sessionData = await sessionRes.json();
        setExamData(sessionData);

        // Restore existing answers
        const savedAnswers: Record<string, string> = {};
        const answered: Record<string, number> = {};
        sessionData.sections.forEach((section: Section) => {
          let count = 0;
          section.questions.forEach((q: Question) => {
            if (q.selectedAnswer) {
              savedAnswers[q.answerId] = q.selectedAnswer;
              count++;
            }
          });
          answered[section.id] = count;
        });
        setAnswers(savedAnswers);
        setAnsweredInSection(answered);

        // Calculate section time remaining
        const section = sessionData.sections[0];
        if (section) {
          const sectionSeconds = section.duration * 60;
          setSectionTimeRemaining(sectionSeconds);
        }
      } catch (e) {
        setError("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  // Timer countdown per section
  useEffect(() => {
    if (!examData || showSectionIntro || sectionTimeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSectionTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSectionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examData, showSectionIntro, currentSectionIndex]);

  const handleSectionTimeout = useCallback(() => {
    const currentSection = examData?.sections[currentSectionIndex];
    if (!currentSection) return;

    if (currentSectionIndex === examData.sections.length - 1) {
      // Last section - submit exam
      handleSubmit();
    } else {
      // Move to next section
      goToNextSection();
    }
  }, [examData, currentSectionIndex]);

  // Save answer
  const handleAnswerChange = useCallback(async (answerId: string, selectedAnswer: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [answerId]: selectedAnswer };

      // Update answered count for current section
      if (examData) {
        const currentSection = examData.sections[currentSectionIndex];
        if (currentSection) {
          const answeredCount = currentSection.questions.filter((q) => newAnswers[q.answerId]).length;
          setAnsweredInSection((prevCount) => ({
            ...prevCount,
            [currentSection.id]: answeredCount,
          }));
        }
      }

      return newAnswers;
    });

    try {
      await fetch(`/api/sessions/${examData?.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId, selectedAnswer }),
      });
    } catch (e) {
      console.error("Failed to save answer");
    }
  }, [examData, currentSectionIndex]);

  const startSection = () => {
    setShowSectionIntro(false);
    const currentSection = examData?.sections[currentSectionIndex];
    if (currentSection) {
      setSectionTimeRemaining(currentSection.duration * 60);
    }
  };

  const canGoNext = () => {
    if (!examData) return false;
    const currentSection = examData.sections[currentSectionIndex];
    if (!currentSection) return false;

    // Must answer all questions in current section
    const answeredCount = currentSection.questions.filter((q) => answers[q.answerId]).length;
    return answeredCount === currentSection.questions.length;
  };

  const goToNextSection = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowConfirmNext(false);

    if (currentSectionIndex < examData!.sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setShowSectionIntro(true);

      // Set timer for next section
      const nextSection = examData!.sections[currentSectionIndex + 1];
      setSectionTimeRemaining(nextSection.duration * 60);
    } else {
      // Last section completed
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!examData) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const res = await fetch(`/api/sessions/${examData.sessionId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      setScoreResult(data);
      setShowResults(true);
    } catch (e) {
      setError("Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <span className="text-6xl">⚠️</span>
            <h2 className="text-xl font-bold mt-4 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/dashboard/exams">
              <Button>Back to Exams</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state
  if (showResults && scoreResult) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <Badge variant="success" className="mb-4">Exam Completed</Badge>
            <CardTitle className="text-2xl">{examData?.examTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <p className="text-6xl font-bold text-blue-600">{scoreResult.scores.totalScore}</p>
              <Badge
                variant={scoreResult.scores.level === "A" ? "success" : scoreResult.scores.level === "B" ? "warning" : "danger"}
                className="mt-2 text-lg px-4 py-1"
              >
                Level {scoreResult.scores.level}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Listening</p>
                <p className="text-2xl font-bold text-blue-600">{scoreResult.scores.listening.scaled}</p>
                <p className="text-xs text-gray-500">
                  {scoreResult.scores.listening.raw}/{scoreResult.scores.listening.total}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Structure</p>
                <p className="text-2xl font-bold text-green-600">{scoreResult.scores.structure.scaled}</p>
                <p className="text-xs text-gray-500">
                  {scoreResult.scores.structure.raw}/{scoreResult.scores.structure.total}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Reading</p>
                <p className="text-2xl font-bold text-purple-600">{scoreResult.scores.reading.scaled}</p>
                <p className="text-xs text-gray-500">
                  {scoreResult.scores.reading.raw}/{scoreResult.scores.reading.total}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">Dashboard</Button>
              </Link>
              <Link href="/dashboard/history" className="flex-1">
                <Button className="w-full">View History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examData) return null;

  const currentSection = examData.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const answeredCount = currentSection?.questions.filter((q) => answers[q.answerId]).length || 0;
  const totalQuestionsInSection = currentSection?.questions.length || 0;

  // Section Intro Modal
  if (showSectionIntro) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-3xl mb-4">
              {currentSection.sectionType === "LISTENING" && "🎧"}
              {currentSection.sectionType === "STRUCTURE" && "📐"}
              {currentSection.sectionType === "READING" && "📚"}
            </div>
            <CardTitle className="text-2xl">{currentSection.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Questions</span>
                <span className="font-semibold">{totalQuestionsInSection}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Time Limit</span>
                <span className="font-semibold">{currentSection.duration} minutes</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Section</span>
                <span className="font-semibold">
                  {currentSectionIndex + 1} of {examData.sections.length}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> You must answer all questions in this section before proceeding to the next.
                The timer will start when you click &quot;Start Section&quot;.
              </p>
            </div>

            <Button onClick={startSection} className="w-full" size="lg">
              Start Section
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/exams" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{examData.examTitle}</h1>
              <p className="text-sm text-gray-500">{currentSection.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Section Progress */}
            <div className="hidden sm:block">
              <p className="text-sm text-gray-500">Section {currentSectionIndex + 1}/{examData.sections.length}</p>
              <div className="flex gap-1 mt-1">
                {examData.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentSectionIndex
                        ? "bg-blue-600"
                        : answeredInSection[section.id] === section.questions.length
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-right">
              <p className="text-sm text-gray-500">Time Left</p>
              <p className={`text-xl font-bold ${sectionTimeRemaining < 60 ? "text-red-600" : "text-gray-900"}`}>
                {formatTime(sectionTimeRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Section Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(answeredCount / totalQuestionsInSection) * 100}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Info */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Badge variant="info" className="text-sm">
              {currentSection.sectionType}
            </Badge>
          </div>
          <p className="text-gray-600">
            <span className="font-medium">{answeredCount}</span> / {totalQuestionsInSection} answered
          </p>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Question {currentQuestionIndex + 1} of {totalQuestionsInSection}
              </CardTitle>
              {answers[currentQuestion.answerId] && (
                <Badge variant="success">Answered</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Passage (if any) */}
            {currentQuestion.passageText && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium text-blue-800 mb-2">Passage:</p>
                <p className="text-gray-700 whitespace-pre-wrap">{currentQuestion.passageText}</p>
              </div>
            )}

            {/* Question text */}
            <p className="text-lg text-gray-900 mb-6">{currentQuestion.questionText}</p>

            {/* Options */}
            <div className="space-y-3">
              {["A", "B", "C", "D"].map((option) => (
                <label
                  key={option}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    answers[currentQuestion.answerId] === option
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.answerId}`}
                    value={option}
                    checked={answers[currentQuestion.answerId] === option}
                    onChange={() => handleAnswerChange(currentQuestion.answerId, option)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-700">{option}.</span>
                  <span className="text-gray-700">{currentQuestion.options[option as keyof typeof currentQuestion.options]}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex === totalQuestionsInSection - 1 ? (
            canGoNext() ? (
              currentSectionIndex === examData.sections.length - 1 ? (
                <Button onClick={() => setShowConfirmSubmit(true)} disabled={submitting}>
                  Submit Exam
                </Button>
              ) : (
                <Button onClick={() => setShowConfirmNext(true)}>
                  Next Section →
                </Button>
              )
            ) : (
              <span className="text-sm text-yellow-600">
                Answer all questions to continue
              </span>
            )
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </main>

      {/* Section Complete - Next Section Modal */}
      {showConfirmNext && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Section Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You have answered all {totalQuestionsInSection} questions in this section.
              </p>
              <p className="text-gray-600 mb-6">
                Ready to start <strong>{examData.sections[currentSectionIndex + 1].title}</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmNext(false)}>
                  Review Answers
                </Button>
                <Button className="flex-1" onClick={goToNextSection}>
                  Start Next Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Submit Exam?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmSubmit(false)}>
                  Continue Exam
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
