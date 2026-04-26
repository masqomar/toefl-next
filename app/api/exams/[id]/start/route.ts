import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        status: true,
        accesses: {
          some: {
            userId: session.user.id,
            isActive: true,
            OR: [
              { expiredAt: null },
              { expiredAt: { gt: new Date() } },
            ],
          },
        },
      },
      include: {
        sections: {
          orderBy: { orderNumber: "asc" },
          include: {
            questions: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "You don't have access to this exam or exam not found" },
        { status: 403 }
      );
    }

    // Check for existing in-progress session
    const existingSession = await prisma.examSession.findFirst({
      where: {
        userId: session.user.id,
        examId,
        status: "IN_PROGRESS",
      },
    });

    if (existingSession) {
      // Return existing session
      return NextResponse.json({
        sessionId: existingSession.id,
        examId: existingSession.examId,
        status: existingSession.status,
        currentSection: existingSession.currentSection,
        startedAt: existingSession.startedAt,
        resumed: true,
      });
    }

    // Create new session
    const newSession = await prisma.examSession.create({
      data: {
        userId: session.user.id,
        examId,
        status: "IN_PROGRESS",
        currentSection: 1,
      },
    });

    // Pre-create empty answers for all questions
    const allQuestions = exam.sections.flatMap((s) => s.questions);
    await prisma.userAnswer.createMany({
      data: allQuestions.map((q) => ({
        sessionId: newSession.id,
        questionId: q.id,
      })),
    });

    return NextResponse.json({
      sessionId: newSession.id,
      examId: newSession.examId,
      status: newSession.status,
      currentSection: newSession.currentSection,
      startedAt: newSession.startedAt,
      resumed: false,
    });
  } catch (error) {
    console.error("Error starting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
