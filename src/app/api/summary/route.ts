import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, ensureMigrated } from "@/lib/db";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: number;
  date: string;
}

function generateWeeklySummary(
  activities: Activity[],
  startDate: string,
  endDate: string,
  userName: string
): { subject: string; body: string } {
  const byDate: Record<string, Activity[]> = {};
  const byCategory: Record<string, Activity[]> = {};

  for (const activity of activities) {
    if (!byDate[activity.date]) byDate[activity.date] = [];
    byDate[activity.date].push(activity);

    if (!byCategory[activity.category]) byCategory[activity.category] = [];
    byCategory[activity.category].push(activity);
  }

  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.completed).length;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let body = `Weekly Activity Summary\n`;
  body += `${startDate} to ${endDate}\n`;
  body += `Prepared for: ${userName}\n`;
  body += `${"=".repeat(50)}\n\n`;

  body += `OVERVIEW\n`;
  body += `${"-".repeat(30)}\n`;
  body += `Total activities logged: ${totalActivities}\n`;
  body += `Completed: ${completedActivities}\n`;
  body += `In progress: ${totalActivities - completedActivities}\n\n`;

  body += `BY CATEGORY\n`;
  body += `${"-".repeat(30)}\n`;
  for (const [category, items] of Object.entries(byCategory)) {
    const completed = items.filter((a) => a.completed).length;
    body += `${category.charAt(0).toUpperCase() + category.slice(1)}: ${items.length} total, ${completed} completed\n`;
  }
  body += `\n`;

  body += `DAILY BREAKDOWN\n`;
  body += `${"-".repeat(30)}\n`;
  const sortedDates = Object.keys(byDate).sort();
  for (const date of sortedDates) {
    const d = new Date(date + "T00:00:00");
    const dayName = dayNames[d.getDay()];
    body += `\n${dayName}, ${date}\n`;
    for (const activity of byDate[date]) {
      const status = activity.completed ? "[x]" : "[ ]";
      body += `  ${status} ${activity.title}`;
      if (activity.description) {
        body += ` - ${activity.description}`;
      }
      body += ` (${activity.category})\n`;
    }
  }

  const accomplishments = activities.filter((a) => a.completed);
  if (accomplishments.length > 0) {
    body += `\nKEY ACCOMPLISHMENTS\n`;
    body += `${"-".repeat(30)}\n`;
    for (const a of accomplishments) {
      body += `  - ${a.title}\n`;
    }
  }

  const inProgress = activities.filter((a) => !a.completed);
  if (inProgress.length > 0) {
    body += `\nSTILL IN PROGRESS\n`;
    body += `${"-".repeat(30)}\n`;
    for (const a of inProgress) {
      body += `  - ${a.title}\n`;
    }
  }

  const subject = `Weekly Activity Summary: ${startDate} to ${endDate}`;

  return { subject, body };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let startDate = searchParams.get("startDate");
  let endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDate = monday.toISOString().split("T")[0];
    endDate = sunday.toISOString().split("T")[0];
  }

  await ensureMigrated();
  const db = getDb();

  const activitiesResult = await db.execute({
    sql: "SELECT * FROM activities WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC",
    args: [session.user.id, startDate, endDate],
  });
  const activities = activitiesResult.rows as unknown as Activity[];

  const userResult = await db.execute({
    sql: "SELECT name FROM users WHERE id = ?",
    args: [session.user.id],
  });
  const user = userResult.rows[0] as unknown as { name: string };

  const summary = generateWeeklySummary(
    activities,
    startDate,
    endDate,
    user.name
  );

  return NextResponse.json({
    ...summary,
    startDate,
    endDate,
    activityCount: activities.length,
  });
}
