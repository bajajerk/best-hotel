import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/match-my-rate/search
 * Takes extracted hotel details and finds B2B wholesale rates.
 *
 * In production, this would query the HotelBeds / RateHawk / similar B2B API
 * to find wholesale rates for the same hotel + dates.
 * Currently returns a realistic mock with 15-40% discount off OTA price.
 */

export interface WholesaleResult {
  hotelName: string;
  location: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  otaName: string;
  otaPrice: number;
  ourPrice: number;
  savings: number;
  savingsPercent: number;
  totalOta: number;
  totalOurs: number;
  currency: string;
  includesBreakfast: boolean;
  freeCancellation: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hotelName,
      location,
      checkIn,
      checkOut,
      nights,
      roomType,
      guests,
      otaName,
      otaPrice,
      currency,
    } = body;

    if (!hotelName || !otaPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: In production, query B2B hotel API:
    // const searchResult = await b2bApi.search({
    //   hotelName, checkIn, checkOut, adults: 2, currency
    // });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a realistic discount between 18-35%
    const discountPercent = 18 + Math.floor(Math.random() * 18);
    const ourPrice = Math.round(otaPrice * (1 - discountPercent / 100));
    const nightCount = nights || 1;
    const savings = otaPrice - ourPrice;

    const result: WholesaleResult = {
      hotelName,
      location: location || "",
      roomType: roomType || "Standard Room",
      checkIn,
      checkOut,
      nights: nightCount,
      guests: guests || "2 Adults",
      otaName: otaName || "OTA",
      otaPrice,
      ourPrice,
      savings,
      savingsPercent: discountPercent,
      totalOta: otaPrice * nightCount,
      totalOurs: ourPrice * nightCount,
      currency: currency || "INR",
      includesBreakfast: Math.random() > 0.3,
      freeCancellation: Math.random() > 0.4,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search wholesale rates" },
      { status: 500 }
    );
  }
}
