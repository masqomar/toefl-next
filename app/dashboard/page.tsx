import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Ready to practice your English skills? Let&apos;s ace that TOEFL!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exams Taken</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Access Exams</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl">🔓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Rank</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xl">🏆</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Free Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Free Practice Tests</CardTitle>
            <CardDescription>Start with free exams to warm up</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span>📖</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">TOEFL ITP Sample Test</p>
                    <p className="text-sm text-gray-500">50 questions • 60 minutes</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/exams/sample"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest exam attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl">📭</span>
              <p className="mt-2">No recent activity</p>
              <p className="text-sm">Start your first exam to see your progress here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOEFL Sections Info */}
      <Card>
        <CardHeader>
          <CardTitle>About TOEFL ITP</CardTitle>
          <CardDescription>Understanding the test sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎧</span>
                <h4 className="font-semibold text-blue-900">Listening Comprehension</h4>
              </div>
              <p className="text-sm text-blue-700">
                Tests your ability to understand spoken English in academic settings. Includes short conversations and talks.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="info">40 questions</Badge>
                <Badge variant="info">30 minutes</Badge>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📐</span>
                <h4 className="font-semibold text-green-900">Structure & Written Expression</h4>
              </div>
              <p className="text-sm text-green-700">
                Measures your knowledge of English grammar and your ability to recognize language appropriate in standard written English.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success">25 questions</Badge>
                <Badge variant="success">25 minutes</Badge>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📚</span>
                <h4 className="font-semibold text-purple-900">Reading Comprehension</h4>
              </div>
              <p className="text-sm text-purple-700">
                Tests your ability to understand academic reading material. Focuses on main ideas, supporting ideas, and inferences.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="default">40 questions</Badge>
                <Badge variant="default">55 minutes</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
