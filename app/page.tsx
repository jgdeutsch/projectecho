"use client";

import { useState } from "react";
import Form from "@/components/Form";
import ProgressBar from "@/components/ProgressBar";
import Terminal from "@/components/Terminal";
import ResultsTable from "@/components/ResultsTable";

interface LogEntry {
  message: string;
  timestamp: string;
}

interface Liker {
  url: string;
  timestamp: string;
}

const MAX_POLLS = 60; // Increased to match backend

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const handleStart = async (liAt: string, postUrl: string) => {
    setIsRunning(true);
    setProgress(0);
    setStatus("Starting...");
    setLogs([]);
    setLikers([]);
    setPollCount(0);
    setRunId(null);

    try {
      // Launch the run
      const launchResponse = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liAt, postUrl }),
      });

      if (!launchResponse.ok) {
        const error = await launchResponse.json();
        const errorMessage = error.details 
          ? `${error.error}: ${error.details}`
          : error.error || "Failed to launch";
        throw new Error(errorMessage);
      }

      const { runId: newRunId } = await launchResponse.json();
      setRunId(newRunId);

      // Start streaming
      const eventSource = new EventSource(`/api/stream/${newRunId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "log":
              setLogs((prev) => [
                ...prev,
                {
                  message: data.message,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              ]);
              if (data.message.includes("Polling attempt")) {
                setPollCount((prev) => {
                  const newPollCount = prev + 1;
                  const newProgress = Math.min((newPollCount / MAX_POLLS) * 100, 99);
                  setProgress(newProgress);
                  return newPollCount;
                });
              }
              if (data.message.includes("Container status:")) {
                const statusMatch = data.message.match(/status: (\w+)/);
                if (statusMatch) {
                  setStatus(statusMatch[1]);
                }
              }
              break;

            case "url":
              setLikers((prev) => [
                ...prev,
                {
                  url: data.url,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              ]);
              break;

            case "done":
              setProgress(100);
              setStatus("finished");
              setIsRunning(false);
              eventSource.close();
              break;

            case "error":
              setLogs((prev) => [
                ...prev,
                {
                  message: `ERROR: ${data.message}`,
                  timestamp: data.timestamp || new Date().toISOString(),
                },
              ]);
              setStatus("error");
              setProgress(100);
              setIsRunning(false);
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setLogs((prev) => [
          ...prev,
          {
            message: "Connection error. Stream closed.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsRunning(false);
        eventSource.close();
      };
    } catch (error) {
      setLogs([
        {
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsRunning(false);
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!runId) return;

    const link = document.createElement("a");
    link.href = `/api/download?runId=${runId}`;
    link.download = `likers-${runId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Echo</h1>
        <p className="text-gray-600">
          Scrape LinkedIn post likers using PhantomBuster
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form and Progress */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <Form onSubmit={handleStart} disabled={isRunning} />
          </div>

          {isRunning && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Progress</h2>
              <ProgressBar progress={progress} status={status} />
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <ResultsTable
              likers={likers}
              runId={runId}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </div>

      {/* Terminal at bottom */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Terminal</h2>
        <Terminal logs={logs} />
      </div>
    </main>
  );
}

