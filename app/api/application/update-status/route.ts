// app/api/application/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const { applicationId, status } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "applicationId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["APPLIED", "SHORTLISTED", "SELECTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Allowed: APPLIED, SHORTLISTED, SELECTED, REJECTED",
        },
        { status: 400 }
      );
    }

    // Get current application
    const application = await prisma.startupApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.startupApplication.update({
      where: { id: applicationId },
      data: {
        status,
        statusUpdatedAt: new Date(),
      },
    });

    // Create status history entry
    await prisma.statusHistory.create({
      data: {
        applicationId,
        fromStatus: application.status,
        toStatus: status,
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: updatedApplication.id,
      status: updatedApplication.status,
      statusUpdatedAt: updatedApplication.statusUpdatedAt,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
