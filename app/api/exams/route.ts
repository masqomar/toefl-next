import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active exams with their sections and question counts
    const exams = await prisma.exam.findMany({
      where: { status: true },
      include: {
        sections: {
          orderBy: { orderNumber: "asc" },
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
        accesses: {
          where: {
            userId: session.user.id,
            isActive: true,
            OR: [
              { expiredAt: null },
              { expiredAt: { gt: new Date() } },
            ],
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format response
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      thumbnail: exam.thumbnail,
      type: exam.type,
      price: exam.price,
      totalQuestions: exam.sections.reduce((sum, s) => sum + s._count.questions, 0),
      totalDuration: exam.sections.reduce((sum, s) => sum + s.duration, 0),
      sections: exam.sections.map((s) => ({
        id: s.id,
        title: s.title,
        sectionType: s.sectionType,
        duration: s.duration,
        questionCount: s._count.questions,
      })),
      // FREE exams always have access
      hasAccess: exam.type === "FREE" || exam.accesses.length > 0,
    }));

    return NextResponse.json(formattedExams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
