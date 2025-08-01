// app/api/application/status/[applicationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Get application with status history
    const application = await prisma.startupApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        startupName: true,
        status: true,
        statusUpdatedAt: true,
        createdAt: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      startupName: application.startupName,
      currentStatus: application.status,
      statusUpdatedAt: application.statusUpdatedAt,
      createdAt: application.createdAt,
      statusHistory: application.statusHistory.map((history) => ({
        id: history.id,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        createdAt: history.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
