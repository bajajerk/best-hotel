"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, getIdToken, signOut, resetPassword, updatePassword } = useAuth();
  const initialTab = searchParams.get("tab") === "security" ? "security"
    : searchParams.get("tab") === "preferences" ? "preferences" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">(initialTab);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preferences
  const [currency, setCurrency] = useState("INR");
  const [travelerType, setTravelerType] = useState("couple");
  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  // Password change
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Focus tracking for hairline-on-focus inputs (matches /login phoneRow behavior).
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Profile data from backend
  const [profile, setProfile] = useState<Record<string, string | number | null> | null>(null);
  const [tier, setTier] = useState("basic");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      getIdToken().then((token) => {
        if (token) {
          fetchProfile(token);
          fetchPreferences(token);
        }
      });
    }
  }, [loading, user, router, getIdToken]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  async function fetchProfile(token: string) {
    try {
      const res = await fetch(`${apiBase}/api/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName((data.name as string) || user?.displayName || "");
        setPhone((data.phone as string) || user?.phoneNumber || "");
        setTier((data.tier as string) || "basic");
        return;
      }
    } catch {
      // fall through to Supabase fallback
    }
    // Fallback: use Firebase user metadata
    if (user) {
      setName(user.displayName || user.email?.split("@")[0] || "");
      if (user.phoneNumber && !phone) {
        setPhone(user.phoneNumber);
      }
    }
  }

  async function fetchPreferences(token: string) {
    try {
      const res = await fetch(`${apiBase}/api/account/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrency(data.currency || "INR");
        setTravelerType(data.traveler_type || "couple");
        setNotifications(data.notifications_enabled ?? true);
        setNewsletter(data.newsletter_enabled ?? true);
      }
    } catch {
      // Defaults are fine
    }
  }

  async function saveProfile() {
    const token = await getIdToken();
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${apiBase}/api/account/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    }
    setSaving(false);
  }

  async function savePreferences() {
    const token = await getIdToken();
    if (!token) return;
    setPrefSaving(true);
    setPrefSaved(false);
    try {
      await fetch(`${apiBase}/api/account/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency,
          traveler_type: travelerType,
          notifications_enabled: notifications,
          newsletter_enabled: newsletter,
        }),
      });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2000);
    } catch {
      // silent
    }
    setPrefSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (loading) {
    // Calm champagne breath, no spinner — matches /login's editorial silence.
    return (
      <div className="luxe">
        <Header />
        <main style={s.main}>
          <div style={s.container}>
            <div style={s.loadingPulse} aria-label="Loading">
              <div style={s.loadingPulseBar} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // Note: we deliberately don't show the avatar by default — the hero is
  // text-first (Apple Account vibe). If you want avatar back, uncomment the
  // ring block below in the JSX.
  const displayName = name || user.displayName || user.email?.split("@")[0] || user.phoneNumber || "";
  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";
  const provider = user.providerData?.[0]?.providerId || "password";

  // Editorial tier copy — italic Playfair word marks in champagne, no gray pills.
  const tierLabels: Record<string, string> = {
    basic: "Voyagr Member",
    silver: "Silver Circle",
    gold: "Gold Circle",
    platinum: "Inner Circle",
  };
  const tierLabel = tierLabels[tier] || tierLabels.basic;

  const providerLabel =
    provider === "google.com" ? "Google Account"
      : provider === "phone" ? "Phone Account"
      : "Email Account";

  return (
    <div className="luxe">
      <Header />
      <main style={s.main}>
        {/* Faint champagne horizon hairline behind the hero — same gesture
            that anchors /login. Kept very low opacity so it never competes
            with the content cards. */}
        <div aria-hidden style={s.horizon} />

        <div style={s.container}>
          {/* ── Hero: editorial identity row ── */}
          <section style={s.hero}>
            <span style={s.heroEyebrow}>
              {memberSince ? `MEMBER · SINCE ${memberSince.toUpperCase()}` : "VOYAGR MEMBER"}
            </span>
            <h1 style={s.heroName}>{displayName}</h1>
            <p style={s.heroEmail}>
              {user.email || user.phoneNumber || ""}
            </p>
            <p style={s.heroTier}>
              <span style={s.heroTierMark}>{tierLabel}</span>
              <span style={s.heroTierSep} aria-hidden>·</span>
              <span style={s.heroTierProvider}>{providerLabel}</span>
            </p>
          </section>

          {/* ── Tabs: hairline-divider strip, mono caps, champagne underline ── */}
          <div style={s.tabsWrap}>
            <div style={s.tabsHairline} aria-hidden />
            <div style={s.tabs} role="tablist">
              {(["profile", "preferences", "security"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const labelText = tab === "profile" ? "Profile" : tab === "preferences" ? "Preferences" : "Security";
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      ...s.tabBtn,
                      color: isActive ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-50)",
                    }}
                  >
                    {labelText}
                    <span
                      aria-hidden
                      style={{
                        ...s.tabUnderline,
                        background: isActive ? "var(--luxe-champagne)" : "transparent",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Profile tab ── */}
          {activeTab === "profile" && (
            <section style={s.card} aria-labelledby="profile-heading">
              <header style={s.cardHead}>
                <h2 id="profile-heading" style={s.cardTitle}>Personal information</h2>
                <p style={s.cardDesc}>Update the name and contact we use across every reservation.</p>
              </header>

              <div style={s.fieldGrid}>
                <LuxeField
                  id="name"
                  label="FULL NAME"
                  focused={focusedField === "name"}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                >
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    style={s.input}
                    placeholder="Your name"
                  />
                </LuxeField>

                <LuxeField
                  id="email"
                  label="EMAIL"
                  focused={false}
                  disabled
                  hint={`Managed by ${provider === "google.com" ? "Google" : provider === "phone" ? "phone login" : "email login"}`}
                >
                  <input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    disabled
                    style={{ ...s.input, ...s.inputDisabled }}
                  />
                </LuxeField>

                <LuxeField
                  id="phone"
                  label="PHONE"
                  focused={focusedField === "phone"}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                >
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...s.input, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}
                    placeholder="+91 98335 34627"
                  />
                </LuxeField>

                <LuxeField
                  id="tier"
                  label="MEMBERSHIP"
                  focused={false}
                  disabled
                  hint="Tier is managed by your account admin"
                >
                  <div style={{ ...s.input, ...s.inputDisabled, display: "flex", alignItems: "center" }}>
                    <span style={s.tierWordmark}>{tierLabel}</span>
                  </div>
                </LuxeField>
              </div>

              <footer style={s.cardActions}>
                <SavedMark visible={saved} />
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  style={{
                    ...s.primaryBtn,
                    opacity: saving ? 0.45 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? <span style={s.btnSpinner} aria-label="Saving" /> : "SAVE CHANGES"}
                </button>
              </footer>
            </section>
          )}

          {/* ── Preferences tab ── */}
          {activeTab === "preferences" && (
            <section style={s.card} aria-labelledby="prefs-heading">
              <header style={s.cardHead}>
                <h2 id="prefs-heading" style={s.cardTitle}>Travel preferences</h2>
                <p style={s.cardDesc}>Tune the way Voyagr searches and signals across your trips.</p>
              </header>

              <div style={s.fieldGrid}>
                <LuxeField
                  id="currency"
                  label="PREFERRED CURRENCY"
                  focused={false}
                  disabled
                  hint="INR is the default currency for all members"
                >
                  <select
                    id="currency"
                    value="INR"
                    disabled
                    style={{ ...s.input, ...s.inputDisabled }}
                  >
                    {["INR", "USD", "EUR", "GBP", "SGD", "AED", "THB", "JPY", "AUD"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </LuxeField>

                <LuxeField
                  id="traveler"
                  label="TRAVELER TYPE"
                  focused={focusedField === "traveler"}
                  onFocus={() => setFocusedField("traveler")}
                  onBlur={() => setFocusedField(null)}
                >
                  <select
                    id="traveler"
                    value={travelerType}
                    onChange={(e) => setTravelerType(e.target.value)}
                    onFocus={() => setFocusedField("traveler")}
                    onBlur={() => setFocusedField(null)}
                    style={s.input}
                  >
                    <option value="solo">Solo traveler</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="group">Group</option>
                  </select>
                </LuxeField>
              </div>

              {/* Toggle rows — brand champagne pill toggle from RateResultsStrip. */}
              <div style={s.toggleStack}>
                <ToggleRow
                  label="Booking notifications"
                  desc="Reservation updates and rate-drop alerts."
                  active={notifications}
                  onToggle={() => setNotifications((v) => !v)}
                />
                <ToggleRow
                  label="Newsletter"
                  desc="Curated travel picks and destination guides."
                  active={newsletter}
                  onToggle={() => setNewsletter((v) => !v)}
                />
              </div>

              <footer style={s.cardActions}>
                <SavedMark visible={prefSaved} />
                <button
                  onClick={savePreferences}
                  disabled={prefSaving}
                  style={{
                    ...s.primaryBtn,
                    opacity: prefSaving ? 0.45 : 1,
                    cursor: prefSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {prefSaving ? <span style={s.btnSpinner} aria-label="Saving" /> : "SAVE PREFERENCES"}
                </button>
              </footer>
            </section>
          )}

          {/* ── Security tab ── */}
          {activeTab === "security" && (
            <section style={s.card} aria-labelledby="sec-heading">
              <header style={s.cardHead}>
                <h2 id="sec-heading" style={s.cardTitle}>Security &amp; sign-in</h2>
                <p style={s.cardDesc}>How you reach your account, and how to step back out.</p>
              </header>

              <div style={s.secList}>
                <div style={s.secRow}>
                  <div style={s.secCol}>
                    <span style={s.secEyebrow}>LOGIN METHOD</span>
                    <span style={s.secValue}>
                      {provider === "google.com"
                        ? `Google · ${user.email}`
                        : provider === "phone"
                        ? `Phone · ${user.phoneNumber}`
                        : `Email · ${user.email}`}
                    </span>
                  </div>
                  <span style={s.secStatus}>ACTIVE</span>
                </div>

                <div style={s.secRow}>
                  <div style={s.secCol}>
                    <span style={s.secEyebrow}>LAST SIGN-IN</span>
                    <span style={s.secValue}>
                      {user.metadata.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {provider === "password" && (
                  <div style={{ ...s.secRow, flexDirection: "column" as const, alignItems: "stretch", borderBottom: "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={s.secCol}>
                        <span style={s.secEyebrow}>PASSWORD</span>
                        <span style={s.secValue}>
                          {resetSent ? "Reset link sent to your email" : "Change your account password"}
                        </span>
                      </div>
                      {!showPwForm && (
                        <button onClick={() => setShowPwForm(true)} style={s.outlineBtn}>
                          CHANGE PASSWORD
                        </button>
                      )}
                    </div>
                    {showPwForm && (
                      <div style={{ marginTop: 18, display: "flex", flexDirection: "column" as const, gap: 14 }}>
                        <LuxeField
                          id="newPw"
                          label="NEW PASSWORD"
                          focused={focusedField === "newPw"}
                          onFocus={() => setFocusedField("newPw")}
                          onBlur={() => setFocusedField(null)}
                          hint="Minimum 8 characters"
                        >
                          <input
                            id="newPw"
                            type="password"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            onFocus={() => setFocusedField("newPw")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            style={s.input}
                            autoComplete="new-password"
                          />
                        </LuxeField>
                        <LuxeField
                          id="confirmPw"
                          label="CONFIRM PASSWORD"
                          focused={focusedField === "confirmPw"}
                          onFocus={() => setFocusedField("confirmPw")}
                          onBlur={() => setFocusedField(null)}
                        >
                          <input
                            id="confirmPw"
                            type="password"
                            value={confirmPw}
                            onChange={(e) => setConfirmPw(e.target.value)}
                            onFocus={() => setFocusedField("confirmPw")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            style={s.input}
                            autoComplete="new-password"
                          />
                        </LuxeField>
                        {pwError && (
                          <div style={s.errorPill} role="alert">{pwError}</div>
                        )}
                        {pwMsg && (
                          <div style={s.successPill}>{pwMsg}</div>
                        )}
                        <div style={s.pwActions}>
                          <button
                            disabled={pwSaving}
                            onClick={async () => {
                              setPwError("");
                              setPwMsg("");
                              if (newPw.length < 8) { setPwError("Min 8 characters"); return; }
                              if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
                              setPwSaving(true);
                              const { error } = await updatePassword(newPw);
                              if (error) {
                                setPwError(error);
                              } else {
                                setPwMsg("Password updated.");
                                setNewPw("");
                                setConfirmPw("");
                                setTimeout(() => { setShowPwForm(false); setPwMsg(""); }, 2000);
                              }
                              setPwSaving(false);
                            }}
                            style={{
                              ...s.primaryBtn,
                              opacity: pwSaving ? 0.45 : 1,
                              cursor: pwSaving ? "not-allowed" : "pointer",
                            }}
                          >
                            {pwSaving ? <span style={s.btnSpinner} aria-label="Updating" /> : "UPDATE PASSWORD"}
                          </button>
                          <button
                            onClick={() => { setShowPwForm(false); setNewPw(""); setConfirmPw(""); setPwError(""); setPwMsg(""); }}
                            style={s.outlineBtn}
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={async () => {
                              if (!user?.email) return;
                              const { error } = await resetPassword(user.email);
                              if (!error) setResetSent(true);
                            }}
                            style={{ ...s.linkBtn, marginLeft: "auto" }}
                          >
                            EMAIL RESET LINK INSTEAD
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quiet sign-out — not a "danger zone", just leaving the door open. */}
              <footer style={s.signOutFooter}>
                <span style={s.signOutNote}>Leaving for now? Your reservations stay safe.</span>
                <button onClick={handleSignOut} style={s.signOutPill}>
                  SIGN OUT
                </button>
              </footer>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Field component — label above, hairline border that goes champagne on
   focus, sharp 2px corners. Matches the /login phoneRow vocabulary.
   ──────────────────────────────────────────────────────────────────────── */

function LuxeField({
  id,
  label,
  children,
  hint,
  focused,
  disabled,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
  focused: boolean;
  disabled?: boolean;
  /* onFocus/onBlur are intentionally not consumed here — focus state is
     owned by the parent via the child <input>'s own handlers. These props
     are accepted at the call site for consistency but are no-ops. */
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <div style={s.field}>
      <label htmlFor={id} style={s.fieldLabel}>{label}</label>
      <div
        style={{
          ...s.fieldFrame,
          borderColor: focused
            ? "var(--luxe-champagne)"
            : "var(--luxe-hairline-strong)",
          boxShadow: focused ? "inset 0 0 0 1px var(--luxe-champagne-line)" : "none",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {children}
      </div>
      {hint && <span style={s.fieldHint}>{hint}</span>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Brand pill toggle — modeled exactly on the FreeCancelToggle in
   HotelPageClient: 24x14 champagne pill, 10px sliding knob.
   ──────────────────────────────────────────────────────────────────────── */

function ToggleRow({
  label,
  desc,
  active,
  onToggle,
}: {
  label: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={s.toggleRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={s.toggleLabel}>{label}</span>
        <span style={s.toggleDesc}>{desc}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={active}
        aria-label={label}
        style={s.togglePill}
      >
        <span
          aria-hidden
          style={{
            position: "relative",
            width: 24,
            height: 14,
            borderRadius: 999,
            background: active ? "var(--luxe-champagne)" : "rgba(255,255,255,0.12)",
            transition: "background 200ms ease",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: active ? 12 : 2,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: active ? "var(--luxe-black)" : "rgba(255,255,255,0.65)",
              transition: "left 200ms ease, background 200ms ease",
            }}
          />
        </span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Saved mark — subtle 2s mono-caps "SAVED" with a 1px champagne checkmark.
   No green flash, no celebratory toast. Calm.
   ──────────────────────────────────────────────────────────────────────── */

function SavedMark({ visible }: { visible: boolean }) {
  return (
    <span
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginRight: "auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 220ms ease",
        fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "var(--luxe-champagne)",
        pointerEvents: "none",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2 6.5L4.8 9.2L10 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
      </svg>
      SAVED
    </span>
  );
}

/* ── Styles ── */

const s: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    paddingTop: 96,
    paddingBottom: 96,
    background: "var(--luxe-black)",
    position: "relative",
    overflow: "hidden",
  },
  horizon: {
    position: "absolute",
    top: 220,
    left: 0,
    right: 0,
    height: 1,
    background: "var(--luxe-champagne-line)",
    opacity: 0.35,
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 760,
    margin: "0 auto",
    padding: "0 20px",
  },

  /* ── Loading ── */
  loadingPulse: {
    margin: "120px auto 0",
    width: 220,
    height: 1,
    background: "var(--luxe-hairline-strong)",
    overflow: "hidden",
    position: "relative",
  },
  loadingPulseBar: {
    position: "absolute",
    inset: 0,
    background: "var(--luxe-champagne)",
    transformOrigin: "left center",
    animation: "voyagr-spin 0s linear infinite, luxeProgress 1.6s ease-in-out infinite",
  },

  /* ── Hero (editorial identity row) ── */
  hero: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 4,
    padding: "16px 0 36px",
    marginBottom: 8,
  },
  heroEyebrow: {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 10,
    fontWeight: 500,
    color: "var(--luxe-champagne)",
    letterSpacing: "0.36em",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroName: {
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: "clamp(32px, 5.4vw, 48px)",
    lineHeight: 1.05,
    letterSpacing: "0.005em",
    color: "var(--luxe-soft-white)",
    margin: 0,
  },
  heroEmail: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    color: "var(--luxe-soft-white-50)",
    margin: "10px 0 0",
    letterSpacing: "0.02em",
  },
  heroTier: {
    margin: "10px 0 0",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap" as const,
  },
  heroTierMark: {
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: 15,
    fontWeight: 400,
    color: "var(--luxe-champagne)",
    letterSpacing: "0.02em",
  },
  heroTierSep: {
    color: "var(--luxe-soft-white-30)",
    fontSize: 12,
  },
  heroTierProvider: {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 10,
    color: "var(--luxe-soft-white-50)",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
  },

  /* ── Tabs (hairline-divider strip) ── */
  tabsWrap: {
    position: "relative",
    marginBottom: 28,
  },
  tabsHairline: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    background: "var(--luxe-hairline-strong)",
  },
  tabs: {
    display: "flex",
    gap: 0,
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
    WebkitOverflowScrolling: "touch" as const,
  },
  tabBtn: {
    position: "relative",
    padding: "18px 0",
    marginRight: 32,
    background: "none",
    border: "none",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "color 200ms ease",
    whiteSpace: "nowrap" as const,
    minHeight: 44,
  },
  tabUnderline: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 1,
    transition: "background 200ms ease",
  },

  /* ── Card surface ── */
  card: {
    position: "relative",
    background: "var(--luxe-black-2)",
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 14,
    padding: "36px 36px 32px",
    marginBottom: 20,
    // Foil-line — 1px champagne hairline inset along the top edge.
    boxShadow: [
      "inset 0 1px 0 var(--luxe-champagne-line)",
      "0 24px 60px -28px rgba(0,0,0,0.6)",
    ].join(", "),
  },
  cardHead: {
    marginBottom: 28,
  },
  cardTitle: {
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: 24,
    fontWeight: 400,
    color: "var(--luxe-soft-white)",
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: "0.005em",
  },
  cardDesc: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    color: "var(--luxe-soft-white-50)",
    margin: "8px 0 0",
    letterSpacing: "0.01em",
    lineHeight: 1.5,
  },

  /* ── Fields ── */
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px 28px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    minWidth: 0,
  },
  fieldLabel: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: "var(--luxe-soft-white-70)",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  fieldFrame: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 2,
    overflow: "hidden",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
  },
  input: {
    width: "100%",
    height: 56,
    padding: "0 16px",
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: "var(--luxe-soft-white)",
    outline: "none",
    letterSpacing: "0.01em",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  },
  inputDisabled: {
    color: "var(--luxe-soft-white-70)",
    cursor: "not-allowed" as const,
  },
  fieldHint: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 11,
    color: "var(--luxe-soft-white-50)",
    letterSpacing: "0.01em",
  },
  tierWordmark: {
    fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: 16,
    fontWeight: 400,
    color: "var(--luxe-champagne)",
    letterSpacing: "0.01em",
  },

  /* ── Card actions ── */
  cardActions: {
    marginTop: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  primaryBtn: {
    position: "relative",
    minHeight: 48,
    minWidth: 180,
    padding: "0 28px",
    border: "none",
    borderRadius: 2,
    background: "var(--luxe-champagne)",
    color: "var(--luxe-black)",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    transition: "background 220ms ease, transform 80ms ease-out, filter 80ms ease-out",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnSpinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(12,11,10,0.25)",
    borderTopColor: "var(--luxe-black)",
    animation: "voyagr-spin 0.9s linear infinite",
    display: "inline-block",
  },
  outlineBtn: {
    minHeight: 44,
    padding: "0 20px",
    border: "1px solid var(--luxe-hairline-strong)",
    borderRadius: 2,
    background: "var(--luxe-black-3)",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--luxe-soft-white)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "border-color 200ms ease, background 200ms ease",
  },
  linkBtn: {
    background: "none",
    border: "none",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 10,
    color: "var(--luxe-soft-white-50)",
    cursor: "pointer",
    fontWeight: 500,
    padding: "10px 0",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    transition: "color 180ms ease-out",
  },

  /* ── Toggle ── */
  toggleStack: {
    marginTop: 28,
    display: "flex",
    flexDirection: "column" as const,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 0",
    borderTop: "1px solid var(--luxe-hairline)",
    minHeight: 64,
  },
  toggleLabel: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--luxe-soft-white)",
    display: "block",
    letterSpacing: "0.01em",
  },
  toggleDesc: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 12,
    color: "var(--luxe-soft-white-50)",
    display: "block",
    marginTop: 4,
    lineHeight: 1.45,
  },
  togglePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },

  /* ── Security list ── */
  secList: {
    display: "flex",
    flexDirection: "column" as const,
  },
  secRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: "20px 0",
    borderBottom: "1px solid var(--luxe-hairline)",
    minHeight: 64,
  },
  secCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 0,
  },
  secEyebrow: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: "var(--luxe-soft-white-70)",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  secValue: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 14,
    color: "var(--luxe-soft-white)",
    letterSpacing: "0.01em",
    wordBreak: "break-word" as const,
  },
  secStatus: {
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 9,
    fontWeight: 500,
    color: "var(--luxe-champagne)",
    background: "rgba(200,170,118,0.08)",
    border: "1px solid var(--luxe-champagne-line)",
    padding: "5px 10px",
    borderRadius: 2,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    whiteSpace: "nowrap" as const,
  },

  /* ── Password panel ── */
  errorPill: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    color: "var(--luxe-error)",
    background: "var(--luxe-error-soft)",
    borderLeft: "2px solid var(--luxe-error)",
    padding: "10px 14px",
    borderRadius: 2,
    lineHeight: 1.4,
  },
  successPill: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 13,
    color: "var(--luxe-champagne)",
    background: "rgba(200,170,118,0.08)",
    borderLeft: "2px solid var(--luxe-champagne)",
    padding: "10px 14px",
    borderRadius: 2,
    lineHeight: 1.4,
  },
  pwActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    marginTop: 6,
  },

  /* ── Sign-out footer (replaces Danger Zone) ── */
  signOutFooter: {
    marginTop: 36,
    paddingTop: 24,
    borderTop: "1px solid var(--luxe-hairline)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  signOutNote: {
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 12,
    color: "var(--luxe-soft-white-50)",
    letterSpacing: "0.01em",
    fontStyle: "italic" as const,
  },
  signOutPill: {
    minHeight: 44,
    padding: "0 24px",
    border: "1px solid var(--luxe-champagne)",
    borderRadius: 2,
    background: "transparent",
    color: "var(--luxe-champagne)",
    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background 200ms ease, color 200ms ease",
  },
};
