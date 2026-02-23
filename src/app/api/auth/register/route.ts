import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getDb, ensureMigrated } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await ensureMigrated();
    const db = getDb();

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const id = uuidv4();

    await db.execute({
      sql: "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
      args: [id, email, name, passwordHash],
    });

    return NextResponse.json({ message: "Account created successfully" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
