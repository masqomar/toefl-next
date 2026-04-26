"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SessionResult {
  id: string;
  examId: string;
  examTitle: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  result: {
    totalScore: number;
    listeningScaled: number;
    structureScaled: number;
    readingScaled: number;
    level: string;
  } | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (e) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
          <p className="text-gray-600 mt-1">View your past exam attempts and results</p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <span className="text-6xl">📭</span>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No exam history yet</h3>
              <p className="mt-2 text-gray-600">Start taking exams to see your history here</p>
              <Link href="/dashboard/exams" className="inline-block mt-4">
                <Button>Browse Exams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
        <p className="text-gray-600 mt-1">View your past exam attempts and results</p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{session.examTitle}</h3>
                    <Badge
                      variant={
                        session.status === "FINISHED"
                          ? "success"
                          : session.status === "AUTO_SUBMITTED"
                          ? "warning"
                          : "info"
                      }
                    >
                      {session.status === "FINISHED"
                        ? "Completed"
                        : session.status === "AUTO_SUBMITTED"
                        ? "Auto-Submitted"
                        : "In Progress"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(session.startedAt)}
                    {session.submittedAt && (
                      <> — {formatDate(session.submittedAt)}</>
                    )}
                  </p>
                </div>

                {session.result ? (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {session.result.totalScore}
                      </p>
                      <Badge
                        variant={
                          session.result.level === "A"
                            ? "success"
                            : session.result.level === "B"
                            ? "warning"
                            : "danger"
                        }
                        className="mt-1"
                      >
                        Level {session.result.level}
                      </Badge>
                    </div>
                  </div>
                ) : session.status === "IN_PROGRESS" ? (
                  <Link href={`/exam/${session.examId}`}>
                    <Button size="sm">Continue</Button>
                  </Link>
                ) : null}
              </div>

              {session.result && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Listening</p>
                      <p className="font-bold text-blue-600">{session.result.listeningScaled}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Structure</p>
                      <p className="font-bold text-green-600">{session.result.structureScaled}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Reading</p>
                      <p className="font-bold text-purple-600">{session.result.readingScaled}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
