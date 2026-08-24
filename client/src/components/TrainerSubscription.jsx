import React, { useState, useEffect } from "react";

const TrainerSubscription = ({ apiBase }) => {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/trainer/subscription`);
      if (res.ok) {
        const data = await res.json();
        setSub(data);
      }
    } catch (err) {
      console.error("Error loading subscription details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType) => {
    setUpgradingPlan(planType);
    try {
      const res = await fetch(`${apiBase}/trainer/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Suscripción actualizada con éxito al plan ${planType.toUpperCase()}`);
        fetchSubscription();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Error al actualizar la suscripción");
      }
    } catch (err) {
      console.error("Error upgrading subscription:", err);
    } finally {
      setUpgradingPlan(null);
    }
  };

  if (loading && !sub) {
    return (
      <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Cargando detalles de tu membresía...
      </div>
    );
  }

  const currentPlan = sub?.planType || "free";
  const limit = sub?.athletesLimit || 3;
  const count = sub?.athletesCount || 0;
  const pct = Math.min(100, Math.round((count / limit) * 100));

  return (
    <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px", padding: "45px 35px" }}>
      <div>
        <h2 className="glow-text" style={{ fontSize: "2rem", marginBottom: "4px" }}>Mi Suscripción Innova</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Administra la membresía de tu cuenta de entrenador y revisa tu límite de atletas activos.
        </p>
      </div>

      {/* Main Stats Row */}
      <div className="grid-3-cols" style={{ gap: "20px" }}>
        {/* Plan Info Card */}
        <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Plan Actual</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase" }}>
            {currentPlan === "free" ? "Gratuito (Semilla)" : currentPlan === "pro" ? "Profesional" : "Elite"}
          </div>
          {sub?.subExpiresAt && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Vence el: <strong>{new Date(sub.subExpiresAt).toLocaleDateString()}</strong>
            </span>
          )}
        </div>

        {/* Usage Card */}
        <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Atletas Registrados</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent)" }}>
            {count} / {limit === 999999 ? "∞" : limit}
          </div>
          {/* Progress bar */}
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: "3px" }}></div>
          </div>
        </div>

        {/* Status Card */}
        <div className="glass-card" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Estado de Membresía</span>
          <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--success)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%" }}></span>
            Cuenta Activa
          </div>
        </div>
      </div>

      {/* Pricing comparison and billing actions */}
      <div style={{ marginTop: "10px" }}>
        <h3 className="glow-text" style={{ fontSize: "1.5rem", marginBottom: "16px" }}>Elige tu Plan</h3>
        <div className="grid-3-cols" style={{ gap: "25px" }}>
          {/* Plan Seed */}
          <div className="glass-card" style={{ border: currentPlan === "free" ? "2px solid var(--primary)" : "1px solid var(--border-color)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "700" }}>Semilla (Free)</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-main)" }}>$0 <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-muted)" }}>/ mes</span></div>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>1 atleta activo</li>
              <li>Somatocarta básica</li>
              <li>Planes de suplementación sencillos</li>
            </ul>
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: "auto", width: "100%" }}
              disabled={currentPlan === "free" || upgradingPlan !== null}
              onClick={() => handleUpgrade("free")}
            >
              {currentPlan === "free" ? "Plan Activo" : "Cambiar a Free"}
            </button>
          </div>

          {/* Plan Pro */}
          <div className="glass-card" style={{ border: currentPlan === "pro" ? "2px solid var(--primary)" : "1px solid var(--border-color)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
            <span style={{ position: "absolute", top: "-12px", right: "20px", background: "var(--primary)", color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>Recomendado</span>
            <h4 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "700" }}>Profesional (Pro)</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-main)" }}>$19.99 <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-muted)" }}>/ mes</span></div>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Hasta 30 atletas activos</li>
              <li>IA de Postura avanzada</li>
              <li>Buscador y catálogo personalizado</li>
              <li>Historiales antropométricos completos</li>
            </ul>
            <button 
              className={currentPlan === "pro" ? "btn btn-secondary" : "btn btn-primary"} 
              style={{ marginTop: "auto", width: "100%" }}
              disabled={currentPlan === "pro" || upgradingPlan !== null}
              onClick={() => handleUpgrade("pro")}
            >
              {upgradingPlan === "pro" ? "Procesando..." : (currentPlan === "pro" ? "Plan Activo" : "Obtener Pro")}
            </button>
          </div>

          {/* Plan Elite */}
          <div className="glass-card" style={{ border: currentPlan === "elite" ? "2px solid var(--primary)" : "1px solid var(--border-color)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "700" }}>Elite (Gimnasio)</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-main)" }}>$49.99 <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--text-muted)" }}>/ mes</span></div>
            <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Atletas ilimitados</li>
              <li>Informes estéticos en PDF</li>
              <li>Base de datos priorizada</li>
              <li>Soporte 24/7</li>
            </ul>
            <button 
              className={currentPlan === "elite" ? "btn btn-secondary" : "btn btn-primary"} 
              style={{ marginTop: "auto", width: "100%" }}
              disabled={currentPlan === "elite" || upgradingPlan !== null}
              onClick={() => handleUpgrade("elite")}
            >
              {upgradingPlan === "elite" ? "Procesando..." : (currentPlan === "elite" ? "Plan Activo" : "Obtener Elite")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerSubscription;
