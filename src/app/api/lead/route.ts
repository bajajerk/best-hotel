import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/lead — Capture a lead from the "Unlock Preferred Rate" flow.
 *
 * Accepts guest contact info + hotel/room context.
 * In production, this would forward to a CRM (HubSpot, Salesforce)
 * and/or trigger a WhatsApp message via the Business API.
 *
 * For now: validates, logs, and returns a lead reference ID.
 */

interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  hotelId: number;
  hotelName: string;
  roomName: string;
  rateType: "preferred" | "standard";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  nightlyRate: number;
  marketRate: number;
  currency: string;
  source: "unlock_rate" | "whatsapp" | "concierge";
}

function generateLeadId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "VYG-L-";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateMobile(mobile: string): boolean {
  return mobile.trim().replace(/\D/g, "").length >= 7;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    // Validate required fields
    const errors: string[] = [];
    if (!body.firstName?.trim()) errors.push("firstName is required");
    if (!body.lastName?.trim()) errors.push("lastName is required");
    if (!body.email?.trim() || !validateEmail(body.email)) errors.push("valid email is required");
    if (!body.mobile?.trim() || !validateMobile(body.mobile)) errors.push("valid mobile is required");
    if (!body.hotelName?.trim()) errors.push("hotelName is required");

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    const leadId = generateLeadId();
    const leadData = {
      leadId,
      ...body,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim(),
      mobile: body.mobile.trim(),
      createdAt: new Date().toISOString(),
      status: "new",
    };

    // TODO: In production, forward to CRM
    // await crmClient.createLead(leadData);

    // TODO: In production, trigger WhatsApp via Business API
    // await whatsappClient.sendTemplate(body.mobile, "rate_unlock", { hotelName, rate, ... });

    console.log("[Lead Captured]", JSON.stringify(leadData, null, 2));

    // Construct WhatsApp deep link with context
    const whatsappText = encodeURIComponent(
      `Hi Voyagr, I'd like to unlock the preferred rate for ${body.hotelName}.\n` +
      `Room: ${body.roomName}\n` +
      `Dates: ${body.checkIn} to ${body.checkOut} (${body.nights} nights)\n` +
      `My name: ${body.firstName} ${body.lastName}\n` +
      `Reference: ${leadId}`
    );
    const whatsappLink = `https://wa.me/919876543210?text=${whatsappText}`;

    return NextResponse.json({
      success: true,
      leadId,
      whatsappLink,
      message: "Our concierge will reach out within 15 minutes on WhatsApp.",
    });
  } catch (error) {
    console.error("[Lead API Error]", error);
    return NextResponse.json(
      { success: false, errors: ["Internal server error"] },
      { status: 500 }
    );
  }
}
