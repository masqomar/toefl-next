import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - List all exams
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const exams = await prisma.exam.findMany({
      include: {
        sections: {
          orderBy: { orderNumber: "asc" },
          include: {
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new exam
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { title, description, thumbnail, type, price, status, maxViolations, maxAudioReplay, sections } = data;

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        thumbnail,
        type: type || "FREE",
        price: price || 0,
        status: status ?? true,
        maxViolations: maxViolations || 5,
        maxAudioReplay: maxAudioReplay || 2,
        sections: sections ? {
          create: sections.map((section: any, index: number) => ({
            title: section.title,
            sectionType: section.sectionType,
            duration: section.duration,
            orderNumber: index + 1,
            questions: section.questions ? {
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
        } : undefined,
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
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
