import React, { useState, useEffect } from "react";
import PatientForm from "./components/PatientForm";
import EvaluationForm from "./components/EvaluationForm";
import Somatochart from "./components/Somatochart";
import BodyTrendChart from "./components/BodyTrendChart";
import CyclePlanner from "./components/CyclePlanner";
import AthleteView from "./components/AthleteView";
import PostureAnalyzer from "./components/PostureAnalyzer";
import CalorieCounter from "./components/CalorieCounter";
import TrainingPlanner from "./components/TrainingPlanner";
import Login from "./components/Login";
import SomatotypeBodyVisualizer from "./components/SomatotypeBodyVisualizer";
import TrainerSupplements from "./components/TrainerSupplements";
import TrainerExercises from "./components/TrainerExercises";
import TrainerSubscription from "./components/TrainerSubscription";
import TrainerDashboard from "./components/TrainerDashboard";

const API_BASE = "/api";

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ZEROFIT_user") || sessionStorage.getItem("ZEROFIT_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!currentUser;

  const [sharedAthleteId, setSharedAthleteId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareToken = params.get("shareToken");
      if (shareToken) {
        sessionStorage.setItem("ZEROFIT_token", shareToken);
        const decoded = decodeJwt(shareToken);
        return decoded ? decoded.athleteId : null;
      }
      return params.get("athleteId");
    } catch {
      return null;
    }
  });
  const [showQrModal, setShowQrModal] = useState(false);

  const handleLoginSuccess = (user, rememberMe, token) => {
    setCurrentUser(user);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("ZEROFIT_auth", "true");
    storage.setItem("ZEROFIT_user", JSON.stringify(user));
    if (token) {
      storage.setItem("ZEROFIT_token", token);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("ZEROFIT_auth");
    localStorage.removeItem("ZEROFIT_user");
    localStorage.removeItem("ZEROFIT_token");
    sessionStorage.removeItem("ZEROFIT_auth");
    sessionStorage.removeItem("ZEROFIT_user");
    sessionStorage.removeItem("ZEROFIT_token");
    setSelectedPatient(null);
    setIsAthleteView(false);
  };

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [shareToken, setShareToken] = useState("");

  useEffect(() => {
    if (showQrModal && selectedPatient) {
      setShareToken("");
      fetch(`${API_BASE}/patients/${selectedPatient.id}/share-token`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch share token");
        })
        .then(data => {
          setShareToken(data.shareToken);
        })
        .catch(err => {
          console.error("Error loading share token:", err);
        });
    }
  }, [showQrModal, selectedPatient]);
  
  // UI states
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showTrainerSupplements, setShowTrainerSupplements] = useState(false);
  const [showTrainerExercises, setShowTrainerExercises] = useState(false);
  const [showTrainerSubscription, setShowTrainerSubscription] = useState(false);

  const resetAllViews = () => {
    setSelectedPatient(null);
    setIsAddingPatient(false);
    setIsEditingPatient(false);
    setIsAddingEvaluation(false);
    setIsAddingCycle(false);
    setShowTrainerSupplements(false);
    setShowTrainerExercises(false);
    setShowTrainerSubscription(false);
  };

  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [isAddingEvaluation, setIsAddingEvaluation] = useState(false);
  const [isAddingCycle, setIsAddingCycle] = useState(false);
  const [isAthleteView, setIsAthleteView] = useState(false);
  const [activeTab, setActiveTab] = useState("anthropometry"); // "anthropometry", "supplementation", "posture", "nutrition"
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [addingAthleteForCreatorId, setAddingAthleteForCreatorId] = useState(null);
  const [trainerSub, setTrainerSub] = useState(null);

  const fetchTrainerSub = async () => {
    try {
      const res = await fetch(`${API_BASE}/trainer/subscription`);
      if (res.ok) {
        const data = await res.json();
        setTrainerSub(data);
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "admin") {
        fetchPatients();
      } else {
        fetchPatients(currentUser.id);
        fetchTrainerSub();
      }
    }
  }, [isAuthenticated, currentUser]);

  const fetchPatients = async (creatorId = null) => {
    try {
      const url = creatorId 
        ? `${API_BASE}/patients?creatorId=${creatorId}` 
        : `${API_BASE}/patients`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchPatientDetail = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data);
        setShowTrainerSupplements(false);
        setShowTrainerExercises(false);
        setShowTrainerSubscription(false);
      }
    } catch (err) {
      console.error("Error fetching patient details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (patientData) => {
    try {
      const creatorIdToUse = currentUser.role === "admin" 
        ? addingAthleteForCreatorId 
        : currentUser.id;

      const res = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientData,
          creatorId: creatorIdToUse
        }),
      });
      if (res.ok) {
        const newPatient = await res.json();
        setIsAddingPatient(false);
        setAddingAthleteForCreatorId(null);
        fetchPatients(currentUser.role === "admin" ? null : currentUser.id);
        fetchPatientDetail(newPatient.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al crear atleta: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error creating patient:", err);
      alert("Error de conexión al crear el atleta");
    }
  };

  const handleUpdatePatient = async (patientData) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${selectedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });
      if (res.ok) {
        setIsEditingPatient(false);
        fetchPatients(currentUser.role === "admin" ? null : currentUser.id);
        fetchPatientDetail(selectedPatient.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al actualizar atleta: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error updating patient:", err);
      alert("Error de conexión al actualizar el atleta");
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ath = selectedPatient;
    const ev = ath.evaluations?.[0] || {};
    const cycles = ath.cycles || [];
    const activeDiet = ath.mealPlans?.find(p => p.isActive) || ath.mealPlans?.[0] || null;
    const activeRoutine = ath.trainingPlans?.find(p => p.isActive) || ath.trainingPlans?.[0] || null;

    let routineHtml = "";
    if (activeRoutine) {
      routineHtml = `
        <div class="card" style="margin-bottom: 30px;">
          <h3>Plan de Entrenamiento Activo: ${activeRoutine.name}</h3>
          <p>Objetivo: <strong>${activeRoutine.goal || "Hipertrofia"}</strong> | Días/Semana: <strong>${activeRoutine.daysPerWeek || 4}</strong></p>
        </div>
      `;
    } else {
      routineHtml = `
        <div class="card" style="margin-bottom: 30px;">
          <h3>Plan de Entrenamiento Activo</h3>
          <p style="color: #718096; font-style: italic;">No hay rutinas asignadas en este momento.</p>
        </div>
      `;
    }

    let dietHtml = "";
    if (activeDiet) {
      const isAi = activeDiet.planJson?.desayuno || activeDiet.planJson?.planJson?.desayuno;
      const parsedJson = activeDiet.planJson?.planJson || activeDiet.planJson || {};

      if (isAi) {
        dietHtml = `
          <div class="card" style="margin-bottom: 30px;">
            <h3>Plan de Alimentación Activo: ${activeDiet.name} (IA Gemini)</h3>
            <div class="metric">Calorías Meta: <strong>${activeDiet.calories} kcal/día</strong></div>
            <div class="metric">Distribución Macros: <strong>P: ${activeDiet.protein}g | C: ${activeDiet.carbs}g | G: ${activeDiet.fat}g</strong></div>
            
            <h4 style="color: #008080; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; margin-top: 16px;">Menú Sugerido por IA</h4>
            <p><strong>Desayuno:</strong> ${parsedJson.desayuno || "N/A"}</p>
            <p><strong>Almuerzo:</strong> ${parsedJson.almuerzo || "N/A"}</p>
            <p><strong>Merienda:</strong> ${parsedJson.merienda || "N/A"}</p>
            <p><strong>Cena:</strong> ${parsedJson.cena || "N/A"}</p>
            <p><strong>Hidratación:</strong> ${parsedJson.hidratacion || "N/A"}</p>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 0.85rem; color: #4a5568; line-height: 1.4;">
              <strong>Análisis Metabólico:</strong> ${parsedJson.motivoMetabolico || "N/A"}
            </p>
          </div>
        `;
      } else {
        dietHtml = `
          <div class="card" style="margin-bottom: 30px;">
            <h3>Plan de Alimentación Activo: ${activeDiet.name}</h3>
            <div class="metric">Calorías Meta: <strong>${activeDiet.calories} kcal/día</strong></div>
            <div class="metric">Distribución Macros: <strong>P: ${activeDiet.protein}g | C: ${activeDiet.carbs}g | G: ${activeDiet.fat}g</strong></div>
            
            <h4 style="color: #008080; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; margin-top: 16px;">Porciones Asignadas</h4>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; font-size: 0.85rem; margin-top: 10px;">
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Lácteos: <strong>${parsedJson.portions?.lacteos || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Sustitutos: <strong>${parsedJson.portions?.sustitutos || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Carnes: <strong>${parsedJson.portions?.carnes || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Harinas: <strong>${parsedJson.portions?.harinas || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Frutas: <strong>${parsedJson.portions?.frutas || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Verduras: <strong>${parsedJson.portions?.verduras || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Nueces: <strong>${parsedJson.portions?.nueces || 0}</strong></div>
              <div style="background: white; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">Grasas: <strong>${parsedJson.portions?.grasas || 0}</strong></div>
            </div>
          </div>
        `;
      }
    } else {
      dietHtml = `
        <div class="card" style="margin-bottom: 30px;">
          <h3>Plan de Alimentación Activo</h3>
          <p style="color: #718096; font-style: italic;">No hay planes nutricionales activos en este momento.</p>
        </div>
      `;
    }

    let html = `
      <html>
        <head>
          <title>Reporte de Rendimiento - ${ath.name}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1a202c;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #008080;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 1.8rem;
              font-weight: 800;
              color: #008080;
              letter-spacing: -1px;
            }
            .title {
              font-size: 1.5rem;
              font-weight: 700;
              text-align: right;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              background: #f8fafc;
            }
            h3 {
              color: #008080;
              margin-top: 0;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
              font-size: 1.2rem;
            }
            .metric {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 0.95rem;
            }
            .metric strong {
              color: #2d3748;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 0.9rem;
            }
            th, td {
              border-bottom: 1px solid #e2e8f0;
              padding: 10px 8px;
              text-align: left;
            }
            th {
              color: #4a5568;
              font-weight: 700;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 0.8rem;
              color: #718096;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body { margin: 20px; }
              .card { background: transparent; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ZEROFIT <span style="font-size: 0.9rem; font-weight: normal; color: #4a5568;">CRM</span></div>
            <div class="title">REPORTE FÍSICO DE ATLETA</div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3>Datos del Atleta</h3>
              <div class="metric">Nombre: <strong>${ath.name}</strong></div>
              <div class="metric">Disciplina: <strong>${ath.sport || "Acondicionamiento General"}</strong></div>
              <div class="metric">Género: <strong>${ath.gender === "male" ? "Masculino" : "Femenino"}</strong></div>
              <div class="metric">Fecha Nacimiento: <strong>${ath.birthdate}</strong></div>
            </div>

            <div class="card">
              <h3>Última Antropometría (ISAK)</h3>
              <div class="metric">Peso Actual: <strong>${ev.weight ? `${ev.weight} kg` : "N/A"}</strong></div>
              <div class="metric">Estatura: <strong>${ev.height ? `${ev.height} cm` : "N/A"}</strong></div>
              <div class="metric">% Grasa Corporal: <strong>${ev.bodyFat ? `${ev.bodyFat}%` : "N/A"}</strong></div>
              <div class="metric">Somatotipo (Endo-Meso-Ecto): <strong>${ev.endomorphy || "N/A"}-${ev.mesomorphy || "N/A"}-${ev.ectomorphy || "N/A"}</strong></div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 30px;">
            <h3>Pauta de Suplementación y Logística</h3>
            ${cycles.length === 0 ? "<p style='color: #718096; font-style: italic; font-size: 0.9rem;'>No hay ciclos de suplementación activos en este período.</p>" : `
              <table>
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Suplemento</th>
                    <th>Dosis</th>
                    <th>Frecuencia</th>
                    <th>Stock Restante</th>
                  </tr>
                </thead>
                <tbody>
                  ${cycles.map(c => `
                    <tr>
                      <td><strong>${c.name}</strong></td>
                      <td>${c.supplement?.name || "Sin vincular"}</td>
                      <td>${c.dose || "N/A"}</td>
                      <td>Cada ${c.frequencyHours || "N/A"} horas</td>
                      <td>${c.stockRemaining !== null ? `${c.stockRemaining} uds` : "N/A"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `}
          </div>

          ${dietHtml}

          ${routineHtml}

          <div class="footer">
            <p>Reporte generado automáticamente por la Consola de Comando de ZEROFIT. Todos los derechos reservados.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDeletePatient = async (id, isSubAthlete = false, parentId = null) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este atleta y todo su historial?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPatients(currentUser.role === "admin" ? null : currentUser.id);
        if (isSubAthlete && parentId) {
          fetchPatientDetail(parentId);
        } else {
          setSelectedPatient(null);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al eliminar atleta: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("Error de conexión al eliminar el atleta");
    }
  };

  const handleCreateEvaluation = async (evalData) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${selectedPatient.id}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evalData),
      });
      if (res.ok) {
        setIsAddingEvaluation(false);
        fetchPatientDetail(selectedPatient.id);
        fetchPatients(currentUser.role === "admin" ? null : currentUser.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al guardar evaluación: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error creating evaluation:", err);
      alert("Error de conexión al guardar la evaluación");
    }
  };

  const handleDeleteEvaluation = async (evalId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta evaluación?")) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/evaluations/${evalId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPatientDetail(selectedPatient.id);
        fetchPatients(currentUser.role === "admin" ? null : currentUser.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al eliminar evaluación: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting evaluation:", err);
      alert("Error de conexión al eliminar la evaluación");
    }
  };

  const handleCreateCycle = async (cycleData) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${selectedPatient.id}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycleData),
      });
      if (res.ok) {
        setIsAddingCycle(false);
        fetchPatientDetail(selectedPatient.id);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al crear el ciclo: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error creating cycle:", err);
      alert("Error de conexión al crear el ciclo");
    }
  };

  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este ciclo?")) return;
    try {
      const res = await fetch(`${API_BASE}/cycles/${cycleId}`, { method: "DELETE" });
      if (res.ok) {
        fetchPatientDetail(selectedPatient.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sharedAthleteId) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "var(--grad-dark)" }}>
        <AthleteView
          patientId={sharedAthleteId}
          isPublicShare={true}
          onBack={() => {}}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // If in Mobile PWA simulation, render fullscreen AthleteView
  if (isAthleteView && selectedPatient) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "var(--grad-dark)" }}>
        <AthleteView
          patientId={selectedPatient.id}
          onBack={() => {
            setIsAthleteView(false);
            fetchPatientDetail(selectedPatient.id);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Navigation */}
      <header
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-color)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Toggle Sidebar Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "8px",
                transition: "all var(--transition-fast)",
              }}
              className="sidebar-toggle-btn"
              title="Toggle Sidebar"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "var(--primary)",
                borderRadius: "50%",
                boxShadow: "0 0 10px var(--primary)",
              }}
            />
            <h1 className="glow-text" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
              ZEROFIT
            </h1>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "2px", marginLeft: "10px" }}>
              CRM & Suplementación
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            {currentUser?.role === "admin" ? "Modo Administrador" : `Entrenador: ${currentUser?.name}`}
          </div>
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 69, 0, 0.08)";
              e.target.style.borderColor = "rgba(255, 69, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "none";
              e.target.style.borderColor = "var(--border-color)";
            }}
            style={{
              background: "none",
              border: "1px solid var(--border-color)",
              color: "var(--error)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Drawer Backdrop */}
      {isSidebarOpen && (
        <div className="drawer-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Layout Grid */}
      <div className={`main-layout ${selectedPatient || isAddingPatient || isEditingPatient || isAddingEvaluation || isAddingCycle ? "has-active-content" : ""}`}>
        
        {/* Sidebar Drawer: Patient List & Search */}
        {isAuthenticated && (
          <aside className={`sidebar-drawer ${isSidebarOpen ? "open" : ""}`}>
          {/* Search bar & Add Button */}
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                {currentUser?.role === "admin" ? "Panel de Entrenadores" : "Mis Atletas"}
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "4px 8px"
                }}
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder={currentUser?.role === "admin" ? "Buscar entrenador..." : "Buscar atleta..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedPatient(null);
                setIsAddingPatient(true);
                setIsEditingPatient(false);
                setIsAddingEvaluation(false);
                setIsAddingCycle(false);
                setIsSidebarOpen(false);
              }}
            >
              {currentUser?.role === "admin" ? "+ Nuevo Entrenador" : "+ Nuevo Atleta"}
            </button>
          </div>

          {/* Coach Customization Links */}
          {currentUser?.role !== "admin" && (
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  resetAllViews();
                  setShowTrainerSupplements(true);
                  setIsSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: showTrainerSupplements ? "rgba(0, 128, 128, 0.12)" : "var(--bg-main)",
                  border: "1px solid var(--border-color)",
                  color: showTrainerSupplements ? "var(--primary)" : "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all var(--transition-fast)",
                  textAlign: "left"
                }}
              >
                <span>🛒</span> Mis Suplementos
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllViews();
                  setShowTrainerExercises(true);
                  setIsSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: showTrainerExercises ? "rgba(0, 128, 128, 0.12)" : "var(--bg-main)",
                  border: "1px solid var(--border-color)",
                  color: showTrainerExercises ? "var(--primary)" : "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all var(--transition-fast)",
                  textAlign: "left"
                }}
              >
                <span>💪</span> Mis Ejercicios
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllViews();
                  setShowTrainerSubscription(true);
                  setIsSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: showTrainerSubscription ? "rgba(0, 128, 128, 0.12)" : "var(--bg-main)",
                  border: "1px solid var(--border-color)",
                  color: showTrainerSubscription ? "var(--primary)" : "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all var(--transition-fast)",
                  textAlign: "left"
                }}
              >
                <span>💳</span> Mi Suscripción
              </button>
            </div>
          )}

          {/* Patient Scroll List or Section Trigger */}
          {!(showHistory || searchQuery.trim() !== "") ? (
            <div style={{ padding: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                style={{
                  width: "100%",
                  padding: "20px 16px",
                  borderRadius: "12px",
                  background: "var(--bg-main)",
                  border: "1px dashed var(--primary)",
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
                className="history-toggle-btn"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📁</span>
                  <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                    {currentUser?.role === "admin" ? "Historial de Entrenadores" : "Historial de Atletas"}
                  </span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: "600" }}>Ver Historial</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  padding: "10px 20px 0 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
                  {searchQuery.trim() !== "" 
                    ? "Resultados de Búsqueda" 
                    : (currentUser?.role === "admin" ? "Historial de Entrenadores" : "Historial de Atletas")}
                </span>
                {searchQuery.trim() === "" && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    Ocultar
                  </button>
                )}
              </div>

              {/* Patient Scroll List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                {filteredPatients.length === 0 ? (
                  <div style={{ color: "var(--text-dark)", textAlign: "center", padding: "20px", fontSize: "0.9rem" }}>
                    No se encontraron {currentUser?.role === "admin" ? "entrenadores" : "atletas"}
                  </div>
                ) : (
                  filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        fetchPatientDetail(p.id);
                        setIsAddingPatient(false);
                        setIsEditingPatient(false);
                        setIsAddingEvaluation(false);
                        setIsAddingCycle(false);
                        setIsSidebarOpen(false);
                      }}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                        background: selectedPatient?.id === p.id ? "var(--primary-glow)" : "transparent",
                        border: `1px solid ${selectedPatient?.id === p.id ? "var(--primary)" : "transparent"}`,
                        marginBottom: "8px",
                      }}
                      className="patient-item"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ color: selectedPatient?.id === p.id ? "var(--primary)" : "var(--text-main)", fontSize: "1rem" }}>
                          {p.name}
                          {currentUser?.role === "admin" && (
                            <span style={{ fontSize: "0.75rem", color: "var(--primary)", marginLeft: "6px", fontWeight: "normal" }}>
                              ({p.athletes?.length || 0} {p.athletes?.length === 1 ? 'atleta' : 'atletas'})
                            </span>
                          )}
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-main)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>
                          {p.gender === "male" ? "M" : "F"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        <span>{p.sport || "General"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      )}

        {/* Content Area */}
        <main className="content-panel">
          {/* Mobile Back Button */}
          {(selectedPatient || isAddingPatient || isEditingPatient || isAddingEvaluation || isAddingCycle || showTrainerSupplements || showTrainerExercises || showTrainerSubscription) && (
            <button
              className="btn btn-secondary mobile-back-btn"
              onClick={() => {
                resetAllViews();
              }}
            >
              ← Volver a {currentUser?.role === "admin" ? "Entrenadores" : "Atletas"}
            </button>
          )}
          
          {/* Trainer Customized Views */}
          {showTrainerSupplements && (
            <TrainerSupplements apiBase={API_BASE} planType={trainerSub?.planType || "free"} />
          )}

          {showTrainerExercises && (
            <TrainerExercises apiBase={API_BASE} planType={trainerSub?.planType || "free"} />
          )}

          {showTrainerSubscription && (
            <TrainerSubscription apiBase={API_BASE} />
          )}
          
          {/* 1. Add Patient View */}
          {isAddingPatient && (
            <PatientForm
              onSubmit={handleCreatePatient}
              onCancel={() => setIsAddingPatient(false)}
            />
          )}

          {/* 2. Edit Patient View */}
          {isEditingPatient && (
            <PatientForm
              patient={selectedPatient}
              onSubmit={handleUpdatePatient}
              onCancel={() => setIsEditingPatient(false)}
            />
          )}

          {/* 3. Add Evaluation View */}
          {isAddingEvaluation && (
            <EvaluationForm
              patient={selectedPatient}
              onSubmit={handleCreateEvaluation}
              onCancel={() => setIsAddingEvaluation(false)}
            />
          )}

          {/* 4. Add Cycle View */}
          {isAddingCycle && selectedPatient && (
            <CyclePlanner
              patientId={selectedPatient.id}
              supplements={selectedPatient.supplements}
              onSubmit={handleCreateCycle}
              onCancel={() => setIsAddingCycle(false)}
            />
          )}

          {/* 5. Main Detail / History View */}
          {!isAddingPatient && !isEditingPatient && !isAddingEvaluation && !isAddingCycle && selectedPatient && (
            currentUser.role === "admin" && selectedPatient.creatorId === null ? (
              // User Account Dashboard View
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="glass-card profile-header-card">
                  <div className="profile-details">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <h2 className="profile-name">{selectedPatient.name}</h2>
                      <span
                        style={{
                          background: "rgba(0,128,128,0.1)",
                          color: "var(--primary)",
                          padding: "4px 10px",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Cuenta de Entrenador
                      </span>
                    </div>
                    <div className="profile-info-row">
                      {selectedPatient.email && <span>Email: <strong>{selectedPatient.email}</strong></span>}
                      {selectedPatient.phone && <span>Teléfono: <strong>{selectedPatient.phone}</strong></span>}
                      {selectedPatient.country && <span>País: <strong>{selectedPatient.country}</strong></span>}
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button className="btn btn-secondary" onClick={() => setIsEditingPatient(true)}>
                      Editar Perfil
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeletePatient(selectedPatient.id)}>
                      Eliminar Cuenta
                    </button>
                  </div>
                </div>

                {/* Sub-athletes dashboard section */}
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 className="glow-text" style={{ fontSize: "1.4rem" }}>Atletas Registrados</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Perfiles de atletas creados y gestionados por este entrenador.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setAddingAthleteForCreatorId(selectedPatient.id);
                        setIsAddingPatient(true);
                      }}
                    >
                      + Registrar Nuevo Atleta
                    </button>
                  </div>

                  <div style={{ overflowX: "auto", marginTop: "10px" }}>
                    {!selectedPatient.athletes || selectedPatient.athletes.length === 0 ? (
                      <div style={{ color: "var(--text-dark)", textAlign: "center", padding: "40px", fontStyle: "italic", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>
                        Este entrenador aún no ha registrado atletas.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-main)", fontWeight: "600" }}>
                            <th style={{ padding: "12px 16px" }}>Nombre del Atleta</th>
                            <th style={{ padding: "12px 16px" }}>Deporte</th>
                            <th style={{ padding: "12px 16px" }}>Género</th>
                            <th style={{ padding: "12px 16px" }}>Fecha Nacimiento</th>
                            <th style={{ padding: "12px 16px" }}>Evaluaciones</th>
                            <th style={{ padding: "12px 16px", textAlign: "right" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPatient.athletes.map((ath) => (
                            <tr key={ath.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="table-row-hover">
                              <td style={{ padding: "16px 16px", color: "var(--text-main)", fontWeight: 600 }}>{ath.name}</td>
                              <td style={{ padding: "16px 16px" }}>
                                <span style={{ background: "rgba(0,128,128,0.06)", color: "var(--primary)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>
                                  {ath.sport || "General"}
                                </span>
                              </td>
                              <td style={{ padding: "16px 16px" }}>{ath.gender === "male" ? "Masculino" : "Femenino"}</td>
                              <td style={{ padding: "16px 16px" }}>{ath.birthdate}</td>
                              <td style={{ padding: "16px 16px", fontWeight: "600" }}>{ath._count?.evaluations || 0}</td>
                              <td style={{ padding: "16px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                    onClick={() => fetchPatientDetail(ath.id)}
                                  >
                                    Ver Workspace
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                                    onClick={() => handleDeletePatient(ath.id, true, selectedPatient.id)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // RENDER ATHLETE WORKSPACE (Standard tabs)
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Breadcrumb banner for admin to go back to user account details */}
                {currentUser?.role === "admin" && selectedPatient.creatorId !== null && (
                  <div
                    className="glass-card animate-fade-in"
                    style={{
                      padding: "12px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: "4px solid var(--primary)",
                      background: "rgba(0, 128, 128, 0.02)",
                    }}
                  >
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                      👤 Atleta registrado por: <strong>{selectedPatient.creator?.name || "Entrenador"}</strong> ({selectedPatient.creator?.email})
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem", height: "auto" }}
                      onClick={() => fetchPatientDetail(selectedPatient.creatorId)}
                    >
                      ← Volver a Cuenta de {selectedPatient.creator?.name || "Entrenador"}
                    </button>
                  </div>
                )}
                
                {/* Header profile details */}
                <div className="glass-card profile-header-card">
                  <div className="profile-details">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <h2 className="profile-name">{selectedPatient.name}</h2>
                      <span
                        style={{
                          background: "rgba(0,242,254,0.1)",
                          color: "var(--primary)",
                          padding: "4px 10px",
                          borderRadius: "10px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedPatient.sport || "Sin Deporte"}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span>Género: <strong>{selectedPatient.gender === "male" ? "Masculino" : "Femenino"}</strong></span>
                      <span>Nacimiento: <strong>{selectedPatient.birthdate}</strong></span>
                      {selectedPatient.email && <span>Email: <strong>{selectedPatient.email}</strong></span>}
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button className="btn btn-secondary" style={{ border: "1px solid var(--accent)", color: "var(--accent)" }} onClick={handlePrintReport}>
                      🖨️ Imprimir Reporte PDF
                    </button>
                    <button className="btn btn-secondary" style={{ border: "1px solid var(--primary)", color: "var(--primary)" }} onClick={() => setShowQrModal(true)}>
                      🔗 Generar QR de Acceso
                    </button>
                    <button className="btn btn-secondary" style={{ border: "1px solid var(--primary)", color: "var(--primary)" }} onClick={() => setIsAthleteView(true)}>
                      📱 Vista Móvil (Atleta PWA)
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsEditingPatient(true)}>
                      Editar Perfil
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeletePatient(selectedPatient.id, selectedPatient.creatorId !== null, selectedPatient.creatorId)}>
                      Eliminar Atleta
                    </button>
                  </div>
                </div>

                {/* CRM Section Toggles */}
                <div className="tabs">
                  <button
                    className={`tab-btn ${activeTab === "anthropometry" ? "active" : ""}`}
                    onClick={() => setActiveTab("anthropometry")}
                  >
                    Historial Antropométrico
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "supplementation" ? "active" : ""}`}
                    onClick={() => setActiveTab("supplementation")}
                  >
                    Ciclos de Suplementación
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "nutrition" ? "active" : ""}`}
                    onClick={() => setActiveTab("nutrition")}
                  >
                    Control de Nutrición
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "training" ? "active" : ""}`}
                    onClick={() => setActiveTab("training")}
                  >
                    🏋️ Plan de Entrenamiento
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "posture" ? "active" : ""}`}
                    onClick={() => setActiveTab("posture")}
                  >
                    Análisis Biomecánico
                  </button>
                </div>

                {/* Sub-section 1: Anthropometry */}
                {activeTab === "anthropometry" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
                    
                    {/* Dynamic Somatotype Body Shape Visualizer */}
                    <SomatotypeBodyVisualizer
                      evaluations={selectedPatient.evaluations}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                    />

                    {/* Body Trend Chart */}
                    {selectedPatient.evaluations?.length >= 2 && (
                      <div className="glass-card">
                        <h3 className="glow-text" style={{ fontSize: "1.15rem", marginBottom: "4px" }}>
                          📈 Evolución Corporal
                        </h3>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px", marginTop: "-2px" }}>
                          Tendencia de peso y porcentaje de grasa a lo largo del tiempo.
                        </p>
                        <BodyTrendChart evaluations={selectedPatient.evaluations} />
                      </div>
                    )}

                    <div className="grid-1-2-cols">
                      {/* Somatochart */}
                      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 className="glow-text" style={{ fontSize: "1.25rem" }}>
                          Somatocarta Histórica
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "-8px" }}>
                          La línea de tendencia conecta tus evaluaciones de forma cronológica. Pasa el cursor por los puntos para ver el desglose.
                        </p>
                        <Somatochart evaluations={selectedPatient.evaluations} />
                      </div>

                      {/* Evaluations timeline list */}
                      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 className="glow-text" style={{ fontSize: "1.25rem" }}>
                            Historial de Evaluaciones
                          </h3>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                            onClick={() => setIsAddingEvaluation(true)}
                          >
                            + Nueva Evaluación
                          </button>
                        </div>

                        <div style={{ flex: 1, overflowX: "auto" }}>
                          {selectedPatient.evaluations?.length === 0 ? (
                            <div style={{ color: "var(--text-dark)", textAlign: "center", padding: "40px", fontStyle: "italic" }}>
                              Aún no se han registrado evaluaciones para este atleta.
                            </div>
                          ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "left" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-main)" }}>
                                  <th style={{ padding: "12px 8px" }}>Fecha</th>
                                  <th style={{ padding: "12px 8px" }}>Peso</th>
                                  <th style={{ padding: "12px 8px" }}>Grasa %</th>
                                  <th style={{ padding: "12px 8px" }}>Somatotipo</th>
                                  <th style={{ padding: "12px 8px" }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPatient.evaluations.map((ev) => (
                                  <tr key={ev.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "12px 8px", color: "var(--text-main)", fontWeight: 600 }}>{ev.date}</td>
                                    <td style={{ padding: "12px 8px" }}>{ev.weight} kg</td>
                                    <td style={{ padding: "12px 8px", color: "var(--warning)", fontWeight: 600 }}>
                                      {ev.bodyFat ? `${ev.bodyFat}%` : "N/A"}
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                      {ev.endomorphy.toFixed(1)} - {ev.mesomorphy.toFixed(1)} - {ev.ectomorphy.toFixed(1)}
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                      <button
                                        className="btn"
                                        style={{ padding: "4px 8px", fontSize: "0.75rem", background: "rgba(255,69,0,0.1)", color: "var(--error)" }}
                                        onClick={() => handleDeleteEvaluation(ev.id)}
                                      >
                                        Borrar
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-section 2: Supplementation Planner */}
                {activeTab === "supplementation" && (
                  <div className="grid-1-2-1-cols">
                    
                    {/* Cycles list */}
                    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="glow-text" style={{ fontSize: "1.25rem" }}>
                          Ciclos Activos y Protocolos
                        </h3>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                          onClick={() => setIsAddingCycle(true)}
                        >
                          + Programar Ciclo
                        </button>
                      </div>

                      <div style={{ flex: 1, overflowX: "auto" }}>
                        {selectedPatient.cycles?.length === 0 ? (
                          <div style={{ color: "var(--text-dark)", textAlign: "center", padding: "40px", fontStyle: "italic" }}>
                            No hay ciclos de suplementación prescritos aún.
                          </div>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "left" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-main)" }}>
                                <th style={{ padding: "12px 8px" }}>Nombre Protocolo</th>
                                <th style={{ padding: "12px 8px" }}>Fecha Inicio</th>
                                <th style={{ padding: "12px 8px" }}>Suplemento</th>
                                <th style={{ padding: "12px 8px" }}>Estado</th>
                                <th style={{ padding: "12px 8px" }}>Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPatient.cycles.map((cyc) => (
                                <tr key={cyc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  <td style={{ padding: "12px 8px", color: "var(--text-main)", fontWeight: 600 }}>{cyc.name}</td>
                                  <td style={{ padding: "12px 8px" }}>{cyc.startDate}</td>
                                  <td style={{ padding: "12px 8px" }}>{cyc.supplement?.name || "Sin vincular"}</td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <span style={{ color: cyc.isActive ? "var(--success)" : "var(--text-dark)" }}>
                                      {cyc.isActive ? "Activo" : "Finalizado"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <button
                                      className="btn"
                                      style={{ padding: "4px 8px", fontSize: "0.75rem", background: "rgba(244,63,94,0.1)", color: "var(--error)" }}
                                      onClick={() => handleDeleteCycle(cyc.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Supplement Inventory Panel */}
                    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <h3 className="glow-text" style={{ fontSize: "1.25rem" }}>
                        Inventario de Suplementos (Stock)
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "-8px" }}>
                        Stock actual registrado del atleta. Los avisos de reposición automática se generan al quedar 5 días de consumo.
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginTop: "8px" }}>
                        {selectedPatient.supplements?.length === 0 ? (
                          <div style={{ color: "var(--text-dark)", textAlign: "center", padding: "20px", fontStyle: "italic", gridColumn: "1 / -1" }}>
                            No hay suplementos registrados en inventario.
                          </div>
                        ) : (
                          selectedPatient.supplements.map((sup) => {
                            const percent = Math.min(100, Math.round((sup.remainingQuantity / sup.totalCapacity) * 100));
                            const isLow = sup.remainingQuantity <= (sup.totalCapacity * 0.15) || percent <= 15;
                            const r = 20;
                            const strokeWidth = 4;
                            const circ = 2 * Math.PI * r;
                            const offset = circ - (percent / 100) * circ;
                            return (
                              <div
                                key={sup.id}
                                style={{
                                  border: `1px solid ${isLow ? "rgba(255, 69, 0, 0.2)" : "var(--border-color)"}`,
                                  borderRadius: "12px",
                                  padding: "12px",
                                  background: isLow ? "rgba(255, 69, 0, 0.02)" : "rgba(255,255,255,0.01)",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  textAlign: "center"
                                }}
                              >
                                <div style={{ position: "relative", width: "50px", height: "50px", marginBottom: "8px" }}>
                                  <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
                                    <circle cx="25" cy="25" r={r} stroke="rgba(0, 0, 0, 0.05)" strokeWidth={strokeWidth} fill="transparent" />
                                    <circle
                                      cx="25"
                                      cy="25"
                                      r={r}
                                      stroke={isLow ? "var(--error)" : "var(--primary)"}
                                      strokeWidth={strokeWidth}
                                      fill="transparent"
                                      strokeDasharray={circ}
                                      strokeDashoffset={offset}
                                      strokeLinecap="round"
                                      style={{
                                        transition: "stroke-dashoffset 0.5s ease",
                                        filter: `drop-shadow(0 0 3px ${isLow ? "var(--error)" : "var(--primary)"})`
                                      }}
                                    />
                                  </svg>
                                  <div style={{
                                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.8rem", fontWeight: "bold", color: isLow ? "var(--error)" : "var(--text-main)"
                                  }}>
                                    {percent}%
                                  </div>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={sup.name}>
                                  {sup.name}
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                  {sup.remainingQuantity} / {sup.totalCapacity} {sup.unit}
                                </span>
                                {isLow && (
                                  <span style={{
                                    marginTop: "6px", fontSize: "0.6rem", padding: "1px 4px",
                                    background: "rgba(255, 69, 0, 0.08)", color: "var(--error)",
                                    borderRadius: "4px", border: "1px solid rgba(255, 69, 0, 0.15)",
                                    fontWeight: 600
                                  }}>
                                    STOCK BAJO
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub-section 3: Training Plan */}
                {activeTab === "training" && (
                  <TrainingPlanner patientId={selectedPatient.id} isAdminMode={true} planType={trainerSub?.planType || "free"} />
                )}

                {/* Sub-section 4: Posture Biomechanics */}
                {activeTab === "posture" && (
                  <PostureAnalyzer patientId={selectedPatient.id} planType={trainerSub?.planType || "free"} />
                )}

                {/* Sub-section 5: Nutrition Control */}
                {activeTab === "nutrition" && (
                  <CalorieCounter patientId={selectedPatient.id} isAdminMode={true} planType={trainerSub?.planType || "free"} />
                )}
              </div>
            )
          )}

          {/* Patient welcome view for normal users */}
          {currentUser?.role !== "admin" && !selectedPatient && !isAddingPatient && !isEditingPatient && !isAddingEvaluation && !isAddingCycle && !showTrainerSupplements && !showTrainerExercises && !showTrainerSubscription && (
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <TrainerDashboard 
                apiBase={API_BASE}
                onSelectAthlete={(id) => fetchPatientDetail(id)}
                onCreateAthlete={() => {
                  setSelectedPatient(null);
                  setIsAddingPatient(true);
                }}
                planType={trainerSub?.planType || "free"}
              />

              {/* Athletes List inside Dashboard */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "30px" }}>
                <h3 className="glow-text" style={{ fontSize: "1.35rem", margin: 0 }}>Mis Atletas Registrados</h3>
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "15vh", color: "var(--text-muted)" }}>
                    <div style={{ width: "20px", height: "20px", border: "3px solid rgba(0, 128, 128, 0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: "10px" }}></div>
                    Cargando atletas...
                  </div>
                ) : patients.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 20px", border: "1px dashed var(--border-color)", borderRadius: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px" }}>
                      Aún no has registrado ningún atleta.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedPatient(null);
                        setIsAddingPatient(true);
                      }}
                    >
                      Crea tu primer atleta
                    </button>
                  </div>
                ) : (
                  <div className="grid-3-cols" style={{ gap: "20px" }}>
                    {patients.map((ath) => (
                      <div
                        key={ath.id}
                        className="glass-card table-row-hover animate-fade-in"
                        style={{
                          padding: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "16px",
                          transition: "transform 0.2s, border-color 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={() => fetchPatientDetail(ath.id)}
                      >
                        <div>
                          <h3 className="glow-text" style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "4px" }}>
                            {ath.name}
                          </h3>
                          <span
                            style={{
                              background: "rgba(0, 128, 128, 0.1)",
                              color: "var(--primary)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                            }}
                          >
                            {ath.sport || "General"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div>Género: <strong>{ath.gender === "male" ? "Masculino" : "Femenino"}</strong></div>
                          <div>Nacimiento: <strong>{ath.birthdate}</strong></div>
                          <div>Evaluaciones: <strong>{ath.evaluations?.length || ath._count?.evaluations || 0}</strong></div>
                        </div>
                        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ width: "100%", padding: "8px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchPatientDetail(ath.id);
                            }}
                          >
                            Ingresar al Workspace →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Welcome Dashboard (When no patient is selected) */}
          {currentUser?.role === "admin" && !isAddingPatient && !isEditingPatient && !isAddingEvaluation && !isAddingCycle && !selectedPatient && !showTrainerSupplements && !showTrainerExercises && !showTrainerSubscription && (
            <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "40px" }}>
              <div style={{ maxWidth: "600px" }}>
                <h2 className="glow-text" style={{ fontSize: "2.5rem", marginBottom: "12px" }}>
                  Panel de Comando Antropométrico
                </h2>
                <p style={{ fontSize: "1.1rem", marginBottom: "24px" }}>
                  Bienvenido a la consola logística de rendimiento físico. Abre el panel desplegable con el botón de menú arriba a la izquierda para seleccionar un atleta, buscar o crear uno nuevo.
                </p>
              </div>

              {/* KPI cards */}
              <div className="grid-3-cols">
                <div className="glass-card" style={{ background: "var(--bg-main)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{currentUser?.role === "admin" ? "Total Entrenadores" : "Total Atletas"}</span>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "8px" }}>
                    {patients.length}
                  </div>
                </div>
                <div className="glass-card" style={{ background: "var(--bg-main)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Evaluaciones Registradas</span>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent)", marginTop: "8px" }}>
                    {patients.reduce((sum, p) => sum + (p._count?.evaluations || p.evaluations?.length || 0), 0)}
                  </div>
                </div>
                <div className="glass-card" style={{ background: "var(--bg-main)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Consola Activa</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--success)", marginTop: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 6px var(--success)" }} />
                    Conectado a Supabase (Postgres)
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {showQrModal && selectedPatient && (
        <div
          className="modal-backdrop animate-fade-in"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(47, 79, 79, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="glass-card animate-scale-in"
            style={{
              width: "90%",
              maxWidth: "400px",
              padding: "32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-strong)",
              borderRadius: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="glow-text" style={{ fontSize: "1.4rem", margin: 0 }}>
              Código QR de Acceso
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Escanea este código con tu celular para acceder directamente a tu perfil en modo lectura de Somatotipo y Plan de Entrenamiento, y poder registrar tu Suplementación y Nutrición.
            </p>
            
            <div
              style={{
                background: "#f4f7f6",
                padding: "16px",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {shareToken ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `${window.location.protocol}//${window.location.host}${window.location.pathname}?shareToken=${shareToken}`
                  )}&color=008080&bgcolor=ffffff`}
                  alt="Código QR del Atleta"
                  style={{ display: "block", width: "200px", height: "200px", borderRadius: "8px" }}
                />
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Generando acceso seguro...
                </div>
              )}
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                readOnly
                value={shareToken ? `${window.location.protocol}//${window.location.host}${window.location.pathname}?shareToken=${shareToken}` : "Cargando enlace..."}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.8rem",
                  background: "#f4f7f6",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  textAlign: "center",
                  color: "var(--text-main)",
                  fontWeight: "500",
                }}
                onClick={(e) => shareToken && e.target.select()}
              />
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={!shareToken}
                onClick={() => {
                  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?shareToken=${shareToken}`;
                  navigator.clipboard.writeText(url);
                  alert("¡Enlace copiado al portapapeles!");
                }}
              >
                Copiar Enlace Directo
              </button>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={() => setShowQrModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

