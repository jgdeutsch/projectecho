"use client";

import { useEffect, useRef } from "react";

interface LogEntry {
  message: string;
  timestamp: string;
}

interface TerminalProps {
  logs: LogEntry[];
}

export default function Terminal({ logs }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      ref={terminalRef}
      className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto"
    >
      {logs.length === 0 ? (
        <div className="text-gray-500">Waiting for logs...</div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">
              {formatTimestamp(log.timestamp)} |
            </span>{" "}
            <span className="text-green-400">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}

