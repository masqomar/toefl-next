import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single exam
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { orderNumber: "asc" },
          include: {
            questions: {
              orderBy: { questionNumber: "asc" },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update exam
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();
    const { title, description, thumbnail, type, price, status, maxViolations, maxAudioReplay, sections } = data;

    // Delete existing sections and their questions
    const existingExam = await prisma.exam.findUnique({
      where: { id },
      include: { sections: true },
    });

    if (existingExam) {
      // Delete all questions from existing sections
      await prisma.questionBank.deleteMany({
        where: {
          sectionId: { in: existingExam.sections.map((s) => s.id) },
        },
      });
      // Delete all sections
      await prisma.examSection.deleteMany({
        where: { examId: id },
      });
    }

    // Update exam with new sections
    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        description,
        thumbnail,
        type,
        price,
        status,
        maxViolations,
        maxAudioReplay,
        sections: {
          create: sections?.map((section: any, index: number) => ({
            title: section.title,
            sectionType: section.sectionType,
            duration: section.duration,
            orderNumber: index + 1,
            questions: section.questions?.length > 0 ? {
              create: section.questions.map((q: any, qIndex: number) => ({
                questionNumber: qIndex + 1,
                questionText: q.questionText,
                passageText: q.passageText,
                audioUrl: q.audioUrl,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        sections: {
          orderBy: { orderNumber: "asc" },
          include: { questions: true },
        },
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete exam
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.exam.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
