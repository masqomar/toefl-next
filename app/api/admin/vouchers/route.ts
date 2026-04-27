import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - List vouchers
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vouchers = await prisma.voucher.findMany({
      include: {
        exam: { select: { id: true, title: true } },
        redemptions: {
          select: { id: true, userId: true, redeemedAt: true },
        },
      },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create voucher
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { examId, title, code, maxUsage, expiredAt } = await req.json();

    if (!examId || !title || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.voucher.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 });
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        title,
        examId,
        maxUsage: maxUsage || 1,
        isActive: true,
        expiredAt: expiredAt ? new Date(expiredAt) : null,
      },
      include: {
        exam: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error("Error creating voucher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate batch vouchers
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { examId, title, prefix, count, maxUsage, expiredAt } = await req.json();

    if (!examId || !prefix || !count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vouchers = [];
    const usedCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let code;
      do {
        code = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      } while (usedCodes.has(code));

      usedCodes.add(code);

      const voucher = await prisma.voucher.create({
        data: {
          code,
          title: title || `Voucher ${i + 1}`,
          examId,
          maxUsage: maxUsage || 1,
          isActive: true,
          expiredAt: expiredAt ? new Date(expiredAt) : null,
        },
      });
      vouchers.push(voucher);
    }

    return NextResponse.json({ vouchers, count });
  } catch (error) {
    console.error("Error generating vouchers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}