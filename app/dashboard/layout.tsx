import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={{
      name: session.user.name || "User",
      email: session.user.email || "",
      role: session.user.role,
    }}>
      {children}
    </DashboardLayout>
  );
}
