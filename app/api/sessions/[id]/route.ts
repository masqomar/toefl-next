import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: sessionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get exam session with exam and sections
    const examSession = await prisma.examSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { orderNumber: "asc" },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Format response with questions grouped by section
    const sections = examSession.exam.sections.map((section) => {
      const sectionQuestions = examSession.answers
        .filter((a) => a.question.sectionId === section.id)
        .map((a) => ({
          answerId: a.id,
          questionId: a.question.id,
          questionNumber: a.question.questionNumber,
          questionText: a.question.questionText,
          passageText: a.question.passageText,
          audioUrl: a.question.audioUrl,
          options: {
            A: a.question.optionA,
            B: a.question.optionB,
            C: a.question.optionC,
            D: a.question.optionD,
          },
          selectedAnswer: a.selectedAnswer,
        }));

      return {
        id: section.id,
        title: section.title,
        sectionType: section.sectionType,
        duration: section.duration,
        orderNumber: section.orderNumber,
        questions: sectionQuestions,
      };
    });

    // Calculate elapsed time
    const elapsedMinutes = Math.floor(
      (Date.now() - examSession.startedAt.getTime()) / 1000 / 60
    );

    return NextResponse.json({
      sessionId: examSession.id,
      examId: examSession.examId,
      examTitle: examSession.exam.title,
      status: examSession.status,
      currentSection: examSession.currentSection,
      startedAt: examSession.startedAt,
      submittedAt: examSession.submittedAt,
      violationCount: examSession.violationCount,
      elapsedMinutes,
      sections,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
