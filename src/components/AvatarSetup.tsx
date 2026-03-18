/**
 * AvatarSetup.tsx
 * ───────────────────────────────────────────────────────────────────
 * Avaturn avatar creator — replacement for Ready Player Me.
 *
 * Why Avaturn:
 *   ✓ Free tier, no export limits
 *   ✓ Photorealistic avatars from a selfie or manual customisation
 *   ✓ Native Three.js integration (official example in their docs)
 *   ✓ npm package @avaturn/sdk — clean React integration
 *   ✓ Exports a .glb URL we save to Airtable and load in the race
 *
 * SETUP (one-time, 5 minutes):
 *   1. Sign up free at https://developer.avaturn.me
 *   2. Create a project → copy your subdomain (e.g. "freewheeler")
 *   3. Set VITE_AVATURN_SUBDOMAIN=freewheeler in your .env
 *
 * INSTALL:
 *   npm install @avaturn/sdk
 */

import { useEffect, useRef, useState } from "react";
import { AvaturnSDK } from "@avaturn/sdk";
import { callAirtable } from "@/lib/airtable";

interface Props {
  studentRecordId: string | null;
  existingUrl?: string | null;
  onDone: (avatarUrl: string) => void;
  onSkip: () => void;
}

// Your Avaturn subdomain from developer.avaturn.me
// Falls back to "demo" so it works straight away for testing
const AVATURN_SUBDOMAIN =
  import.meta.env.VITE_AVATURN_SUBDOMAIN || "demo";

export default function AvatarSetup({
  studentRecordId,
  existingUrl,
  onDone,
  onSkip,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef       = useRef<AvaturnSDK | null>(null);
  const [status,     setStatus]  = useState<"idle" | "saving" | "done">("idle");
  const [statusMsg,  setStatusMsg] = useState("");

  // Initialise Avaturn SDK once the container div is mounted
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sdk = new AvaturnSDK();
    sdkRef.current = sdk;

    const url = `https://${AVATURN_SUBDOMAIN}.avaturn.dev`;

    sdk
      .init(container, { url })
      .then(() => {
        // Fired when student clicks "Next / Export" inside the Avaturn UI
        sdk.on("export", async (data: { url: string; avatarId?: string }) => {
          const avatarUrl = data.url;
          setStatus("saving");
          setStatusMsg("Saving your avatar…");

          // Persist URL to Airtable Student Registration → "Avatar URL" field
          if (studentRecordId) {
            try {
              await callAirtable("Student Registration", "PATCH", {
                body: {
                  records: [
                    { id: studentRecordId, fields: { "Avatar URL": avatarUrl } },
                  ],
                },
              });
              setStatusMsg("Avatar saved! ✓");
            } catch (err) {
              console.warn("Could not save Avatar URL to Airtable:", err);
              setStatusMsg("Avatar ready (couldn't save — will still work this session)");
            }
          } else {
            setStatusMsg("Avatar ready ✓");
          }

          setStatus("done");
          setTimeout(() => onDone(avatarUrl), 900);
        });
      })
      .catch((err) => {
        console.error("Avaturn SDK init failed:", err);
        setStatusMsg("Could not load avatar creator. Check your subdomain in .env");
      });

    return () => {
      // Avaturn SDK doesn't expose a destroy() — just clear the container
      if (container) container.innerHTML = "";
      sdkRef.current = null;
    };
  }, [studentRecordId, onDone]);

  const M = `"Courier New", monospace`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "rgba(2,8,20,0.97)",
        fontFamily: M,
        zIndex: 10,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "14px 20px",
          textAlign: "center",
          borderBottom: "1px solid #0a1e33",
          background: "rgba(0,187,255,0.05)",
          flexShrink: 0,
        }}
      >
        <div style={{ color: "#00ffcc", fontSize: 10, letterSpacing: 5, marginBottom: 3 }}>
          FREE WHEELER LEAGUE
        </div>
        <div style={{ color: "#fff", fontSize: 17, fontWeight: "bold" }}>
          Create Your Rider Avatar
        </div>
        <div style={{ color: "#334455", fontSize: 12, marginTop: 3 }}>
          Take a selfie or build your face manually — then race as yourself 🚲
        </div>
      </div>

      {/* ── Avaturn SDK container ────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* SDK mounts its iframe into this div */}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Saving overlay */}
        {status === "saving" || status === "done" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2,8,20,0.9)",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 14 }}>
              {status === "done" ? "🚲" : "⏳"}
            </div>
            <div
              style={{
                color: status === "done" ? "#00ffcc" : "#aabbcc",
                fontSize: 15,
                fontFamily: M,
              }}
            >
              {statusMsg}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          gap: 10,
          justifyContent: "center",
          borderTop: "1px solid #0a1e33",
          background: "rgba(0,0,0,0.4)",
          flexShrink: 0,
        }}
      >
        {existingUrl && (
          <button
            onClick={() => onDone(existingUrl)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: "bold",
              background: "rgba(0,187,255,0.12)",
              color: "#00bbff",
              border: "1px solid #00bbff44",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: M,
              letterSpacing: 1,
            }}
          >
            ← Keep Existing Avatar
          </button>
        )}
        <button
          onClick={onSkip}
          style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: "bold",
            background: "transparent",
            color: "#334455",
            border: "1px solid #0a1e33",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: M,
            letterSpacing: 1,
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
