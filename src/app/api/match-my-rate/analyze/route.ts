import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/match-my-rate/analyze
 * Accepts a screenshot (base64 image) and extracts hotel booking details using AI.
 *
 * In production, this would call Claude Vision API or OpenAI Vision to parse the screenshot.
 * Currently returns a realistic mock response for frontend development.
 *
 * To integrate real AI:
 *   1. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in environment
 *   2. Send the base64 image to the vision model with a structured extraction prompt
 *   3. Parse the JSON response into the ExtractedData shape below
 */

export interface ExtractedData {
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  guests: string;
  otaName: string;
  otaPrice: number;
  currency: string;
  confidence: number;
}

// Realistic mock extractions based on common OTA screenshots
const MOCK_EXTRACTIONS: ExtractedData[] = [
  {
    hotelName: "Taj Lands End",
    location: "Mumbai, India",
    checkIn: "2026-04-15",
    checkOut: "2026-04-18",
    nights: 3,
    roomType: "Deluxe Sea View Room",
    guests: "2 Adults",
    otaName: "MakeMyTrip",
    otaPrice: 8500,
    currency: "INR",
    confidence: 0.94,
  },
  {
    hotelName: "The Leela Palace",
    location: "Bengaluru, India",
    checkIn: "2026-05-01",
    checkOut: "2026-05-04",
    nights: 3,
    roomType: "Royal Premier Room",
    guests: "2 Adults",
    otaName: "Booking.com",
    otaPrice: 12200,
    currency: "INR",
    confidence: 0.91,
  },
  {
    hotelName: "ITC Grand Chola",
    location: "Chennai, India",
    checkIn: "2026-04-20",
    checkOut: "2026-04-22",
    nights: 2,
    roomType: "ITC One Tower Suite",
    guests: "2 Adults, 1 Child",
    otaName: "Agoda",
    otaPrice: 15800,
    currency: "INR",
    confidence: 0.88,
  },
  {
    hotelName: "The Oberoi Udaivilas",
    location: "Udaipur, India",
    checkIn: "2026-06-10",
    checkOut: "2026-06-13",
    nights: 3,
    roomType: "Premier Room with Lake View",
    guests: "2 Adults",
    otaName: "Expedia",
    otaPrice: 22500,
    currency: "INR",
    confidence: 0.92,
  },
  {
    hotelName: "JW Marriott Sahar",
    location: "Mumbai, India",
    checkIn: "2026-04-25",
    checkOut: "2026-04-28",
    nights: 3,
    roomType: "Deluxe King Room",
    guests: "2 Adults",
    otaName: "Cleartrip",
    otaPrice: 9800,
    currency: "INR",
    confidence: 0.90,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // TODO: In production, send image to Claude Vision API:
    // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // const response = await anthropic.messages.create({
    //   model: "claude-sonnet-4-20250514",
    //   max_tokens: 1024,
    //   messages: [{
    //     role: "user",
    //     content: [{
    //       type: "image", source: { type: "base64", media_type: "image/png", data: image }
    //     }, {
    //       type: "text",
    //       text: "Extract hotel booking details from this OTA screenshot. Return JSON with: hotelName, location, checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD), nights, roomType, guests, otaName, otaPrice (number), currency."
    //     }]
    //   }]
    // });

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return a random mock extraction
    const extraction =
      MOCK_EXTRACTIONS[Math.floor(Math.random() * MOCK_EXTRACTIONS.length)];

    return NextResponse.json({
      success: true,
      data: extraction,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze screenshot" },
      { status: 500 }
    );
  }
}
