import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { likers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stringify } from "csv-stringify/sync";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json(
      { error: "Missing runId parameter" },
      { status: 400 }
    );
  }

  try {
    const likersList = await db.query.likers.findMany({
      where: eq(likers.runId, runId),
      orderBy: (likers, { asc }) => [asc(likers.createdAt)],
    });

    // Prepare CSV data
    const csvData = likersList.map((liker, index) => ({
      index: index + 1,
      profileUrl: liker.profileUrl,
      runId: liker.runId,
      createdAt: liker.createdAt.toISOString(),
    }));

    const csv = stringify(csvData, {
      header: true,
      columns: ["index", "profileUrl", "runId", "createdAt"],
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="likers-${runId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

