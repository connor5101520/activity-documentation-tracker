import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const db = getDb();

  if (date) {
    const activities = db
      .prepare(
        "SELECT * FROM activities WHERE user_id = ? AND date = ? ORDER BY created_at DESC"
      )
      .all(session.user.id, date);
    return NextResponse.json(activities);
  }

  if (startDate && endDate) {
    const activities = db
      .prepare(
        "SELECT * FROM activities WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC"
      )
      .all(session.user.id, startDate, endDate);
    return NextResponse.json(activities);
  }

  const activities = db
    .prepare(
      "SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 100"
    )
    .all(session.user.id);
  return NextResponse.json(activities);
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

    const db = getDb();
    const id = uuidv4();

    db.prepare(
      "INSERT INTO activities (id, user_id, title, description, category, date, completed) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      session.user.id,
      title,
      description || null,
      category || "task",
      date,
      completed ? 1 : 0
    );

    const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(id);
    return NextResponse.json(activity, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
