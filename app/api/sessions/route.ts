import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.examSession.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exam: true,
        result: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      examId: s.examId,
      examTitle: s.exam.title,
      status: s.status,
      startedAt: s.startedAt,
      submittedAt: s.submittedAt,
      result: s.result
        ? {
            totalScore: s.result.totalScore,
            listeningScaled: s.result.listeningScaled,
            structureScaled: s.result.structureScaled,
            readingScaled: s.result.readingScaled,
            level: s.result.level,
          }
        : null,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
