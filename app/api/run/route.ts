import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { runs } from "@/db/schema";
import { hashCookie } from "@/lib/utils";
import { launchPhantomAgent } from "@/lib/phantombuster";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { liAt, postUrl } = body;

    if (!liAt || !postUrl) {
      return NextResponse.json(
        { error: "Missing required fields: liAt and postUrl" },
        { status: 400 }
      );
    }

    // Validate postUrl is a LinkedIn URL
    if (!postUrl.includes("linkedin.com")) {
      return NextResponse.json(
        { error: "postUrl must be a LinkedIn URL" },
        { status: 400 }
      );
    }

    // Launch PhantomBuster agent
    const launchResponse = await launchPhantomAgent(liAt, postUrl);

    if (!launchResponse.containerId) {
      return NextResponse.json(
        {
          error: "Failed to launch agent",
          details: launchResponse,
        },
        { status: 500 }
      );
    }

    // Create run record in database
    const runId = randomUUID();
    await db.insert(runs).values({
      id: runId,
      liAtHash: hashCookie(liAt),
      postUrl: postUrl,
      phantomAgentId: "6747273483102031",
      containerId: launchResponse.containerId,
      status: "running",
      totalUrls: 0,
    });

    return NextResponse.json({
      runId,
      containerId: launchResponse.containerId,
    });
  } catch (error) {
    console.error("Error launching run:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Full error:", { errorMessage, errorStack, error });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
        // Include stack in development
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}

