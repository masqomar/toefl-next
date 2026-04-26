import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Super Admin Dashboard</h2>
            <p className="text-gray-700 mb-4">
              Welcome, {session.user.name}! You have super admin privileges.
            </p>
            <p className="text-gray-600">
              <strong>Your role:</strong> {session.user.role}
            </p>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Super Admin Actions</h3>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Back to Dashboard
                </a>
                <a
                  href="/admin"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Admin Panel
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
