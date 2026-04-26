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

    const { type } = await req.json();

    // Verify session belongs to user
    const examSession = await prisma.examSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        status: "IN_PROGRESS",
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Increment violation count
    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        violationCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      violationCount: updatedSession.violationCount,
      violationType: type,
    });
  } catch (error) {
    console.error("Error recording violation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
