import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/concierge/request — Log a concierge chat request from the
 * floating WhatsApp button and return a contextualised WhatsApp deep-link.
 */

interface ConciergePayload {
  page?: string;
  message?: string;
}

function generateRequestId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "VYG-C-";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConciergePayload = await request.json();

    const requestId = generateRequestId();
    const requestData = {
      requestId,
      page: body.page ?? "",
      message: body.message ?? "",
      createdAt: new Date().toISOString(),
    };

    // TODO: forward to CRM / analytics in production
    console.log("[Concierge Request]", JSON.stringify(requestData, null, 2));

    const defaultMessage =
      body.message?.trim() ||
      "Hi Voyagr, I'd like to book a hotel";
    const whatsappText = encodeURIComponent(
      `${defaultMessage}\nRef: ${requestId}`
    );
    const whatsappLink = `https://wa.me/919876543210?text=${whatsappText}`;

    return NextResponse.json({
      success: true,
      requestId,
      whatsappLink,
    });
  } catch (error) {
    console.error("[Concierge Request Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
