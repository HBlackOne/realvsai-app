import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateCurrentUser();
    const { id } = await context.params;

    const scan = await db.scan.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!scan) {
      return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 });
    }

    await db.scan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/scans/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
