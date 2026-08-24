import React, { useState, useEffect } from "react";

const MUSCLE_GROUPS = [
  { value: "chest", label: "Pecho" },
  { value: "back", label: "Espalda" },
  { value: "legs", label: "Piernas" },
  { value: "shoulders", label: "Hombros" },
  { value: "arms", label: "Brazos" },
  { value: "core", label: "Abdominales / Core" },
  { value: "full_body", label: "Cuerpo Completo" }
];

const TrainerExercises = ({ apiBase, planType }) => {
  const [globals, setGlobals] = useState([]);
  const [customs, setCustoms] = useState([]);
  const [selectedMuscle, setSelectedMuscle] = useState("Todos");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "globals" | "customs" | "hidden"
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [videoUrl, setVideoUrl] = useState("");
  const [technique, setTechnique] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/trainer/exercises`);
      if (res.ok) {
        const data = await res.json();
        setGlobals(data.globals || []);
        setCustoms(data.customs || []);
      }
    } catch (err) {
      console.error("Error loading trainer exercise library:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !muscleGroup) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/trainer/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          muscleGroup,
          videoUrl,
          technique,
          notes
        })
      });

      if (res.ok) {
        setName("");
        setVideoUrl("");
        setTechnique("");
        setNotes("");
        setShowAddForm(false);
        fetchLibrary();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Error al registrar el ejercicio");
      }
    } catch (err) {
      console.error("Error registering custom exercise:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHideExercise = async (exerciseName) => {
    try {
      const res = await fetch(`${apiBase}/trainer/exercises/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName })
      });
      if (res.ok) {
        fetchLibrary();
      }
    } catch (err) {
      console.error("Error hiding exercise:", err);
    }
  };

  const handleShowExercise = async (exerciseName) => {
    try {
      const res = await fetch(`${apiBase}/trainer/exercises/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName })
      });
      if (res.ok) {
        fetchLibrary();
      }
    } catch (err) {
      console.error("Error showing exercise:", err);
    }
  };

  const handleDeleteCustom = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este ejercicio personalizado?")) return;

    try {
      const res = await fetch(`${apiBase}/trainer/exercises/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchLibrary();
      }
    } catch (err) {
      console.error("Error deleting exercise:", err);
    }
  };

  // Filters logic
  const filterByMuscle = (list) => {
    if (selectedMuscle === "Todos") return list;
    return list.filter(ex => ex.muscleGroup.toLowerCase().includes(selectedMuscle.toLowerCase()));
  };

  const visibleGlobals = filterByMuscle(globals.filter(ex => !ex.hidden));
  const hiddenGlobals = filterByMuscle(globals.filter(ex => ex.hidden));
  const filteredCustoms = filterByMuscle(customs);

  const isFree = planType === "free";

  return (
    <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="glow-text" style={{ fontSize: "2rem", marginBottom: "4px" }}>Biblioteca de Ejercicios</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Personaliza el catálogo de ejercicios que utilizas para prescribir rutinas a tus atletas.
          </p>
        </div>
        {!isFree ? (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Volver a la Biblioteca" : "+ Crear Ejercicio Propio"}
          </button>
        ) : (
          <button className="btn btn-secondary" style={{ opacity: 0.6, cursor: "not-allowed" }} disabled>
            🔒 Crear Ejercicio Propio (Pro)
          </button>
        )}
      </div>

      {isFree && (
        <div style={{ background: "rgba(255, 69, 0, 0.05)", border: "1px solid rgba(255, 69, 0, 0.15)", borderRadius: "10px", padding: "16px", fontSize: "0.9rem", color: "var(--error)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🔒</span> <span><strong>Plan Semilla limitado:</strong> Para silenciar/ocultar ejercicios de la biblioteca global o registrar tus propios movimientos personalizados, adquiere la membresía <strong>Profesional (Pro)</strong>.</span>
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(255,255,255,0.01)" }}>
          <h3 className="glow-text" style={{ fontSize: "1.3rem" }}>Registrar Ejercicio Personalizado</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="input-group">
              <label className="input-label">Nombre del Ejercicio</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Sentadilla Búlgara con Mancuerna"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Grupo Muscular Principal</label>
              <select 
                className="form-input"
                value={muscleGroup}
                onChange={e => setMuscleGroup(e.target.value)}
              >
                {MUSCLE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Enlace de Video Demostrativo (Opcional)</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="Ej. https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="input-group">
              <label className="input-label">Técnica / Tempo (Opcional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. 1-0-1 o 3-1-1"
                value={technique}
                onChange={e => setTechnique(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Notas Generales (Opcional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Parada de 1 segundo en el estiramiento"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Ejercicio"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Filters Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button 
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Activos ({visibleGlobals.length + filteredCustoms.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === "globals" ? "active" : ""}`}
                onClick={() => setActiveTab("globals")}
              >
                Predeterminados ({visibleGlobals.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === "customs" ? "active" : ""}`}
                onClick={() => setActiveTab("customs")}
              >
                Creados por Mí ({filteredCustoms.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === "hidden" ? "active" : ""}`}
                onClick={() => setActiveTab("hidden")}
              >
                🚫 Ocultados ({hiddenGlobals.length})
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Grupo Muscular:</span>
              <select 
                className="form-input" 
                style={{ width: "160px", padding: "6px 12px" }}
                value={selectedMuscle}
                onChange={e => setSelectedMuscle(e.target.value)}
              >
                <option value="Todos">Todos</option>
                {MUSCLE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Cargando ejercicios...
            </div>
          ) : (
            <div style={{ overflowX: "auto", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left", color: "var(--text-muted)" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-main)", fontWeight: "600" }}>
                    <th style={{ padding: "12px 16px" }}>Nombre del Ejercicio</th>
                    <th style={{ padding: "12px 16px" }}>Grupo Muscular</th>
                    <th style={{ padding: "12px 16px" }}>Video</th>
                    <th style={{ padding: "12px 16px" }}>Origen</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Customs Render */}
                  {(activeTab === "all" || activeTab === "customs") && filteredCustoms.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--text-main)" }}>{ex.name}</td>
                      <td style={{ padding: "12px 16px" }}>{MUSCLE_GROUPS.find(g => g.value === ex.muscleGroup)?.label || ex.muscleGroup}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {ex.videoUrl ? <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Ver Video 🎥</a> : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "0.8rem", background: "rgba(0,128,128,0.15)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px" }}>Propio</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "0.8rem", height: "auto" }} onClick={() => handleDeleteCustom(ex.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Globals Render */}
                  {(activeTab === "all" || activeTab === "globals") && visibleGlobals.map((ex, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--text-main)" }}>{ex.name}</td>
                      <td style={{ padding: "12px 16px" }}>{MUSCLE_GROUPS.find(g => g.value === ex.muscleGroup)?.label || ex.muscleGroup}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {ex.videoUrl ? <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Ver Video 🎥</a> : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>Predeterminado</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: "4px 8px", fontSize: "0.8rem", height: "auto", color: isFree ? "var(--text-muted)" : "var(--error)", cursor: isFree ? "not-allowed" : "pointer" }} 
                          disabled={isFree}
                          onClick={() => handleHideExercise(ex.name)}
                        >
                          {isFree ? "🔒 Ocultar (Pro)" : "🚫 Ocultar"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Hidden Render */}
                  {activeTab === "hidden" && hiddenGlobals.map((ex, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(244,63,94,0.02)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "600", textDecoration: "line-through" }}>{ex.name}</td>
                      <td style={{ padding: "12px 16px" }}>{MUSCLE_GROUPS.find(g => g.value === ex.muscleGroup)?.label || ex.muscleGroup}</td>
                      <td style={{ padding: "12px 16px" }}>-</td>
                      <td style={{ padding: "12px 16px" }}>Ocultado</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: "4px 8px", fontSize: "0.8rem", height: "auto", cursor: isFree ? "not-allowed" : "pointer" }} 
                          disabled={isFree}
                          onClick={() => handleShowExercise(ex.name)}
                        >
                          {isFree ? "🔒 Activar (Pro)" : "🔓 Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Empty state check */}
                  {((activeTab === "all" && visibleGlobals.length + filteredCustoms.length === 0) ||
                    (activeTab === "globals" && visibleGlobals.length === 0) ||
                    (activeTab === "customs" && filteredCustoms.length === 0) ||
                    (activeTab === "hidden" && hiddenGlobals.length === 0)) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No hay ejercicios para mostrar en este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerExercises;
