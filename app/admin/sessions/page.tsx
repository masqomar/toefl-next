import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function AdminSessionsPage() {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  const sessions = await prisma.examSession.findMany({
    include: {
      user: { select: { name: true, email: true } },
      exam: { select: { title: true } },
      result: true,
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  const statusColors: Record<string, string> = {
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    FINISHED: "bg-green-100 text-green-800",
    AUTO_SUBMITTED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exam Sessions</h1>
        <p className="text-gray-600">View all exam attempts</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">📋</span>
              <h2 className="text-xl font-semibold mt-4 mb-2">No sessions yet</h2>
              <p className="text-gray-600">Sessions will appear here when users take exams.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Exam</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Violations</th>
                    <th className="px-6 py-3 font-medium">Score</th>
                    <th className="px-6 py-3 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{s.user.name || "N/A"}</p>
                        <p className="text-sm text-gray-500">{s.user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{s.exam.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={s.violationCount > 0 ? "warning" : "default"}>
                          {s.violationCount}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {s.result ? (
                          <div>
                            <span className="font-bold text-lg">{s.result.totalScore}</span>
                            <span className="text-gray-500 text-sm ml-1">({s.result.level})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(s.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
