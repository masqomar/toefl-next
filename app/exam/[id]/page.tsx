"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAntiCheat } from "@/components/AntiCheatProvider";

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
  maxViolations: number;
  maxAudioReplay: number;
  violationCount: number;
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
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [isMaxReached, setIsMaxReached] = useState(false);
  const [audioReplayCount, setAudioReplayCount] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examDataRef = useRef(examData);
  const maxViolationsRef = useRef(5);
  const isMaxReachedRef = useRef(false);
  const audioReplayCountRef = useRef<Record<string, number>>({});

  // Keep refs in sync with state
  useEffect(() => {
    examDataRef.current = examData;
    if (examData?.maxViolations) {
      maxViolationsRef.current = examData.maxViolations;
    }
  }, [examData]);

  useEffect(() => {
    isMaxReachedRef.current = isMaxReached;
  }, [isMaxReached]);

  // Initialize violationCount from server when examData loads
  useEffect(() => {
    if (examData && examData.violationCount !== undefined) {
      setViolationCount(examData.violationCount);
      if (examData.violationCount >= examData.maxViolations) {
        setIsMaxReached(true);
        isMaxReachedRef.current = true;
      }
    }
  }, [examData]);

  // Redirect if already maxed out
  useEffect(() => {
    if (isMaxReached && examData) {
      router.push(`/exam/${examId}/kicked-out`);
    }
  }, [isMaxReached, examData, router, examId]);

  // Keep audioReplayCountRef in sync with state
  useEffect(() => {
    audioReplayCountRef.current = audioReplayCount;
  }, [audioReplayCount]);

  // Reset audio state when changing questions
  useEffect(() => {
    // Stop and cleanup any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear source
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioStarted(false);
  }, [currentQuestionIndex, currentSectionIndex]);

  // Audio internal function
  const playAudioInternal = (audioUrl: string) => {
    const currentReplay = audioReplayCountRef.current[audioUrl] || 0;
    const maxReplay = examDataRef.current?.maxAudioReplay || 2;

    if (currentReplay >= maxReplay) {
      return;
    }

    // Stop any existing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setAudioStarted(true);
    setIsPlaying(true);

    // Try to play
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Success - audio is playing
        })
        .catch((err) => {
          console.error("Audio play failed:", err);
          setIsPlaying(false);
        });
    }

    audio.onended = () => {
      setIsPlaying(false);
      // Increment replay count
      setAudioReplayCount((prev) => ({
        ...prev,
        [audioUrl]: (prev[audioUrl] || 0) + 1,
      }));
    };

    audio.onerror = (e) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };
  };

  // Navigate to question with auto-play audio for listening
  const navigateToQuestion = (idx: number) => {
    const question = currentSection?.questions[idx];
    setCurrentQuestionIndex(idx);

    // Auto-play audio for listening section
    if (currentSection?.sectionType === "LISTENING" && question?.audioUrl) {
      // Use setTimeout to ensure state updates first
      setTimeout(() => {
        playAudioInternal(question.audioUrl!);
      }, 150);
    }
  };

  // Handle violation - increment counter and show warning
  const handleViolation = useCallback(() => {
    // Guard: already at max or no exam data yet
    if (isMaxReachedRef.current || !examDataRef.current) return;

    const maxV = maxViolationsRef.current;
    const sessionId = examDataRef.current.sessionId;

    setViolationCount((prev) => {
      const newCount = prev + 1;
      // Check max violations
      if (newCount >= maxV) {
        setIsMaxReached(true);
        isMaxReachedRef.current = true;
        // Force submit and redirect to kicked-out page
        fetch(`/api/sessions/${sessionId}/submit`, { method: "POST" })
          .then(() => {
            router.push(`/exam/${examId}/kicked-out`);
          });
        return newCount;
      }
      return newCount;
    });
    setShowViolationWarning(true);
    // Auto-hide warning after 3 seconds
    setTimeout(() => {
      setShowViolationWarning(false);
    }, 3000);
  }, [router, examId]);

  // Anti-cheat hook - only passes callback, no internal counter
  useAntiCheat({
    sessionId: examData?.sessionId || "",
    onViolation: handleViolation,
    enabled: !showSectionIntro && !showResults && !isMaxReached,
    maxViolations: examData?.maxViolations || 5,
  });

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
      handleSubmit();
    } else {
      goToNextSection();
    }
  }, [examData, currentSectionIndex]);

  // Save answer
  const handleAnswerChange = useCallback(async (answerId: string, selectedAnswer: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [answerId]: selectedAnswer };

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

      // Reset audio state for new section
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setAudioReplayCount({});

      // Auto-play audio for listening section (after user click = allowed)
      if (currentSection.sectionType === "LISTENING" && currentSection.questions[0]?.audioUrl) {
        setTimeout(() => {
          playAudioInternal(currentSection.questions[0].audioUrl!);
        }, 150);
      }
    }
  };

  const canGoNext = () => {
    if (!examData) return false;
    const currentSection = examData.sections[currentSectionIndex];
    if (!currentSection) return false;

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

      const nextSection = examData!.sections[currentSectionIndex + 1];
      setSectionTimeRemaining(nextSection.duration * 60);
    } else {
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

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Anti-Cheat Active</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tab switching is monitored</li>
                    <li>Copy/paste is disabled</li>
                    <li>Right-click is disabled</li>
                    <li>After {examData.maxViolations} violations, exam will auto-submit</li>
                  </ul>
                </div>
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
      {/* Violation Warning Toast */}
      {showViolationWarning && !isMaxReached && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">Violation detected! Be careful.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-lg">🔒</span>
              <span className="text-sm text-gray-500 hidden sm:inline">Proctored</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-gray-300" />
            <div>
              <h1 className="font-semibold text-gray-900">{examData.examTitle}</h1>
              <p className="text-sm text-gray-500">{currentSection.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Violations Counter */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Violations</p>
              <p className={`text-lg font-bold ${violationCount >= 3 ? "text-red-600" : "text-gray-900"}`}>
                {violationCount}/{examData.maxViolations}
              </p>
            </div>

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
              <p className={`text-xl font-bold ${sectionTimeRemaining < 60 ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Question Panel */}
          <div className="flex-1">
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
                {/* Audio Player for Listening Section */}
                {currentSection.sectionType === "LISTENING" && currentQuestion.audioUrl && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => playAudioInternal(currentQuestion.audioUrl!)}
                          disabled={isPlaying || audioReplayCount[currentQuestion.audioUrl!] >= (examData?.maxAudioReplay || 2) || submitting || isMaxReached}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            isPlaying
                              ? "bg-purple-300 cursor-not-allowed"
                              : audioReplayCount[currentQuestion.audioUrl!] >= (examData?.maxAudioReplay || 2)
                              ? "bg-gray-200 cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          } disabled:opacity-50`}
                        >
                          {isPlaying ? (
                            <span className="text-xl animate-pulse">⏸️</span>
                          ) : (
                            <span className="text-xl">🔄</span>
                          )}
                        </button>
                        <div>
                          <p className="font-medium text-purple-900">
                            {isPlaying ? "Playing..." : audioStarted ? "Audio" : "Tap to Play"}
                          </p>
                          <p className="text-sm text-purple-700">
                            Replay: {audioReplayCount[currentQuestion.audioUrl!] || 0} / {examData?.maxAudioReplay || 2}
                          </p>
                        </div>
                      </div>
                      {audioStarted && audioReplayCount[currentQuestion.audioUrl!] >= (examData?.maxAudioReplay || 2) && (
                        <Badge variant="warning">Max Reached</Badge>
                      )}
                    </div>
                  </div>
                )}

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
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors select-none ${
                        submitting || isMaxReached
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-gray-50"
                      } ${
                        answers[currentQuestion.answerId] === option
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.answerId}`}
                        value={option}
                        checked={answers[currentQuestion.answerId] === option}
                        onChange={() => handleAnswerChange(currentQuestion.answerId, option)}
                        disabled={submitting || isMaxReached}
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
                onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0 || submitting || isMaxReached}
              >
                Previous
              </Button>

              {currentQuestionIndex === totalQuestionsInSection - 1 ? (
                canGoNext() ? (
                  currentSectionIndex === examData.sections.length - 1 ? (
                    <Button onClick={() => setShowConfirmSubmit(true)} disabled={submitting || isMaxReached}>
                      Submit Exam
                    </Button>
                  ) : (
                    <Button onClick={() => setShowConfirmNext(true)} disabled={isMaxReached}>
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
                  onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  disabled={submitting || isMaxReached}
                >
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:w-72">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {currentSection.questions.map((q, idx) => {
                    const isAnswered = !!answers[q.answerId];
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.answerId}
                        onClick={() => navigateToQuestion(idx)}
                        disabled={submitting || isMaxReached}
                        className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : isAnswered
                            ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-600"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
