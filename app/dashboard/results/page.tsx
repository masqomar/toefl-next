import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const results = await prisma.result.findMany({
    where: {
      session: {
        userId: session.user.id,
        status: { in: ["FINISHED", "AUTO_SUBMITTED"] },
      },
    },
    include: {
      session: {
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              sections: {
                select: {
                  sectionType: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { session: { submittedAt: "desc" } },
  });

  const levelColors: Record<string, string> = {
    A: "bg-green-100 text-green-800",
    B: "bg-yellow-100 text-yellow-800",
    C: "bg-red-100 text-red-800",
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-gray-600">View your exam history and scores</p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-6xl">📊</span>
            <h2 className="text-xl font-semibold mt-4 mb-2">No Results Yet</h2>
            <p className="text-gray-600 mb-4">
              Complete an exam to see your results here.
            </p>
            <Link
              href="/dashboard/exams"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Take an Exam
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <Link key={result.id} href={`/dashboard/results/${result.sessionId}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.session.exam.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${levelColors[result.level]}`}>
                          Level {result.level}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 {formatDate(result.session.submittedAt)}
                        </span>
                        <span>⏱️ {result.session.exam.sections.length} sections</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Score breakdown */}
                      <div className="hidden md:flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Listening</p>
                          <p className="text-lg font-bold text-blue-600">{result.listeningScaled}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Structure</p>
                          <p className="text-lg font-bold text-green-600">{result.structureScaled}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Reading</p>
                          <p className="text-lg font-bold text-purple-600">{result.readingScaled}</p>
                        </div>
                      </div>

                      {/* Total score */}
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{result.totalScore}</p>
                        <p className="text-xs text-gray-500">Total Score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}