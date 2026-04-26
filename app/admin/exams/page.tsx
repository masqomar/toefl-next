import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function AdminExamsPage() {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  const exams = await prisma.exam.findMany({
    include: {
      sections: {
        include: {
          _count: { select: { questions: true } },
        },
      },
      _count: { select: { examSessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-600">Manage your exams</p>
        </div>
        <Link href="/admin/exams/new">
          <Button>+ Create Exam</Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <span className="text-6xl">📝</span>
            <h2 className="text-xl font-semibold mt-4 mb-2">No exams yet</h2>
            <p className="text-gray-600 mb-4">Create your first exam to get started.</p>
            <Link href="/admin/exams/new">
              <Button>Create Exam</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const totalQuestions = exam.sections.reduce((sum, s) => sum + s._count.questions, 0);
            const totalDuration = exam.sections.reduce((sum, s) => sum + s.duration, 0);

            return (
              <Card key={exam.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <Badge variant={exam.status ? "success" : "danger"}>
                          {exam.status ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant={exam.type === "FREE" ? "info" : "warning"}>
                          {exam.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>📚 {exam.sections.length} sections</span>
                        <span>❓ {totalQuestions} questions</span>
                        <span>⏱️ {totalDuration} minutes</span>
                        <span>👥 {exam._count.examSessions} attempts</span>
                        <span>🔒 {exam.maxViolations} max violations</span>
                        <span>🔄 {exam.maxAudioReplay} audio replays</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
