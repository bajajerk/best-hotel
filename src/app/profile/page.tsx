"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading, signOut, resetPassword, updatePassword } = useAuth();
  const initialTab = searchParams.get("tab") === "security" ? "security"
    : searchParams.get("tab") === "preferences" ? "preferences" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">(initialTab);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Preferences
  const [currency, setCurrency] = useState("USD");
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

  // Profile data from backend
  const [profile, setProfile] = useState<Record<string, string | number | null> | null>(null);
  const [tier, setTier] = useState("basic");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (session?.access_token) {
      fetchProfile(session.access_token);
      fetchPreferences(session.access_token);
    }
  }, [loading, user, session, router]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  async function fetchProfile(token: string) {
    try {
      const res = await fetch(`${apiBase}/api/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName((data.name as string) || "");
        setPhone((data.phone as string) || "");
        setTier((data.tier as string) || "basic");
      }
    } catch {
      // Use Supabase user data as fallback
      if (user) {
        setName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
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
        setCurrency(data.currency || "USD");
        setTravelerType(data.traveler_type || "couple");
        setNotifications(data.notifications_enabled ?? true);
        setNewsletter(data.newsletter_enabled ?? true);
      }
    } catch {
      // Defaults are fine
    }
  }

  async function saveProfile() {
    if (!session?.access_token) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${apiBase}/api/account/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
    if (!session?.access_token) return;
    setPrefSaving(true);
    setPrefSaved(false);
    try {
      await fetch(`${apiBase}/api/account/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
    return (
      <>
        <Header />
        <main style={s.main}>
          <div style={s.container}>
            <div style={s.spinner} />
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";
  const provider = user.app_metadata?.provider || "email";

  const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
    basic: { label: "Basic", color: "var(--ink-light)", bg: "var(--cream-deep)" },
    silver: { label: "Silver", color: "#6b7280", bg: "#f3f4f6" },
    gold: { label: "Gold", color: "var(--gold)", bg: "var(--gold-pale)" },
    platinum: { label: "Platinum", color: "#1a1710", bg: "#e5e7eb" },
  };
  const t = tierConfig[tier] || tierConfig.basic;

  return (
    <>
      <Header />
      <main style={s.main}>
        <div style={s.container}>
          {/* Hero card */}
          <div style={s.heroCard}>
            <div style={s.heroTop}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={s.avatar}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={s.avatarFallback}>{initials}</div>
              )}
              <div style={{ flex: 1 }}>
                <h1 style={s.heroName}>{displayName}</h1>
                <p style={s.heroEmail}>{user.email}</p>
                <div style={s.heroBadges}>
                  <span style={{ ...s.badge, color: t.color, background: t.bg }}>
                    {t.label} Member
                  </span>
                  <span style={s.badgeLight}>
                    {provider === "google" ? "Google Account" : "Email Account"}
                  </span>
                  {memberSince && (
                    <span style={s.badgeLight}>Since {memberSince}</span>
                  )}
                </div>
              </div>
              <button onClick={handleSignOut} style={s.signOutBtn}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {(["profile", "preferences", "security"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? s.tabActive : s.tab}
              >
                {tab === "profile" ? "Profile" : tab === "preferences" ? "Preferences" : "Security"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "profile" && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Personal Information</h2>
              <p style={s.cardDesc}>Update your name and contact details.</p>

              <div style={s.fieldGrid}>
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={s.input}
                    placeholder="Your name"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    style={{ ...s.input, opacity: 0.6, cursor: "not-allowed" }}
                  />
                  <span style={s.hint}>Managed by {provider === "google" ? "Google" : "Supabase Auth"}</span>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={s.input}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Membership Tier</label>
                  <div style={{ ...s.input, opacity: 0.6, cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...s.tierDot, background: t.color }} />
                    {t.label}
                  </div>
                  <span style={s.hint}>Tier is managed by your account admin</span>
                </div>
              </div>

              <div style={s.cardActions}>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  style={{ ...s.primaryBtn, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Travel Preferences</h2>
              <p style={s.cardDesc}>Customize your search and booking experience.</p>

              <div style={s.fieldGrid}>
                <div style={s.field}>
                  <label style={s.label}>Preferred Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={s.input}
                  >
                    {["USD", "EUR", "GBP", "INR", "SGD", "AED", "THB", "JPY", "AUD"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Traveler Type</label>
                  <select
                    value={travelerType}
                    onChange={(e) => setTravelerType(e.target.value)}
                    style={s.input}
                  >
                    <option value="solo">Solo Traveler</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="group">Group</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column" as const, gap: 16 }}>
                <label style={s.toggleRow}>
                  <div>
                    <span style={s.toggleLabel}>Booking Notifications</span>
                    <span style={s.toggleDesc}>Get notified about booking updates and price drops</span>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    style={{
                      ...s.toggle,
                      background: notifications ? "var(--gold)" : "var(--cream-border)",
                      justifyContent: notifications ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={s.toggleDot} />
                  </button>
                </label>
                <label style={s.toggleRow}>
                  <div>
                    <span style={s.toggleLabel}>Newsletter</span>
                    <span style={s.toggleDesc}>Receive curated travel deals and destination guides</span>
                  </div>
                  <button
                    onClick={() => setNewsletter(!newsletter)}
                    style={{
                      ...s.toggle,
                      background: newsletter ? "var(--gold)" : "var(--cream-border)",
                      justifyContent: newsletter ? "flex-end" : "flex-start",
                    }}
                  >
                    <div style={s.toggleDot} />
                  </button>
                </label>
              </div>

              <div style={s.cardActions}>
                <button
                  onClick={savePreferences}
                  disabled={prefSaving}
                  style={{ ...s.primaryBtn, opacity: prefSaving ? 0.6 : 1 }}
                >
                  {prefSaving ? "Saving..." : prefSaved ? "Saved" : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Security</h2>
              <p style={s.cardDesc}>Manage your login method and account security.</p>

              <div style={s.secRow}>
                <div>
                  <span style={s.secLabel}>Login Method</span>
                  <span style={s.secValue}>
                    {provider === "google" ? "Google OAuth (mayank.bajaj@...)" : `Email (${user.email})`}
                  </span>
                </div>
                <span style={s.secBadge}>Active</span>
              </div>

              <div style={s.secRow}>
                <div>
                  <span style={s.secLabel}>Last Sign In</span>
                  <span style={s.secValue}>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Unknown"}
                  </span>
                </div>
              </div>

              {provider !== "google" && (
                <div style={{ ...s.secRow, borderBottom: "none", flexDirection: "column" as const, alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={s.secLabel}>Password</span>
                      <span style={s.secValue}>
                        {resetSent ? "Reset link sent to your email" : "Change your account password"}
                      </span>
                    </div>
                    {!showPwForm && (
                      <button onClick={() => setShowPwForm(true)} style={s.outlineBtn}>
                        Change Password
                      </button>
                    )}
                  </div>
                  {showPwForm && (
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 12 }}>
                      <input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        style={s.input}
                        autoComplete="new-password"
                      />
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Confirm new password"
                        style={s.input}
                        autoComplete="new-password"
                      />
                      {pwError && <p style={{ margin: 0, fontSize: 13, color: "var(--error)", fontFamily: "var(--font-body)" }}>{pwError}</p>}
                      {pwMsg && <p style={{ margin: 0, fontSize: 13, color: "var(--success)", fontFamily: "var(--font-body)" }}>{pwMsg}</p>}
                      <div style={{ display: "flex", gap: 10 }}>
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
                              setPwMsg("Password updated!");
                              setNewPw("");
                              setConfirmPw("");
                              setTimeout(() => { setShowPwForm(false); setPwMsg(""); }, 2000);
                            }
                            setPwSaving(false);
                          }}
                          style={{ ...s.primaryBtn, opacity: pwSaving ? 0.6 : 1 }}
                        >
                          {pwSaving ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          onClick={() => { setShowPwForm(false); setNewPw(""); setConfirmPw(""); setPwError(""); setPwMsg(""); }}
                          style={s.outlineBtn}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!user?.email) return;
                            const { error } = await resetPassword(user.email);
                            if (!error) setResetSent(true);
                          }}
                          style={{ ...s.outlineBtn, marginLeft: "auto" }}
                        >
                          Email reset link instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 32, padding: "20px", borderRadius: 8, background: "rgba(139,58,58,0.04)", border: "1px solid rgba(139,58,58,0.12)" }}>
                <span style={{ ...s.secLabel, color: "var(--error)" }}>Danger Zone</span>
                <p style={{ ...s.secValue, marginTop: 4 }}>
                  Signing out will clear your session. You can always sign back in.
                </p>
                <button onClick={handleSignOut} style={{ ...s.outlineBtn, color: "var(--error)", borderColor: "var(--error)", marginTop: 12 }}>
                  Sign Out of All Devices
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── Styles ── */

const s: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    paddingTop: 90,
    paddingBottom: 80,
    background: "var(--cream)",
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "0 20px",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid var(--cream-border)",
    borderTopColor: "var(--gold)",
    borderRadius: "50%",
    margin: "80px auto",
    animation: "spin 0.8s linear infinite",
  },

  /* Hero */
  heroCard: {
    background: "var(--white)",
    border: "1px solid var(--cream-border)",
    borderRadius: 12,
    padding: "28px 28px",
    marginBottom: 20,
  },
  heroTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "2px solid var(--gold-pale)",
    objectFit: "cover" as const,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "var(--gold-pale)",
    border: "2px solid var(--gold)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 600,
    color: "var(--gold)",
    flexShrink: 0,
  },
  heroName: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    fontWeight: 500,
    color: "var(--ink)",
    margin: 0,
    lineHeight: 1.2,
  },
  heroEmail: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--ink-light)",
    margin: "4px 0 10px",
  },
  heroBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  badge: {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: "0.03em",
  },
  badgeLight: {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 20,
    color: "var(--ink-light)",
    background: "var(--cream-deep)",
  },
  signOutBtn: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    background: "none",
    border: "1px solid var(--cream-border)",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    marginLeft: "auto",
    whiteSpace: "nowrap" as const,
    transition: "border-color 0.2s",
  },

  /* Tabs */
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--cream-border)",
  },
  tab: {
    flex: 1,
    padding: "11px 0",
    border: "none",
    background: "var(--white)",
    color: "var(--ink-light)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    flex: 1,
    padding: "11px 0",
    border: "none",
    background: "var(--ink)",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },

  /* Card */
  card: {
    background: "var(--white)",
    border: "1px solid var(--cream-border)",
    borderRadius: 12,
    padding: "28px 28px",
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 500,
    color: "var(--ink)",
    margin: 0,
  },
  cardDesc: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    margin: "6px 0 24px",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px 24px",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ink-mid)",
    letterSpacing: "0.03em",
  },
  input: {
    padding: "11px 14px",
    border: "1px solid var(--cream-border)",
    borderRadius: 8,
    background: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--ink)",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  cardActions: {
    marginTop: 24,
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    padding: "11px 28px",
    border: "none",
    borderRadius: 8,
    background: "var(--gold)",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  outlineBtn: {
    padding: "8px 18px",
    border: "1px solid var(--cream-border)",
    borderRadius: 8,
    background: "none",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-mid)",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },

  /* Toggles */
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    cursor: "pointer",
    padding: "12px 0",
    borderBottom: "1px solid var(--cream-deep)",
  },
  toggleLabel: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    display: "block",
  },
  toggleDesc: {
    fontFamily: "var(--font-body)",
    fontSize: 12,
    color: "var(--ink-light)",
    display: "block",
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "2px",
    transition: "background 0.2s, justify-content 0.2s",
    flexShrink: 0,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  },

  /* Security */
  secRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid var(--cream-deep)",
    gap: 16,
  },
  secLabel: {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    display: "block",
  },
  secValue: {
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--ink-light)",
    display: "block",
    marginTop: 2,
  },
  secBadge: {
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--success)",
    background: "var(--success-soft)",
    padding: "4px 10px",
    borderRadius: 20,
  },
};
