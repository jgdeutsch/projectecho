"use client";

interface ProgressBarProps {
  progress: number; // 0 to 100
  status?: string;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progress</span>
        <span className="text-gray-600">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {status && (
        <div className="text-xs text-gray-500 mt-1">Status: {status}</div>
      )}
    </div>
  );
}

