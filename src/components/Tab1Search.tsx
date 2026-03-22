"use client";

import { motion } from "framer-motion";
import { useBooking } from "@/context/BookingContext";

const featuredHotels = [
  {
    name: "Taj Lands End",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80",
    location: "Bandra, Mumbai",
    otaPrice: 8500,
    ourPrice: 5900,
    savings: 31,
  },
  {
    name: "The Oberoi",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
    location: "Nariman Point, Mumbai",
    otaPrice: 12000,
    ourPrice: 7800,
    savings: 35,
  },
  {
    name: "ITC Grand Central",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80",
    location: "Parel, Mumbai",
    otaPrice: 9200,
    ourPrice: 6400,
    savings: 30,
  },
  {
    name: "Trident Nariman Point",
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
    location: "Nariman Point, Mumbai",
    otaPrice: 10500,
    ourPrice: 7100,
    savings: 32,
  },
];

const steps = [
  {
    number: 1,
    title: "Search or upload",
    description: "Find your hotel or screenshot any booking site",
  },
  {
    number: 2,
    title: "We find better rates",
    description: "Our network of hotel partners offers exclusive prices",
  },
  {
    number: 3,
    title: "Book & save",
    description: "Save 20-40% on every booking, guaranteed",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
};

export default function Tab1Search() {
  const { checkIn, checkOut, setCheckIn, setCheckOut, formatDate } = useBooking();

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--bg-black)" }}
    >
      {/* ─── Hero Section ─── */}
      <div className="relative" style={{ height: 340 }}>
        {/* Hero Image */}
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
          alt="Luxury hotel pool"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.6) 50%, var(--bg-black) 100%)",
          }}
        />

        {/* Logo */}
        <div
          className="absolute"
          style={{
            top: 20,
            left: 24,
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 18,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--white-80)",
            letterSpacing: -0.3,
          }}
        >
          beatmyrate
        </div>

        {/* Hero Text */}
        <div
          className="absolute"
          style={{ bottom: 32, left: 24, right: 24 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 36,
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.1,
              letterSpacing: -0.5,
              color: "var(--white)",
              marginBottom: 8,
            }}
          >
            find your perfect stay
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 13,
              fontWeight: 300,
              color: "var(--white-50)",
              lineHeight: 1.5,
            }}
          >
            we negotiate directly with hotels so you pay less
          </motion.p>
        </div>
      </div>

      {/* ─── Search Bar Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          margin: "-16px 16px 0",
          padding: 16,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Destination */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 9,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--white-30)",
              marginBottom: 4,
            }}
          >
            DESTINATION
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--white-80)",
            }}
          >
            Mumbai
          </div>
        </div>

        {/* Dates Row */}
        <div className="flex gap-2.5" style={{ marginBottom: 10 }}>
          <label
            className="flex-1"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 14px",
              position: "relative",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 9,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--white-30)",
                marginBottom: 4,
              }}
            >
              CHECK-IN
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                fontWeight: 400,
                color: checkIn ? "var(--white-80)" : "var(--white-30)",
              }}
            >
              {formatDate(checkIn, "Select date")}
            </div>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%",
              }}
            />
          </label>
          <label
            className="flex-1"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 14px",
              position: "relative",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 9,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--white-30)",
                marginBottom: 4,
              }}
            >
              CHECK-OUT
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                fontWeight: 400,
                color: checkOut ? "var(--white-80)" : "var(--white-30)",
              }}
            >
              {formatDate(checkOut, "Select date")}
            </div>
            <input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%",
              }}
            />
          </label>
        </div>

        {/* Guests */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 9,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--white-30)",
              marginBottom: 4,
            }}
          >
            GUESTS
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--white-80)",
            }}
          >
            2 Adults
          </div>
        </div>

        {/* Search Button */}
        <button
          className="w-full cursor-pointer"
          style={{
            padding: 14,
            background: "var(--gold)",
            color: "var(--bg-black)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            borderRadius: 14,
            letterSpacing: 0.3,
          }}
        >
          Search Hotels
        </button>
      </motion.div>

      {/* ─── Featured Hotels ─── */}
      <div style={{ padding: "32px 24px 0" }}>
        <motion.div
          {...fadeInUp}
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 20,
          }}
        >
          FEATURED DEALS
        </motion.div>

        <div className="flex flex-col gap-4">
          {featuredHotels.map((hotel, i) => (
            <motion.div
              key={hotel.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              {/* Hotel Image */}
              <div className="relative" style={{ height: 160 }}>
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 40%, rgba(17,17,17,0.9) 100%)",
                  }}
                />

                {/* Savings Badge */}
                <div
                  className="absolute"
                  style={{
                    top: 12,
                    right: 12,
                    padding: "4px 10px",
                    background: "var(--gold-soft)",
                    border: "1px solid var(--gold-border)",
                    borderRadius: 8,
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--gold)",
                    letterSpacing: 0.5,
                  }}
                >
                  Save {hotel.savings}%
                </div>

                {/* Hotel Name Over Image */}
                <div
                  className="absolute"
                  style={{ bottom: 12, left: 14, right: 14 }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-instrument-serif)",
                      fontSize: 20,
                      fontWeight: 400,
                      color: "var(--white)",
                      lineHeight: 1.2,
                    }}
                  >
                    {hotel.name}
                  </div>
                </div>
              </div>

              {/* Hotel Details */}
              <div style={{ padding: "14px 16px 16px" }}>
                {/* Stars + Location */}
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 12 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "var(--gold)", fontSize: 12 }}>
                      &#9733;&#9733;&#9733;&#9733;&#9733;
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 9,
                        color: "var(--white-30)",
                        letterSpacing: 0.5,
                      }}
                    >
                      5-STAR
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--white-30)",
                      fontWeight: 300,
                    }}
                  >
                    {hotel.location}
                  </span>
                </div>

                {/* Price Row */}
                <div
                  className="flex items-end justify-between"
                  style={{ marginBottom: 14 }}
                >
                  {/* OTA Price */}
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--white-30)",
                        marginBottom: 2,
                        fontWeight: 300,
                      }}
                    >
                      OTA Price
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-instrument-serif)",
                        fontSize: 18,
                        color: "var(--red)",
                        textDecoration: "line-through",
                        opacity: 0.7,
                      }}
                    >
                      &#8377;{hotel.otaPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Our Price */}
                  <div className="text-right">
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--green)",
                        marginBottom: 2,
                        fontWeight: 400,
                      }}
                    >
                      Our Price
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-instrument-serif)",
                        fontSize: 26,
                        fontStyle: "italic",
                        color: "var(--green)",
                        lineHeight: 1,
                      }}
                    >
                      &#8377;{hotel.ourPrice.toLocaleString("en-IN")}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--white-30)",
                        fontWeight: 300,
                        marginLeft: 4,
                      }}
                    >
                      /night
                    </span>
                  </div>
                </div>

                {/* View Deal Button */}
                <button
                  className="w-full cursor-pointer"
                  style={{
                    padding: 12,
                    background: "var(--gold)",
                    color: "var(--bg-black)",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 13,
                    fontWeight: 500,
                    border: "none",
                    borderRadius: 12,
                    letterSpacing: 0.3,
                  }}
                >
                  View Deal
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <div style={{ padding: "40px 24px 0" }}>
        <motion.div
          {...fadeInUp}
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 24,
          }}
        >
          HOW IT WORKS
        </motion.div>

        <div className="flex flex-col gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.45,
                delay: i * 0.12,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex gap-4 items-start"
            >
              {/* Step Number Circle */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid var(--gold-border)",
                  background: "var(--gold-soft)",
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: 16,
                  color: "var(--gold)",
                  fontStyle: "italic",
                }}
              >
                {step.number}
              </div>

              {/* Step Content */}
              <div style={{ paddingTop: 2 }}>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--white-80)",
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 300,
                    color: "var(--white-30)",
                    lineHeight: 1.5,
                  }}
                >
                  {step.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Trust Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
        style={{ padding: "40px 24px 40px" }}
      >
        <div
          style={{
            background: "var(--white-04)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "20px 16px",
          }}
        >
          <div
            className="flex items-center justify-center gap-2"
            style={{ marginBottom: 6 }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--gold)",
              }}
            >
              2,340+
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "var(--white-80)",
              }}
            >
              happy travelers
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 300,
              color: "var(--white-50)",
              marginBottom: 10,
            }}
          >
            Avg. saving{" "}
            <span
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
                fontSize: 14,
              }}
            >
              &#8377;2,800
            </span>
            /night
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 300,
              color: "var(--white-30)",
              letterSpacing: 0.3,
            }}
          >
            No hidden fees. No markup.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
