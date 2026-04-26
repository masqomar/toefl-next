import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: sessionId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session belongs to user
    const examSession = await prisma.examSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        status: "IN_PROGRESS",
      },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { orderNumber: "asc" },
              include: {
                questions: {
                  include: {
                    answers: {
                      where: { sessionId: sessionId },
                    },
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Calculate scores
    let listeningRaw = 0;
    let structureRaw = 0;
    let readingRaw = 0;
    let listeningTotal = 0;
    let structureTotal = 0;
    let readingTotal = 0;

    for (const section of examSession.exam.sections) {
      for (const question of section.questions) {
        const answer = examSession.answers.find(
          (a) => a.questionId === question.id
        );

        if (section.sectionType === "LISTENING") {
          listeningTotal++;
          if (answer?.selectedAnswer === question.correctAnswer) {
            listeningRaw++;
          }
        } else if (section.sectionType === "STRUCTURE") {
          structureTotal++;
          if (answer?.selectedAnswer === question.correctAnswer) {
            structureRaw++;
          }
        } else if (section.sectionType === "READING") {
          readingTotal++;
          if (answer?.selectedAnswer === question.correctAnswer) {
            readingRaw++;
          }
        }
      }
    }

    // TOEFL ITP scaled score conversion (approximation)
    const listeningScaled = Math.round((listeningRaw / Math.max(listeningTotal, 1)) * 62 + 31);
    const structureScaled = Math.round((structureRaw / Math.max(structureTotal, 1)) * 68 + 31);
    const readingScaled = Math.round((readingRaw / Math.max(readingTotal, 1)) * 68 + 31);
    const totalScore = listeningScaled + structureScaled + readingScaled;

    // Determine level
    let level = "C";
    if (totalScore >= 627) level = "A";
    else if (totalScore >= 543) level = "B";

    // Update session status
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "FINISHED",
        submittedAt: new Date(),
      },
    });

    // Create result
    const result = await prisma.result.create({
      data: {
        sessionId,
        listeningRaw,
        structureRaw,
        readingRaw,
        listeningScaled,
        structureScaled,
        readingScaled,
        totalScore,
        level,
      },
    });

    return NextResponse.json({
      success: true,
      submitted: true,
      scores: {
        listening: { raw: listeningRaw, total: listeningTotal, scaled: listeningScaled },
        structure: { raw: structureRaw, total: structureTotal, scaled: structureScaled },
        reading: { raw: readingRaw, total: readingTotal, scaled: readingScaled },
        totalScore,
        level,
      },
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
