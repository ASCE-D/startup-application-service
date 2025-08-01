import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {
      founderName,
      email,
      startupName,
      idea,
      sector,
      country,
      techStack,
      isDraft = false,
    } = await request.json();

    let founder = await prisma.founderProfile.findUnique({
      where: { email },
    });

    if (!founder) {
      founder = await prisma.founderProfile.create({
        data: {
          name: founderName,
          email,
        },
      });
    }

    const existingApplication = await prisma.startupApplication.findUnique({
      where: { founderId: founder.id },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Application already exists for this founder" },
        { status: 409 }
      );
    }

    const application = await prisma.startupApplication.create({
      data: {
        founderId: founder.id,
        startupName,
        idea,
        sector,
        country,
        techStack,
        isDraft,
        status: "APPLIED",
        statusUpdatedAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: null,
        toStatus: "APPLIED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        message: isDraft
          ? "Application saved as draft"
          : "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
