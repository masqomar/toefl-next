import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  // Fetch stats
  const [totalUsers, totalExams, totalSessions, recentSessions] = await Promise.all([
    prisma.user.count(),
    prisma.exam.count({ where: { status: true } }),
    prisma.examSession.count(),
    prisma.examSession.findMany({
      take: 5,
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        exam: { select: { title: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: "👥",
      color: "bg-blue-500",
      href: "/admin/users",
    },
    {
      label: "Active Exams",
      value: totalExams,
      icon: "📝",
      color: "bg-green-500",
      href: "/admin/exams",
    },
    {
      label: "Total Sessions",
      value: totalSessions,
      icon: "📋",
      color: "bg-purple-500",
      href: "/admin/sessions",
    },
  ];

  const statusColors: Record<string, string> = {
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    FINISHED: "bg-green-100 text-green-800",
    AUTO_SUBMITTED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name}</p>
        </div>
        <Link href="/admin/exams/new">
          <Button>+ Create Exam</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-6">
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exam Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sessions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Exam</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{s.user.name || "N/A"}</p>
                        <p className="text-sm text-gray-500">{s.user.email}</p>
                      </td>
                      <td className="py-3 text-gray-700">{s.exam.title}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(s.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
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
          <div className="mt-4 text-center">
            <Link href="/admin/sessions">
              <Button variant="outline" size="sm">View All Sessions</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
