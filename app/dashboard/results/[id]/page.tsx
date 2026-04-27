import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id: sessionId } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const result = await prisma.result.findUnique({
    where: { sessionId },
    include: {
      session: {
        include: {
          user: { select: { name: true, email: true } },
          exam: {
            select: {
              id: true,
              title: true,
              sections: {
                orderBy: { orderNumber: "asc" },
                include: {
                  questions: true,
                },
              },
            },
          },
          answers: {
            include: {
              question: {
                include: {
                  section: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) {
    redirect("/dashboard/results");
  }

  // Verify user owns this result
  if (result.session.userId !== session.user.id) {
    redirect("/dashboard/results");
  }

  const levelColors: Record<string, string> = {
    A: "bg-green-100 text-green-800",
    B: "bg-yellow-100 text-yellow-800",
    C: "bg-red-100 text-red-800",
  };

  const levelDescriptions: Record<string, { title: string; desc: string }> = {
    A: {
      title: "Advanced",
      desc: "Excellent English proficiency. Suitable for academic and professional purposes.",
    },
    B: {
      title: "Intermediate",
      desc: "Good English skills for most academic and professional situations.",
    },
    C: {
      title: "Below Intermediate",
      desc: "Basic English skills. Additional study recommended.",
    },
  };

  // Group answers by section
  const sectionResults = result.session.exam.sections.map((section) => {
    const sectionAnswers = result.session.answers.filter(
      (a) => a.question.sectionId === section.id
    );
    const correctCount = sectionAnswers.filter(
      (a) => a.selectedAnswer === a.question.correctAnswer
    ).length;
    const totalCount = sectionAnswers.length;

    return {
      ...section,
      correctCount,
      totalCount,
      rawScore: section.sectionType === "LISTENING"
        ? result.listeningRaw
        : section.sectionType === "STRUCTURE"
        ? result.structureRaw
        : result.readingRaw,
      scaledScore: section.sectionType === "LISTENING"
        ? result.listeningScaled
        : section.sectionType === "STRUCTURE"
        ? result.structureScaled
        : result.readingScaled,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/results"
        className="inline-block text-blue-600 hover:text-blue-700 text-sm mb-4"
      >
        ← Back to Results
      </Link>

      {/* Score Overview Card */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <Badge variant={result.level === "A" ? "success" : result.level === "B" ? "warning" : "danger"} className="mb-2">
            Level {result.level}
          </Badge>
          <CardTitle className="text-2xl">{result.session.exam.title}</CardTitle>
          <p className="text-gray-600 mt-2">{levelDescriptions[result.level].title}</p>
        </CardHeader>
        <CardContent>
          {/* Main score */}
          <div className="text-center mb-8">
            <p className="text-6xl font-bold text-gray-900">{result.totalScore}</p>
            <p className="text-gray-500">Total Score</p>
            <p className="text-sm text-gray-600 mt-2">
              {levelDescriptions[result.level].desc}
            </p>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {sectionResults.map((section) => (
              <div key={section.id} className={`rounded-lg p-4 ${
                section.sectionType === "LISTENING" ? "bg-blue-50" :
                section.sectionType === "STRUCTURE" ? "bg-green-50" : "bg-purple-50"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {section.sectionType === "LISTENING" && "🎧"}
                    {section.sectionType === "STRUCTURE" && "📐"}
                    {section.sectionType === "READING" && "📚"}
                    {" "}{section.title}
                  </span>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${
                    section.sectionType === "LISTENING" ? "text-blue-600" :
                    section.sectionType === "STRUCTURE" ? "text-green-600" : "text-purple-600"
                  }`}>
                    {section.scaledScore}
                  </p>
                  <p className="text-xs text-gray-500">
                    {section.rawScore}/{section.totalCount} correct
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">User:</span> {result.session.user.name || result.session.user.email}
            </div>
            <div>
              <span className="font-medium">Completed:</span>{" "}
              {result.session.submittedAt
                ? new Date(result.session.submittedAt).toLocaleString()
                : "-"}
            </div>
            <div>
              <span className="font-medium">Violations:</span> {result.session.violationCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Link href="/dashboard/exams" className="flex-1">
          <Button variant="outline" className="w-full">
            Take Another Exam
          </Button>
        </Link>
        <a href="javascript:window.print()" className="flex-1">
          <Button variant="outline" className="w-full">
            Print Result
          </Button>
        </a>
      </div>
    </div>
  );
}