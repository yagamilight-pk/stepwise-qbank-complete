import { ImageResponse } from "next/og";

export const alt = "Stepwise — see why you miss questions and know what to do next";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const steps = ["CLINICAL CUE", "DECISION", "CORRECTION", "NEXT REVIEW"];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f7f9fc",
        color: "#121a2a",
        padding: "68px 78px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 800 }}>
          <span style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#5147d9", color: "white" }}>S</span>
          STEPWISE
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#526078" }}>STEP 1 · STEP 2 CK</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#5147d9", letterSpacing: 2 }}>THE REASONING TRACE</div>
        <div style={{ display: "flex", maxWidth: 940, fontSize: 64, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
          See why you miss questions. Know what to do next.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((step, index) => (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: index === 2 ? "#c84f5a" : index === 3 ? "#eef0ff" : "#15805c", color: index === 3 ? "#5147d9" : "white", fontSize: 14, fontWeight: 800 }}>{index + 1}</span>
              <span style={{ display: "flex", color: "#526078", fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{step}</span>
            </div>
            {index < steps.length - 1 ? <span style={{ display: "flex", height: 2, flex: 1, margin: "0 18px", background: "#d8deea" }} /> : null}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
