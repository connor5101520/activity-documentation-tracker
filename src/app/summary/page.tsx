"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Summary {
  subject: string;
  body: string;
  startDate: string;
  endDate: string;
  activityCount: number;
}

export default function SummaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const getWeekDates = useCallback((offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: monday.toISOString().split("T")[0],
      endDate: sunday.toISOString().split("T")[0],
    };
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { startDate, endDate } = getWeekDates(weekOffset);
      const res = await fetch(
        `/api/summary?startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, weekOffset, getWeekDates]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    if (!summary) return;
    const subject = encodeURIComponent(summary.subject);
    const body = encodeURIComponent(summary.body);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Summary</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {summary.startDate} to {summary.endDate}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.activityCount} activities logged this week
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(summary.body)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button
                  onClick={handleMailto}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Open in Email
                </button>
              </div>
            </div>
          </div>

          {/* Email subject */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              Email Subject
            </label>
            <p className="text-sm font-medium text-gray-900">
              {summary.subject}
            </p>
          </div>

          {/* Email body */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              Email Body
            </label>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              {summary.body}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>Unable to generate summary</p>
        </div>
      )}
    </div>
  );
}
