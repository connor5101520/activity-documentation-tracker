import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, ensureMigrated } from "@/lib/db";

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

    await ensureMigrated();
    const db = getDb();

    const existing = await db.execute({
      sql: "SELECT * FROM activities WHERE id = ? AND user_id = ?",
      args: [id, session.user.id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: `UPDATE activities
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                completed = COALESCE(?, completed),
                updated_at = datetime('now')
            WHERE id = ? AND user_id = ?`,
      args: [
        title ?? null,
        description ?? null,
        category ?? null,
        completed !== undefined ? (completed ? 1 : 0) : null,
        id,
        session.user.id,
      ],
    });

    const result = await db.execute({
      sql: "SELECT * FROM activities WHERE id = ?",
      args: [id],
    });
    return NextResponse.json(result.rows[0]);
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
  await ensureMigrated();
  const db = getDb();

  const result = await db.execute({
    sql: "DELETE FROM activities WHERE id = ? AND user_id = ?",
    args: [id, session.user.id],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Deleted" });
}
