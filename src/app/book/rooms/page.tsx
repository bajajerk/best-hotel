"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow, SelectedRoom } from "@/context/BookingFlowContext";
import { MOCK_ROOMS, MOCK_HOTEL } from "../mockData";

export default function RoomSelectionPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const [selected, setSelected] = useState<Map<string, number>>(new Map());

  // Initialize hotel & dates on mount
  useEffect(() => {
    flow.setHotel(MOCK_HOTEL.name, MOCK_HOTEL.image, MOCK_HOTEL.city, MOCK_HOTEL.stars);
    if (!flow.checkIn) {
      const ci = new Date();
      ci.setDate(ci.getDate() + 7);
      const co = new Date(ci);
      co.setDate(co.getDate() + 3);
      flow.setStayDates(ci.toISOString().split("T")[0], co.toISOString().split("T")[0]);
    }
    // Restore previous selections
    if (flow.selectedRooms.length > 0) {
      const map = new Map<string, number>();
      flow.selectedRooms.forEach((r) => map.set(r.roomType.id, r.quantity));
      setSelected(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRoom = (roomId: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.set(roomId, 1);
      }
      return next;
    });
  };

  const setQty = (roomId: string, qty: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(roomId);
      } else {
        next.set(roomId, Math.min(qty, 5));
      }
      return next;
    });
  };

  const totalRooms = Array.from(selected.values()).reduce((s, v) => s + v, 0);
  const totalPrice = Array.from(selected.entries()).reduce((sum, [id, qty]) => {
    const room = MOCK_ROOMS.find((r) => r.id === id);
    return sum + (room ? room.pricePerNight * qty * flow.nights : 0);
  }, 0);

  const handleContinue = () => {
    const rooms: SelectedRoom[] = [];
    selected.forEach((qty, id) => {
      const room = MOCK_ROOMS.find((r) => r.id === id);
      if (room) rooms.push({ roomType: room, quantity: qty });
    });
    flow.setSelectedRooms(rooms);
    router.push("/book/guest-details");
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* Hotel summary card */}
      <div style={{
        background: "var(--white)",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--cream-border)",
        marginBottom: 24,
      }}>
        <div style={{ position: "relative", height: 180 }}>
          <Image
            src={MOCK_HOTEL.image}
            alt={MOCK_HOTEL.name}
            fill
            style={{ objectFit: "cover" }}
            sizes="800px"
          />
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "40px 20px 16px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            color: "white",
          }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {Array.from({ length: MOCK_HOTEL.stars }).map((_, i) => (
                <span key={i} style={{ fontSize: 14, color: "var(--gold-light)" }}>&#9733;</span>
              ))}
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "var(--text-heading-2)", margin: 0, fontWeight: 500 }}>
              {MOCK_HOTEL.name}
            </h2>
            <p style={{ fontFamily: "var(--sans)", fontSize: "var(--text-body-sm)", margin: "4px 0 0", opacity: 0.9 }}>
              {MOCK_HOTEL.city}
            </p>
          </div>
        </div>

        {/* Stay dates bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderTop: "1px solid var(--cream-border)",
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
        }}>
          <div>
            <span style={{ color: "var(--ink-light)", fontSize: "var(--text-caption)" }}>Check-in</span>
            <div style={{ fontWeight: 500, color: "var(--ink)" }}>{formatDate(flow.checkIn)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "var(--gold-pale)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: "var(--text-caption)",
              fontWeight: 500,
              color: "var(--gold)",
            }}>
              {flow.nights} night{flow.nights !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--ink-light)", fontSize: "var(--text-caption)" }}>Check-out</span>
            <div style={{ fontWeight: 500, color: "var(--ink)" }}>{formatDate(flow.checkOut)}</div>
          </div>
        </div>
      </div>

      {/* Room list */}
      <h3 style={{
        fontFamily: "var(--serif)",
        fontSize: "var(--text-heading-3)",
        fontWeight: 500,
        color: "var(--ink)",
        margin: "0 0 16px",
      }}>
        Choose your room
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MOCK_ROOMS.map((room) => {
          const isSelected = selected.has(room.id);
          const qty = selected.get(room.id) || 0;
          return (
            <div
              key={room.id}
              style={{
                background: "var(--white)",
                borderRadius: 14,
                overflow: "hidden",
                border: `2px solid ${isSelected ? "var(--gold)" : "var(--cream-border)"}`,
                opacity: room.available ? 1 : 0.5,
                transition: "border-color 0.2s ease",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", gap: 0 }}>
                {/* Room image */}
                <div style={{ position: "relative", width: 160, minHeight: 160, flexShrink: 0 }}>
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="160px"
                  />
                </div>

                {/* Room info */}
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h4 style={{
                    fontFamily: "var(--serif)",
                    fontSize: "var(--text-display-4)",
                    fontWeight: 500,
                    color: "var(--ink)",
                    margin: "0 0 4px",
                  }}>
                    {room.name}
                  </h4>
                  <p style={{
                    fontFamily: "var(--sans)",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--ink-light)",
                    margin: "0 0 8px",
                    lineHeight: 1.5,
                  }}>
                    {room.description}
                  </p>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                    fontFamily: "var(--sans)",
                    fontSize: "var(--text-caption)",
                    color: "var(--ink-mid)",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bed</span>
                      {room.bedType}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                      Up to {room.maxGuests}
                    </span>
                  </div>

                  {/* Amenities */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {room.amenities.slice(0, 4).map((a) => (
                      <span key={a} style={{
                        background: "var(--cream)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        fontSize: "var(--text-caption)",
                        fontFamily: "var(--sans)",
                        color: "var(--ink-mid)",
                      }}>
                        {a}
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span style={{
                        fontSize: "var(--text-caption)",
                        fontFamily: "var(--sans)",
                        color: "var(--gold)",
                        padding: "3px 0",
                      }}>
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Price & select */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "auto",
                  }}>
                    <div>
                      <span style={{
                        fontFamily: "var(--serif)",
                        fontSize: "var(--text-heading-2)",
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}>
                        ${room.pricePerNight}
                      </span>
                      <span style={{
                        fontFamily: "var(--sans)",
                        fontSize: "var(--text-caption)",
                        color: "var(--ink-light)",
                        marginLeft: 4,
                      }}>
                        /night
                      </span>
                    </div>

                    {room.available ? (
                      isSelected ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => setQty(room.id, qty - 1)}
                            style={{
                              width: 32, height: 32, borderRadius: "50%",
                              border: "1px solid var(--cream-border)", background: "var(--white)",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: "var(--sans)", fontSize: 16, color: "var(--ink)",
                            }}
                          >
                            &minus;
                          </button>
                          <span style={{
                            fontFamily: "var(--sans)",
                            fontWeight: 600,
                            fontSize: "var(--text-body)",
                            minWidth: 20,
                            textAlign: "center",
                          }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(room.id, qty + 1)}
                            style={{
                              width: 32, height: 32, borderRadius: "50%",
                              border: "1px solid var(--cream-border)", background: "var(--white)",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: "var(--sans)", fontSize: 16, color: "var(--ink)",
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleRoom(room.id)}
                          style={{
                            fontFamily: "var(--sans)",
                            fontSize: "var(--text-body-sm)",
                            fontWeight: 500,
                            padding: "8px 20px",
                            borderRadius: 8,
                            border: "1px solid var(--gold)",
                            background: "transparent",
                            color: "var(--gold)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Select
                        </button>
                      )
                    ) : (
                      <span style={{
                        fontFamily: "var(--sans)",
                        fontSize: "var(--text-body-sm)",
                        color: "var(--error)",
                        fontWeight: 500,
                      }}>
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      {totalRooms > 0 && (
        <div className="compare-bar-mobile" style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--white)",
          borderTop: "1px solid var(--cream-border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 110,
        }}>
          <div>
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              color: "var(--ink-light)",
            }}>
              {totalRooms} room{totalRooms !== 1 ? "s" : ""} &middot; {flow.nights} night{flow.nights !== 1 ? "s" : ""}
            </div>
            <div style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--text-heading-2)",
              fontWeight: 600,
              color: "var(--ink)",
            }}>
              ${totalPrice.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleContinue}
            style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 500,
              padding: "14px 36px",
              borderRadius: 10,
              border: "none",
              background: "var(--ink)",
              color: "var(--white)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Continue
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
