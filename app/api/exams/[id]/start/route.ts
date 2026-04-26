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

    // Get exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        status: true,
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
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Check user access
    let hasAccess = false;
    const existingAccess = await prisma.examAccess.findFirst({
      where: {
        userId: session.user.id,
        examId,
        isActive: true,
        OR: [
          { expiredAt: null },
          { expiredAt: { gt: new Date() } },
        ],
      },
    });

    if (existingAccess) {
      hasAccess = true;
    } else if (exam.type === "FREE") {
      // Auto-grant access for FREE exams
      await prisma.examAccess.create({
        data: {
          userId: session.user.id,
          examId,
          accessType: "FREE",
          isActive: true,
        },
      });
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this exam. Please purchase or use a voucher." },
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
        maxViolations: exam.maxViolations,
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
      maxViolations: exam.maxViolations,
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
