"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ExamSection {
  id: string;
  title: string;
  sectionType: string;
  duration: number;
  questionCount: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: string;
  price: number;
  totalQuestions: number;
  totalDuration: number;
  sections: ExamSection[];
  hasAccess: boolean;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch("/api/exams");
        if (res.ok) {
          const data = await res.json();
          setExams(data);
        }
      } catch (e) {
        console.error("Failed to fetch exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
          <p className="text-gray-600 mt-1">No exams available at the moment</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-6xl">📚</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Exams Available</h3>
            <p className="mt-2 text-gray-600">Check back later for new practice tests</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
        <p className="text-gray-600 mt-1">Choose an exam to start practicing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                  📝
                </div>
                <Badge variant={exam.type === "FREE" ? "success" : "warning"}>
                  {exam.type}
                </Badge>
              </div>
              <CardTitle className="mt-4">{exam.title}</CardTitle>
              <CardDescription>{exam.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span>{exam.totalQuestions} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span>{exam.totalDuration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📚</span>
                  <span>{exam.sections.length} sections</span>
                </div>
              </div>

              {exam.hasAccess ? (
                <Link href={`/exam/${exam.id}`} className="block">
                  <Button className="w-full">
                    Start Exam
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  No Access
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900">How it works</h3>
              <p className="text-sm text-blue-700 mt-1">
                Free exams are available immediately. Paid exams require purchase or voucher code.
                Once you start an exam, you have limited time to complete all sections.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
