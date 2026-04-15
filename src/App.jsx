import { useState, useRef } from "react";

const SYSTEM_PROMPT = `Kamu adalah penerjemah profesional Bahasa Inggris ke Bahasa Indonesia sekaligus percakapan AI yang cerdas.

Untuk setiap teks bahasa Inggris yang diberikan, berikan output HANYA dalam format JSON berikut (tanpa backtick, tanpa penjelasan tambahan):

{
  "formal": "<terjemahan formal dalam Bahasa Indonesia baku>",
  "informal": "<terjemahan santai/gaul dalam Bahasa Indonesia sehari-hari>",
  "responses": {
    "positive": {
      "en": "<respon positif/setuju dalam Bahasa Inggris, seolah menanggapi kalimat tersebut dalam percakapan>",
      "id": "<terjemahan respon positif tersebut ke Bahasa Indonesia yang natural>"
    },
    "negative": {
      "en": "<respon negatif/tidak setuju dalam Bahasa Inggris, seolah menanggapi kalimat tersebut dalam percakapan>",
      "id": "<terjemahan respon negatif tersebut ke Bahasa Indonesia yang natural>"
    },
    "question": {
      "en": "<pertanyaan lanjutan dalam Bahasa Inggris yang relevan dengan kalimat tersebut>",
      "id": "<terjemahan pertanyaan tersebut ke Bahasa Indonesia yang natural>"
    }
  },
  "context": "<jenis kalimat: statement / question / command / exclamation>"
}

Aturan:
- Formal: gunakan kata baku, EYD, sopan, profesional
- Informal: gunakan bahasa gaul Indonesia, lebih santai, boleh singkat
- Responses harus terasa natural seperti percakapan nyata
- Terjemahan respon (id) harus natural dan mengalir, bukan terjemahan kaku
- Selalu kembalikan valid JSON`;

