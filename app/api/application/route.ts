
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get application with status history
    const applications = await prisma.startupApplication.findMany({
      include: {
        videos: true,
        statusHistory: true,
        files: true,

      },
    });

    if (!applications) {
      return NextResponse.json(
        { error: "Applications not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
