import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}