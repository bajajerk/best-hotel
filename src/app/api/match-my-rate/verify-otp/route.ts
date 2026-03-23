import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/match-my-rate/verify-otp
 * Sends and verifies OTP for phone number verification.
 *
 * In production, this would integrate with an SMS gateway (MSG91, Twilio, etc.)
 * Currently accepts any 6-digit OTP for development purposes.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, action } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    // Send OTP
    if (action === "send") {
      // TODO: In production, send OTP via SMS gateway:
      // await smsGateway.sendOTP({ phone, template: "match-my-rate" });

      // Simulate sending delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    }

    // Verify OTP
    if (action === "verify") {
      if (!otp || otp.length !== 6) {
        return NextResponse.json(
          { error: "Invalid OTP format" },
          { status: 400 }
        );
      }

      // TODO: In production, verify OTP against the SMS gateway
      // const isValid = await smsGateway.verifyOTP({ phone, otp });

      // For development: accept any 6-digit OTP
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json({
        success: true,
        verified: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "OTP verification failed" },
      { status: 500 }
    );
  }
}
