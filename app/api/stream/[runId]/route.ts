import { NextRequest } from "next/server";
import { db } from "@/db";
import { runs, likers } from "@/db/schema";
import { fetchContainer } from "@/lib/phantombuster";
import { extractLinkedInUrls, extractPhantomLogs } from "@/lib/utils";
import { eq } from "drizzle-orm";

const MAX_POLLS = 60; // Increased from 30 to 60 (4 minutes total)
const POLL_INTERVAL_MS = 4000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> | { runId: string } }
) {
  // Handle both sync and async params (Next.js 14+)
  const resolvedParams = await Promise.resolve(params);
  const runId = resolvedParams.runId;

  // Get run from database
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  if (!run) {
    return new Response(
      JSON.stringify({ error: "Run not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: object) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Get containerId from the run
        const containerId = run.containerId;

        if (!containerId) {
          sendEvent({
            type: "error",
            message: "Container ID not found",
          });
          controller.close();
          return;
        }

        const seenUrls = new Set<string>();
        let pollCount = 0;
        let isFinished = false;

        sendEvent({
          type: "log",
          message: `Starting poll loop for container ${containerId}`,
          timestamp: new Date().toISOString(),
        });

        while (!isFinished && pollCount < MAX_POLLS) {
          pollCount++;
          
          sendEvent({
            type: "log",
            message: `Polling attempt ${pollCount}`,
            timestamp: new Date().toISOString(),
          });

          const containerResponse = await fetchContainer(containerId);

          sendEvent({
            type: "log",
            message: `HTTP code: ${containerResponse.httpCode}`,
            timestamp: new Date().toISOString(),
          });

          // Extract status - check multiple possible locations
          let status = containerResponse.status;
          if (!status && (containerResponse as any).containerStatus) {
            status = (containerResponse as any).containerStatus;
          }
          if (!status && (containerResponse as any).data?.status) {
            status = (containerResponse as any).data.status;
          }
          status = status || "unknown";
          
          sendEvent({
            type: "log",
            message: `Container status: ${status}`,
            timestamp: new Date().toISOString(),
          });

          // Log full response structure for debugging (first few polls and when stuck)
          if (pollCount <= 3 || (pollCount > 10 && status === "running" && pollCount % 5 === 0)) {
            const fullResponse = JSON.stringify(containerResponse, null, 2);
            sendEvent({
              type: "log",
              message: `Debug: Full response (${fullResponse.length} chars): ${fullResponse.substring(0, 1500)}${fullResponse.length > 1500 ? '...' : ''}`,
              timestamp: new Date().toISOString(),
            });
          }

          // Extract output - check multiple possible locations (like bash script searches entire response)
          // The bash script searches the entire response text, not just an "output" field
          let outputText = "";
          const responseAny = containerResponse as any;
          
          // Check common output field names
          if (responseAny.output) {
            outputText = typeof responseAny.output === 'string' ? responseAny.output : JSON.stringify(responseAny.output);
          } else if (responseAny.outputText) {
            outputText = typeof responseAny.outputText === 'string' ? responseAny.outputText : JSON.stringify(responseAny.outputText);
          } else if (responseAny.result) {
            outputText = typeof responseAny.result === 'string' ? responseAny.result : JSON.stringify(responseAny.result);
          } else if (responseAny.data?.output) {
            outputText = typeof responseAny.data.output === 'string' ? responseAny.data.output : JSON.stringify(responseAny.data.output);
          } else if (responseAny.containerOutput) {
            outputText = typeof responseAny.containerOutput === 'string' ? responseAny.containerOutput : JSON.stringify(responseAny.containerOutput);
          }
          
          // Fallback: stringify the entire response (like bash script does)
          // The bash script searches the entire response text for URLs and logs
          if (!outputText || outputText.length < 10) {
            outputText = JSON.stringify(containerResponse);
          }
          
          const phantomLogs = extractPhantomLogs(outputText);
          
          if (phantomLogs.length > 0) {
            phantomLogs.forEach((log) => {
              sendEvent({
                type: "log",
                message: log,
                timestamp: new Date().toISOString(),
              });
            });
          } else if (status === "running") {
            sendEvent({
              type: "log",
              message: "No logs emitted yet",
              timestamp: new Date().toISOString(),
            });
          }

          // Extract LinkedIn URLs from the output text (same as bash script)
          const urls = extractLinkedInUrls(outputText);
          const newUrls = urls.filter((url) => !seenUrls.has(url));
          
          // Log URL extraction for debugging
          if (newUrls.length > 0) {
            sendEvent({
              type: "log",
              message: `Found ${newUrls.length} new URLs in output`,
              timestamp: new Date().toISOString(),
            });
          }

          for (const url of newUrls) {
            seenUrls.add(url);
            sendEvent({
              type: "url",
              url: url,
              timestamp: new Date().toISOString(),
            });

            // Save to database
            await db.insert(likers).values({
              runId: runId,
              profileUrl: url,
            });
          }

          // Check for errors - check status first, then output text
          if (status === "error") {
            sendEvent({
              type: "error",
              message: "ERROR detected in container status",
              raw: JSON.stringify(containerResponse),
              timestamp: new Date().toISOString(),
            });

            await db
              .update(runs)
              .set({
                status: "error",
                rawOutput: JSON.stringify(containerResponse).substring(0, 10000),
              })
              .where(eq(runs.id, runId));

            controller.close();
            return;
          }

          // Also check for error in output text
          if (outputText.toLowerCase().includes("error") && !outputText.toLowerCase().includes("no error")) {
            sendEvent({
              type: "log",
              message: `Warning: Error keyword found in output: ${outputText.substring(0, 200)}`,
              timestamp: new Date().toISOString(),
            });
          }

          // Check if finished
          if (status === "finished") {
            // Send final logs
            phantomLogs.forEach((log) => {
              sendEvent({
                type: "log",
                message: log,
                timestamp: new Date().toISOString(),
              });
            });

            const totalUrls = seenUrls.size;
            
            sendEvent({
              type: "log",
              message: `FINISHED. Total URLs: ${totalUrls}`,
              timestamp: new Date().toISOString(),
            });

            if (totalUrls === 0) {
              sendEvent({
                type: "log",
                message: "Full raw response for debugging:",
                timestamp: new Date().toISOString(),
              });
              sendEvent({
                type: "log",
                message: outputText,
                timestamp: new Date().toISOString(),
              });
            }

            // Update database
            await db
              .update(runs)
              .set({
                status: "finished",
                totalUrls: totalUrls,
                rawOutput: outputText.substring(0, 10000), // Limit size
              })
              .where(eq(runs.id, runId));

            sendEvent({
              type: "done",
              total: totalUrls,
              timestamp: new Date().toISOString(),
            });

            isFinished = true;
            controller.close();
            return;
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }

        if (pollCount >= MAX_POLLS) {
          // Get final status before closing
          const finalResponse = await fetchContainer(containerId);
          const finalStatus = finalResponse.status || "unknown";
          const finalOutput = finalResponse.output || JSON.stringify(finalResponse);
          
          sendEvent({
            type: "error",
            message: `Max polls reached (${MAX_POLLS}). Final status: ${finalStatus}. URLs found: ${seenUrls.size}`,
            raw: finalOutput.substring(0, 1000),
            timestamp: new Date().toISOString(),
          });
          
          // If we found URLs, mark as finished with partial results
          if (seenUrls.size > 0) {
            await db
              .update(runs)
              .set({
                status: "finished",
                totalUrls: seenUrls.size,
                rawOutput: `Max polls reached but ${seenUrls.size} URLs found. Final status: ${finalStatus}`,
              })
              .where(eq(runs.id, runId));
            
            sendEvent({
              type: "done",
              total: seenUrls.size,
              timestamp: new Date().toISOString(),
            });
          } else {
            await db
              .update(runs)
              .set({
                status: "error",
                rawOutput: `Max polls reached. Final status: ${finalStatus}. Response: ${finalOutput.substring(0, 5000)}`,
              })
              .where(eq(runs.id, runId));
          }
        }

        controller.close();
      } catch (error) {
        sendEvent({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
        await db
          .update(runs)
          .set({
            status: "error",
            rawOutput: error instanceof Error ? error.message : String(error),
          })
          .where(eq(runs.id, runId));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

