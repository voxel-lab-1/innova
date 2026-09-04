import React, { useState, useEffect } from "react";

const PatientForm = ({ onSubmit, onCancel, patient = null }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => String(currentYear - i));
  const months = [
    { val: "01", label: "Ene (01)" },
    { val: "02", label: "Feb (02)" },
    { val: "03", label: "Mar (03)" },
    { val: "04", label: "Abr (04)" },
    { val: "05", label: "May (05)" },
    { val: "06", label: "Jun (06)" },
    { val: "07", label: "Jul (07)" },
    { val: "08", label: "Ago (08)" },
    { val: "09", label: "Sep (09)" },
    { val: "10", label: "Oct (10)" },
    { val: "11", label: "Nov (11)" },
    { val: "12", label: "Dic (12)" },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("male");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sport, setSport] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patient) {
      setName(patient.name || "");
      setBirthdate(patient.birthdate || "");
      if (patient.birthdate) {
        const parts = patient.birthdate.split("-");
        if (parts.length === 3) {
          setYear(parts[0]);
          setMonth(parts[1]);
          setDay(parts[2]);
        }
      }
      setGender(patient.gender || "male");
      setEmail(patient.email || "");
      setPhone(patient.phone || "");
      setSport(patient.sport || "");
    }
  }, [patient]);

  useEffect(() => {
    if (year && month && day) {
      setBirthdate(`${year}-${month}-${day}`);
    }
  }, [year, month, day]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      setError("El nombre del atleta es obligatorio.");
      return;
    }
    setError("");
    onSubmit({
      name,
      birthdate: birthdate || "2000-01-01",
      gender: gender || "male",
      email,
      phone,
      sport,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 className="glow-text" style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
        {patient ? "Editar Atleta" : "Nuevo Atleta"}
      </h3>

      {error && (
        <div style={{ color: "var(--error)", padding: "10px", borderRadius: "6px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Nombre Completo *</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Juan Pérez"
          required
        />
      </div>

      <div className="grid-2-cols" style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
        <div className="form-group" style={{ minWidth: 0, maxWidth: "100%", width: "100%" }}>
          <label className="form-label">Fecha de Nacimiento *</label>
          <input
            type="date"
            className="form-input"
            style={{
              boxSizing: "border-box",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              minHeight: "48px",
              fontSize: "1rem",
            }}
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: 0, maxWidth: "100%", width: "100%", overflow: "hidden" }}>
          <label className="form-label">Género *</label>
          <select
            className="form-select"
            style={{ boxSizing: "border-box", width: "100%", maxWidth: "100%", minWidth: 0 }}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </div>
      </div>

      <div className="grid-2-cols">
        <div className="form-group">
          <label className="form-label">Correo Electrónico</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input
            type="tel"
            className="form-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 123 4567"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Deporte / Objetivo Principal</label>
        <input
          type="text"
          className="form-input"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Ej. Fisicoculturismo, Pérdida de grasa, Natación"
        />
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {patient ? "Guardar Cambios" : "Crear Atleta"}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;
