import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    // Get application with status history
    const session = await getServerSession();

    const applications = await prisma.founderProfile.findUnique({
      where: {
        email: session?.user?.email as string,
      },
      select: {
        applications: {
          include: {
            videos: true,
            statusHistory: true,
            files: true,
            evaluations: true,
          },
        },
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
