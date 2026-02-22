"use client";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category: string;
  completed: number;
  date: string;
}

interface ActivityListProps {
  activities: Activity[];
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  task: "bg-blue-100 text-blue-700",
  accomplishment: "bg-green-100 text-green-700",
  meeting: "bg-purple-100 text-purple-700",
  learning: "bg-amber-100 text-amber-700",
  blocker: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function ActivityList({
  activities,
  onToggleComplete,
  onDelete,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm">No activities logged yet</p>
        <p className="text-xs mt-1">Add your first activity above</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors ${
            activity.completed
              ? "bg-gray-50 border-gray-100"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <button
            onClick={() =>
              onToggleComplete(activity.id, !activity.completed)
            }
            className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              activity.completed
                ? "bg-indigo-600 border-indigo-600"
                : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            {activity.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  activity.completed
                    ? "text-gray-400 line-through"
                    : "text-gray-900"
                }`}
              >
                {activity.title}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  CATEGORY_COLORS[activity.category] || CATEGORY_COLORS.other
                }`}
              >
                {activity.category}
              </span>
            </div>
            {activity.description && (
              <p
                className={`text-xs mt-1 ${
                  activity.completed ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {activity.description}
              </p>
            )}
          </div>

          <button
            onClick={() => onDelete(activity.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
            title="Delete activity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
