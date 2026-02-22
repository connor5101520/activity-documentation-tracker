import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const user = db
    .prepare(
      "SELECT notification_time, notification_enabled, weekly_summary_day, weekly_summary_time FROM users WHERE id = ?"
    )
    .get(session.user.id) as {
    notification_time: string;
    notification_enabled: number;
    weekly_summary_day: number;
    weekly_summary_time: string;
  } | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    notificationTime: user.notification_time,
    notificationEnabled: !!user.notification_enabled,
    weeklySummaryDay: user.weekly_summary_day,
    weeklySummaryTime: user.weekly_summary_time,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      notificationTime,
      notificationEnabled,
      weeklySummaryDay,
      weeklySummaryTime,
    } = await req.json();

    const db = getDb();
    db.prepare(
      `UPDATE users
       SET notification_time = COALESCE(?, notification_time),
           notification_enabled = COALESCE(?, notification_enabled),
           weekly_summary_day = COALESCE(?, weekly_summary_day),
           weekly_summary_time = COALESCE(?, weekly_summary_time)
       WHERE id = ?`
    ).run(
      notificationTime ?? null,
      notificationEnabled !== undefined
        ? notificationEnabled
          ? 1
          : 0
        : null,
      weeklySummaryDay ?? null,
      weeklySummaryTime ?? null,
      session.user.id
    );

    return NextResponse.json({ message: "Settings updated" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
