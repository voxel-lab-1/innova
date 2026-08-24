import React, { useState, useEffect } from "react";

const TrainerDashboard = ({ apiBase, onSelectAthlete, onCreateAthlete, planType }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${apiBase}/trainer/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "var(--text-muted)" }}>
        <div style={{ width: "25px", height: "25px", border: "3px solid rgba(0, 128, 128, 0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: "10px" }}></div>
        Cargando métricas de control...
      </div>
    );
  }

  const stats = data?.stats || { totalAthletes: 0, activeCycles: 0, postureJobs: 0, lowStockAlerts: 0 };
  const alerts = data?.alerts || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* 1. Header Area */}
      <div>
        <h2 className="glow-text" style={{ fontSize: "2.2rem", marginBottom: "6px" }}>Consola de Comando Innova 🚀</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
          Monitorea el rendimiento, la suplementación y la postura de tus atletas desde un panel centralizado.
        </p>
      </div>

      {/* 2. Alerts Board */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map((al, idx) => (
            <div 
              key={idx} 
              className="glass-card animate-slide-up"
              style={{ 
                padding: "16px 20px", 
                background: al.type === "warning" ? "rgba(255, 69, 0, 0.04)" : "rgba(0, 128, 128, 0.04)",
                borderLeft: al.type === "warning" ? "5px solid var(--error)" : "5px solid var(--primary)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "0.95rem"
              }}
            >
              <span>{al.type === "warning" ? "⚠️" : "💡"}</span>
              <span style={{ color: "var(--text-main)", fontWeight: "500" }}>{al.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. KPI Statistics Grid */}
      <div className="grid-4-cols" style={{ gap: "20px" }}>
        {/* KPI 1 */}
        <div className="glass-card card-blue" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Atletas Activos</span>
          <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--text-main)" }}>{stats.totalAthletes}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Plan: {planType.toUpperCase()}</span>
        </div>

        {/* KPI 2 */}
        <div className="glass-card card-green" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Ciclos Suplementación</span>
          <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--primary)" }}>{stats.activeCycles}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Consistencia muscular</span>
        </div>

        {/* KPI 3 */}
        <div className="glass-card card-rose" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Análisis Postura (IA)</span>
          <div style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--accent)" }}>{stats.postureJobs}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Evaluaciones biomecánicas</span>
        </div>

        {/* KPI 4 */}
        <div className="glass-card card-amber" style={{ background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "6px", padding: "20px 24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Alertas de Stock</span>
          <div style={{ fontSize: "2.2rem", fontWeight: "900", color: stats.lowStockAlerts > 0 ? "var(--error)" : "var(--success)" }}>{stats.lowStockAlerts}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Urgente reposición</span>
        </div>
      </div>

      {/* 4. Split Layout: Activity & Quick Actions */}
      <div className="grid-2-cols" style={{ gap: "30px", alignItems: "start" }}>
        
        {/* Left Column: Recent Activity Feed */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "30px" }}>
          <h3 className="glow-text" style={{ fontSize: "1.35rem", margin: 0 }}>Historial de Actividad Reciente</h3>
          
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
              No se han registrado eventos recientes en las cuentas de tus alumnos.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "16px", borderLeft: "2px solid rgba(0, 128, 128, 0.15)" }}>
              {recentActivity.map((act, idx) => (
                <div key={idx} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {/* Timeline point */}
                  <div 
                    style={{ 
                      position: "absolute", 
                      left: "-23px", 
                      top: "4px", 
                      width: "12px", 
                      height: "12px", 
                      borderRadius: "50%", 
                      background: act.type === "eval" ? "var(--primary)" : "var(--accent)", 
                      border: "2px solid var(--bg-main)"
                    }}
                  ></div>
                  
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{act.date}</span>
                  <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-main)", fontWeight: "500", lineHeight: "1.4" }}>
                    {act.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Operations */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "30px" }}>
          <h3 className="glow-text" style={{ fontSize: "1.35rem", margin: 0 }}>Acciones Directas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "14px", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={onCreateAthlete}
            >
              <span>➕</span> Registrar Nuevo Atleta
            </button>
            
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", marginTop: "4px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Consejo Operativo:</span>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                Haz clic en **Ingresar al Workspace** de cualquier atleta en el menú o dashboard principal para diseñar sus planes específicos o revisar su postura.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrainerDashboard;
