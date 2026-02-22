import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { title, description, category, completed } = await req.json();

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM activities WHERE id = ? AND user_id = ?")
      .get(id, session.user.id) as { id: string } | undefined;

    if (!existing) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    db.prepare(
      `UPDATE activities
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           completed = COALESCE(?, completed),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    ).run(
      title ?? null,
      description ?? null,
      category ?? null,
      completed !== undefined ? (completed ? 1 : 0) : null,
      id,
      session.user.id
    );

    const updated = db
      .prepare("SELECT * FROM activities WHERE id = ?")
      .get(id);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const result = db
    .prepare("DELETE FROM activities WHERE id = ? AND user_id = ?")
    .run(id, session.user.id);

  if (result.changes === 0) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Deleted" });
}
