import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST - Redeem voucher
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Voucher code is required" }, { status: 400 });
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        exam: { select: { id: true, title: true, status: true } },
        redemptions: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Invalid voucher code" }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ error: "Voucher is no longer active" }, { status: 400 });
    }

    if (voucher.expiredAt && new Date() > voucher.expiredAt) {
      return NextResponse.json({ error: "Voucher has expired" }, { status: 400 });
    }

    if (voucher.usedCount >= voucher.maxUsage) {
      return NextResponse.json({ error: "Voucher has reached maximum usage" }, { status: 400 });
    }

    // Check if user already redeemed
    const existingRedemption = voucher.redemptions.find(
      (r) => r.userId === session.user.id
    );
    if (existingRedemption) {
      return NextResponse.json({ error: "You have already used this voucher" }, { status: 400 });
    }

    if (!voucher.exam.status) {
      return NextResponse.json({ error: "Exam is no longer available" }, { status: 400 });
    }

    // Create redemption and exam access
    await prisma.$transaction([
      prisma.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId: session.user.id,
        },
      }),
      prisma.examAccess.create({
        data: {
          userId: session.user.id,
          examId: voucher.examId,
          accessType: "VOUCHER",
          sourceId: voucher.id,
          isActive: true,
        },
      }),
      prisma.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      examId: voucher.exam.id,
      examTitle: voucher.exam.title,
      message: "Voucher redeemed successfully! You now have access to the exam.",
    });
  } catch (error) {
    console.error("Error redeeming voucher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}