export default function TranslatorApp() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("formal");
  const [activeResponse, setActiveResponse] = useState("positive");
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const textareaRef = useRef(null);
  const resultRef = useRef(null);

  const contextColors = {
    statement: "#4ade80",
    question: "#60a5fa",
    command: "#f472b6",
    exclamation: "#fb923c",
  };

  const contextLabels = {
    statement: "Pernyataan",
    question: "Pertanyaan",
    command: "Perintah",
    exclamation: "Seruan",
  };

  async function translate() {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://terjemah-proxy.daksara-dev.workers.dev", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: inputText.trim() },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(`Error: ${data.error.message}`);
        return;
      }

      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setResult(parsed);
      setActiveTab("formal");
      setActiveResponse("positive");

      setHistory((prev) => [
        { input: inputText.trim(), result: parsed, id: Date.now() },
        ...prev.slice(0, 4),
      ]);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError("Terjadi kesalahan. Periksa API key dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  function handleKey(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) translate();
  }

  const responseConfig = {
    positive: { label: "✦ Positif", color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
    negative: { label: "✦ Negatif", color: "#f87171", bg: "rgba(248,113,113,0.08)" },
    question: { label: "✦ Pertanyaan", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
  };

  return (
    <div style={styles.root}>
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />
      <div style={styles.ambientOrb3} />

      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <span style={styles.logoSymbol}>語</span>
            </div>
            <div>
              <h1 style={styles.title}>Terjemah.AI</h1>
              <p style={styles.subtitle}>English → Bahasa Indonesia · Powered by Groq</p>
            </div>
          </div>
          <button
            style={{ ...styles.badge, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setShowApiInput(!showApiInput)}
          >
            ⚙️ {apiKeySaved ? <span style={{ color: "#4ade80" }}>API Key ✓</span> : "API Key"}
          </button>
        </header>

        {/* API Key Panel */}
        {showApiInput && (
          <div style={styles.apiPanel}>
            <div style={styles.apiPanelLabel}>🔑 Groq API Key</div>
            <p style={styles.apiPanelHint}>
              Dapatkan gratis di{" "}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={styles.link}>
                console.groq.com
              </a>{" "}
              → API Keys
            </p>
            <div style={styles.apiInputRow}>
              <input
                type={showApiKey ? "text" : "password"}
                style={styles.apiInput}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button style={styles.apiToggleBtn} onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? "🙈" : "👁️"}
              </button>
            </div>
            <button
              style={styles.apiSaveBtn}
              onClick={() => {
                if (apiKey.trim()) {
                  setApiKeySaved(true);
                  setShowApiInput(false);
                  setError("");
                }
              }}
            >
              Simpan & Tutup
            </button>
          </div>
        )}

        {/* Input */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>
            <span style={styles.flagEn}>🇬🇧</span> Masukkan teks bahasa Inggris
            <span style={styles.shortcut}>Ctrl+Enter untuk terjemah</span>
          </div>
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            placeholder="Type your English text here... e.g. 'I really love spending time with you.'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKey}
            rows={4}
          />
          <div style={styles.inputFooter}>
            <span style={styles.charCount}>{inputText.length} karakter</span>
            <button
              style={{ ...styles.btn, ...(loading ? styles.btnLoading : {}) }}
              onClick={translate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <span style={styles.spinner}>⟳</span>
              ) : (
                <>Terjemahkan <span style={styles.btnArrow}>→</span></>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Loading skeleton */}
        {loading && (
          <div style={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ ...styles.skeleton, width: `${90 - i * 10}%` }} />
            ))}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div ref={resultRef} style={styles.resultWrap}>

            {/* Context badge */}
            <div style={styles.contextRow}>
              <span style={styles.contextLabel}>🇮🇩 Hasil Terjemahan</span>
              {result.context && (
                <span style={{
                  ...styles.contextBadge,
                  background: (contextColors[result.context] || "#aaa") + "22",
                  color: contextColors[result.context] || "#aaa",
                  borderColor: (contextColors[result.context] || "#aaa") + "44",
                }}>
                  {contextLabels[result.context] || result.context}
                </span>
              )}
            </div>

            {/* Translation tabs */}
            <div style={styles.card}>
              <div style={styles.tabRow}>
                {["formal", "informal"].map((tab) => (
                  <button
                    key={tab}
                    style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "formal" ? "📋 Formal" : "💬 Informal"}
                  </button>
                ))}
              </div>
              <div style={styles.translationBox}>
                <div style={styles.translationMeta}>
                  {activeTab === "formal"
                    ? "Bahasa Indonesia Baku · Profesional"
                    : "Bahasa Indonesia Santai · Sehari-hari"}
                </div>
                <p style={styles.translationText}>
                  {activeTab === "formal" ? result.formal : result.informal}
                </p>
                <button
                  style={styles.copyBtn}
                  onClick={() => copyText(
                    activeTab === "formal" ? result.formal : result.informal,
                    "translation"
                  )}
                >
                  {copied === "translation" ? "✓ Tersalin" : "⎘ Salin"}
                </button>
              </div>
            </div>

            {/* Response section */}
            <div style={styles.card}>
              <div style={styles.cardLabel}>
                <span>🗣️</span> Respon Percakapan
              </div>
              <div style={styles.responseTabs}>
                {Object.entries(responseConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    style={{
                      ...styles.responseTab,
                      ...(activeResponse === key ? {
                        background: cfg.bg,
                        borderColor: cfg.color + "66",
                        color: cfg.color,
                      } : {}),
                    }}
                    onClick={() => setActiveResponse(key)}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>

              <div style={{
                ...styles.responseBox,
                background: responseConfig[activeResponse].bg,
                borderColor: responseConfig[activeResponse].color + "33",
              }}>
                <div style={{
                  ...styles.responseIndicator,
                  background: responseConfig[activeResponse].color,
                }} />

                {/* English */}
                <div style={styles.responseLangTag}>
                  <span style={{ color: responseConfig[activeResponse].color, opacity: 0.8 }}>🇬🇧</span>
                  <span style={styles.responseLangLabel}>English</span>
                </div>
                <p style={styles.responseText}>
                  "{result.responses?.[activeResponse]?.en || result.responses?.[activeResponse]}"
                </p>

                {/* Indonesian supporter */}
                <p style={{
                  ...styles.responseTextID,
                  borderLeft: `2px solid ${responseConfig[activeResponse].color}33`,
                }}>
                  🇮🇩 {result.responses?.[activeResponse]?.id}
                </p>

                <button
                  style={styles.copyBtn}
                  onClick={() => copyText(
                    result.responses?.[activeResponse]?.en || result.responses?.[activeResponse],
                    "response"
                  )}
                >
                  {copied === "response" ? "✓ Tersalin" : "⎘ Salin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={styles.historySection}>
            <div style={styles.historyLabel}>🕐 Riwayat Terjemahan</div>
            <div style={styles.historyList}>
              {history.map((item) => (
                <button
                  key={item.id}
                  style={styles.historyItem}
                  onClick={() => {
                    setInputText(item.input);
                    setResult(item.result);
                    setActiveTab("formal");
                    setActiveResponse("positive");
                  }}
                >
                  <span style={styles.historyText}>
                    "{item.input.slice(0, 50)}{item.input.length > 50 ? "…" : ""}"
                  </span>
                  <span style={styles.historyArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          Terjemah.AI · Didukung Groq (Llama 3.3) · Formal & Informal + Respon Percakapan
        </footer>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#09090f",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflow: "hidden",
    padding: "0 0 40px",
  },
  ambientOrb1: {
    position: "fixed", top: "-120px", left: "-100px",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  ambientOrb2: {
    position: "fixed", bottom: "-80px", right: "-80px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  ambientOrb3: {
    position: "fixed", top: "40%", left: "60%",
    width: "300px", height: "300px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  container: {
    maxWidth: "720px", margin: "0 auto",
    padding: "0 16px", position: "relative", zIndex: 1,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "36px 0 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "28px", flexWrap: "wrap", gap: "12px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "14px" },
  logoIcon: {
    width: "52px", height: "52px", borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 24px rgba(99,102,241,0.35)",
  },
  logoSymbol: { fontSize: "26px", color: "#fff", lineHeight: 1 },
  title: {
    margin: 0, fontSize: "26px", fontWeight: "700",
    color: "#f1f5f9", letterSpacing: "-0.5px", fontFamily: "'Georgia', serif",
  },
  subtitle: {
    margin: "2px 0 0", fontSize: "12px", color: "#64748b",
    letterSpacing: "0.5px", fontFamily: "'Georgia', serif",
  },
  badge: {
    padding: "6px 14px", borderRadius: "20px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.25)",
    color: "#818cf8", fontSize: "11px",
    letterSpacing: "0.5px", fontFamily: "'Georgia', serif",
  },
  apiPanel: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "14px", padding: "18px 20px", marginBottom: "20px",
  },
  apiPanelLabel: {
    fontSize: "13px", color: "#94a3b8",
    fontFamily: "'Georgia', serif", marginBottom: "6px", fontWeight: "600",
  },
  apiPanelHint: {
    fontSize: "11px", color: "#475569",
    fontFamily: "'Georgia', serif", margin: "0 0 12px",
  },
  link: { color: "#818cf8", textDecoration: "none" },
  apiInputRow: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" },
  apiInput: {
    flex: 1, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "13px",
    padding: "9px 12px", outline: "none", fontFamily: "monospace",
  },
  apiToggleBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "9px 12px", cursor: "pointer", fontSize: "14px",
  },
  apiSaveBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "9px 20px", fontSize: "13px",
    fontFamily: "'Georgia', serif", cursor: "pointer", fontWeight: "600",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", padding: "20px", marginBottom: "16px",
    backdropFilter: "blur(8px)",
  },
  cardLabel: {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "12px", color: "#64748b", marginBottom: "12px",
    letterSpacing: "0.3px", fontFamily: "'Georgia', serif",
  },
  flagEn: { fontSize: "16px" },
  shortcut: {
    marginLeft: "auto", fontSize: "10px", color: "#334155",
    background: "rgba(255,255,255,0.04)", padding: "2px 8px",
    borderRadius: "4px", border: "1px solid rgba(255,255,255,0.07)",
  },
  textarea: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    color: "#e2e8f0", fontSize: "15px", lineHeight: "1.7",
    padding: "14px 16px", resize: "vertical", outline: "none",
    boxSizing: "border-box", fontFamily: "'Georgia', serif", transition: "border-color 0.2s",
  },
  inputFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px",
  },
  charCount: { fontSize: "11px", color: "#475569", fontFamily: "'Georgia', serif" },
  btn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
    border: "none", borderRadius: "10px", padding: "10px 24px",
    fontSize: "14px", fontWeight: "600", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "6px",
    fontFamily: "'Georgia', serif", letterSpacing: "0.2px",
    boxShadow: "0 4px 16px rgba(99,102,241,0.3)", transition: "opacity 0.2s",
  },
  btnLoading: { opacity: 0.6, cursor: "not-allowed" },
  btnArrow: { fontSize: "16px" },
  spinner: { display: "inline-block", fontSize: "16px" },
  errorBox: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "10px", padding: "12px 16px", color: "#fca5a5",
    fontSize: "13px", marginBottom: "16px", fontFamily: "'Georgia', serif",
  },
  skeletonWrap: {
    display: "flex", flexDirection: "column", gap: "10px",
    padding: "20px", marginBottom: "16px",
  },
  skeleton: {
    height: "14px", borderRadius: "6px",
    background: "rgba(255,255,255,0.06)",
  },
  resultWrap: {},
  contextRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px",
  },
  contextLabel: { fontSize: "12px", color: "#64748b", fontFamily: "'Georgia', serif" },
  contextBadge: {
    fontSize: "11px", padding: "3px 10px", borderRadius: "12px",
    border: "1px solid", fontFamily: "'Georgia', serif", fontWeight: "600",
  },
  tabRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  tab: {
    flex: 1, background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
    color: "#64748b", fontSize: "13px", padding: "9px 0",
    cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all 0.2s",
  },
  tabActive: {
    background: "rgba(99,102,241,0.12)",
    borderColor: "rgba(99,102,241,0.35)", color: "#818cf8",
  },
  translationBox: {
    background: "rgba(255,255,255,0.02)", borderRadius: "10px",
    padding: "16px", position: "relative",
  },
  translationMeta: {
    fontSize: "10px", color: "#475569", letterSpacing: "0.8px",
    textTransform: "uppercase", marginBottom: "8px", fontFamily: "'Georgia', serif",
  },
  translationText: {
    margin: "0 0 12px", fontSize: "17px", color: "#f1f5f9",
    lineHeight: "1.7", fontFamily: "'Georgia', serif",
  },
  copyBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px", color: "#94a3b8", fontSize: "11px",
    padding: "4px 10px", cursor: "pointer", fontFamily: "'Georgia', serif",
  },
  responseTabs: { display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" },
  responseTab: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px", color: "#475569", fontSize: "12px",
    padding: "7px 14px", cursor: "pointer", fontFamily: "'Georgia', serif",
  },
  responseBox: {
    borderRadius: "10px", border: "1px solid",
    padding: "16px", position: "relative",
  },
  responseIndicator: {
    width: "3px", height: "100%", position: "absolute",
    left: 0, top: 0, borderRadius: "10px 0 0 10px", opacity: 0.6,
  },
  responseLangTag: {
    display: "flex", alignItems: "center", gap: "5px",
    marginBottom: "5px", paddingLeft: "8px",
  },
  responseLangLabel: {
    fontSize: "10px", color: "#475569", letterSpacing: "0.7px",
    textTransform: "uppercase", fontFamily: "'Georgia', serif",
  },
  responseText: {
    margin: "0 0 8px", fontSize: "15px", color: "#cbd5e1",
    lineHeight: "1.7", fontFamily: "'Georgia', serif",
    fontStyle: "italic", paddingLeft: "8px",
  },
  responseTextID: {
    margin: "4px 0 12px", fontSize: "11px", color: "#475569",
    lineHeight: "1.5", fontFamily: "'Georgia', serif",
    fontStyle: "normal", paddingLeft: "8px",
  },
  historySection: { marginTop: "8px" },
  historyLabel: {
    fontSize: "11px", color: "#475569", letterSpacing: "0.5px",
    textTransform: "uppercase", marginBottom: "10px", fontFamily: "'Georgia', serif",
  },
  historyList: { display: "flex", flexDirection: "column", gap: "6px" },
  historyItem: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px", padding: "10px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    cursor: "pointer", textAlign: "left",
  },
  historyText: { fontSize: "12px", color: "#64748b", fontFamily: "'Georgia', serif" },
  historyArrow: { color: "#334155", fontSize: "12px" },
  footer: {
    textAlign: "center", fontSize: "11px", color: "#334155",
    marginTop: "32px", fontFamily: "'Georgia', serif", letterSpacing: "0.5px",
  },
};
