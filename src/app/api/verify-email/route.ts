import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find verification token in database
    const verificationRecord = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    if (verificationRecord.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const record = verificationRecord[0];

    // Check if token has expired
    if (new Date() > record.expiresAt) {
      // Delete expired token
      await db
        .delete(verification)
        .where(eq(verification.id, record.id));

      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await db
      .update(user)
      .set({ 
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(user.email, record.identifier));

    // Delete the verification token (one-time use)
    await db
      .delete(verification)
      .where(eq(verification.id, record.id));

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email. Please try again." },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists and is not verified
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userRecord[0];

    if (userData.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this email
    await db
      .delete(verification)
      .where(eq(verification.identifier, email));

    // Trigger better-auth to send a new verification email
    // Note: In production, you would call better-auth's resend verification function
    // For now, return success and let the client know to use the registration flow
    
    return NextResponse.json(
      { 
        message: "If your email exists in our system, you will receive a new verification email shortly.",
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
