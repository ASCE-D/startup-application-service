import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { applicationId, reviewerId, score, feedback } = await request.json();

    if (!applicationId || !reviewerId || !score || !feedback) {
      return NextResponse.json(
        {
          error: "applicationId, reviewerId, score, and feedback are required",
        },
        { status: 400 }
      );
    }

    if (score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Verify application exists
    const application = await prisma.startupApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        applicationId,
        reviewerId,
        score,
        feedback,
      },
    });

    return NextResponse.json(
      {
        success: true,
        evaluationId: evaluation.id,
        message: "Evaluation submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual score error:", error);
    return NextResponse.json(
      { error: "Failed to submit evaluation" },
      { status: 500 }
    );
  }
}
