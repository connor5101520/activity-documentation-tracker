"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export default function NotificationManager() {
  const { data: session } = useSession();
  const dailyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weeklyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const settings = await res.json();

      // Schedule daily reminder
      if (settings.notificationEnabled) {
        if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current);

        const [dHours, dMinutes] = settings.notificationTime
          .split(":")
          .map(Number);
        const now = new Date();
        const dailyTarget = new Date();
        dailyTarget.setHours(dHours, dMinutes, 0, 0);

        if (dailyTarget <= now) {
          dailyTarget.setDate(dailyTarget.getDate() + 1);
        }

        const dailyDelay = dailyTarget.getTime() - now.getTime();

        dailyTimerRef.current = setTimeout(() => {
          new Notification("ActivityTracker Reminder", {
            body: "Time to log your activities for today! What did you accomplish?",
            icon: "/favicon.ico",
            tag: "daily-reminder",
          });
          scheduleNotifications();
        }, dailyDelay);
      }

      // Schedule weekly summary notification
      {
        if (weeklyTimerRef.current) clearTimeout(weeklyTimerRef.current);

        const [wHours, wMinutes] = settings.weeklySummaryTime
          .split(":")
          .map(Number);
        const targetDay = settings.weeklySummaryDay;
        const now = new Date();
        const weeklyTarget = new Date();
        weeklyTarget.setHours(wHours, wMinutes, 0, 0);

        const currentDay = now.getDay();
        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0 || (daysUntil === 0 && weeklyTarget <= now)) {
          daysUntil += 7;
        }
        weeklyTarget.setDate(now.getDate() + daysUntil);

        const weeklyDelay = weeklyTarget.getTime() - now.getTime();

        weeklyTimerRef.current = setTimeout(() => {
          new Notification("Weekly Summary Ready", {
            body: "Your weekly activity summary is ready! Head to the Weekly Summary page to review and send it.",
            icon: "/favicon.ico",
            tag: "weekly-summary",
          });
          scheduleNotifications();
        }, weeklyDelay);
      }
    } catch {
      // Settings fetch failed, skip notification scheduling
    }
  }, [session?.user?.id]);

  useEffect(() => {
    scheduleNotifications();

    return () => {
      if (dailyTimerRef.current) clearTimeout(dailyTimerRef.current);
      if (weeklyTimerRef.current) clearTimeout(weeklyTimerRef.current);
    };
  }, [scheduleNotifications]);

  return null;
}
