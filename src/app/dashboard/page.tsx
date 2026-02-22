"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ActivityForm from "@/components/ActivityForm";
import ActivityList from "@/components/ActivityList";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: number;
  date: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchActivities = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activities?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
        setStats({
          total: data.length,
          completed: data.filter((a: Activity) => a.completed).length,
        });
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [selectedDate, session?.user?.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleAddActivity = async (activity: {
    title: string;
    description: string;
    category: string;
  }) => {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...activity, date: selectedDate }),
    });
    if (res.ok) {
      await fetchActivities();
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (res.ok) {
      await fetchActivities();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchActivities();
    }
  };

  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const isToday =
    selectedDate === new Date().toISOString().split("T")[0];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-lg font-semibold text-gray-900 border-none bg-transparent cursor-pointer focus:outline-none focus:ring-0"
            />
            {isToday && (
              <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {!isToday && (
            <button
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2"
            >
              Go to today
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{stats.total} logged</span>
          <span>{stats.completed} done</span>
        </div>
      </div>

      {/* Activity form */}
      <div className="mb-6">
        <ActivityForm date={selectedDate} onSubmit={handleAddActivity} />
      </div>

      {/* Activity list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Activities
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <ActivityList
            activities={activities}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
