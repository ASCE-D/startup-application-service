import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 }
      );
    }

    // Get all evaluations for the application
    const evaluations = await prisma.evaluation.findMany({
      where: { applicationId },
    });

    if (evaluations.length === 0) {
      return NextResponse.json({
        success: true,
        averageScore: 0,
        totalReviews: 0,
        combinedFeedback: [],
      });
    }

    // Calculate average score
    const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
    const averageScore = Number((totalScore / evaluations.length).toFixed(2));

    // Combine all feedback
    const combinedFeedback = evaluations.map((evaluation) => ({
      reviewerId: evaluation.reviewerId,
      score: evaluation.score,
      feedback: evaluation.feedback,
      createdAt: evaluation.createdAt,
    }));

    return NextResponse.json({
      success: true,
      averageScore,
      totalReviews: evaluations.length,
      combinedFeedback,
    });
  } catch (error) {
    console.error("Evaluation summary error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve evaluation summary" },
      { status: 500 }
    );
  }
}
