import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { getDb, ensureMigrated } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureMigrated();
  const db = getDb();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (date) {
    const result = await db.execute({
      sql: "SELECT * FROM activities WHERE user_id = ? AND date = ? ORDER BY created_at DESC",
      args: [session.user.id, date],
    });
    return NextResponse.json(result.rows);
  }

  if (startDate && endDate) {
    const result = await db.execute({
      sql: "SELECT * FROM activities WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC",
      args: [session.user.id, startDate, endDate],
    });
    return NextResponse.json(result.rows);
  }

  const result = await db.execute({
    sql: "SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 100",
    args: [session.user.id],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, category, date, completed } = await req.json();

    if (!title || !date) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    await ensureMigrated();
    const db = getDb();
    const id = uuidv4();

    await db.execute({
      sql: "INSERT INTO activities (id, user_id, title, description, category, date, completed) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        session.user.id,
        title,
        description || null,
        category || "task",
        date,
        completed ? 1 : 0,
      ],
    });

    const result = await db.execute({
      sql: "SELECT * FROM activities WHERE id = ?",
      args: [id],
    });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
