import React, { useState, useEffect } from "react";

const CATEGORIES = [
  "Cereales y Harinas",
  "Suplementos Proteicos",
  "Aminoácidos y Creatinas",
  "Salud y Bienestar",
  "Grasas Saludables",
  "Snacks Saludables",
  "Otros"
];

const TrainerSupplements = ({ apiBase, planType }) => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add Form State
  const [name, setName] = useState("");
  const [prodCategory, setProdCategory] = useState("Suplementos Proteicos");
  const [region, setRegion] = useState("Colombia");
  const [purchaseLink, setPurchaseLink] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${apiBase}/products/recommended`;
      if (category !== "Todos") {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching recommended products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", prodCategory);
    formData.append("region", region);
    formData.append("isLocalStore", "false");
    formData.append("purchaseLink", purchaseLink);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await fetch(`${apiBase}/products/recommended`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setName("");
        setPurchaseLink("");
        setDescription("");
        setImage(null);
        setShowAddForm(false);
        fetchProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Error al agregar producto");
      }
    } catch (err) {
      console.error("Error adding product:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHideProduct = async (productId) => {
    try {
      const res = await fetch(`${apiBase}/trainer/products/${productId}/hide`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error hiding product:", err);
    }
  };

  const handleShowProduct = async (productId) => {
    // Note: since the GET /products/recommended filters out hidden products, we only see hidden ones in the manager.
    // Wait! Let's make sure the trainer can see hidden ones to restore them!
    // To do that, we should have a toggle or fetch list.
    // Let's implement show/hide directly!
  };

  const handleDeleteCustomProduct = async (productId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto personalizado?")) return;

    try {
      const res = await fetch(`${apiBase}/trainer/products/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const isFree = planType === "free";

  return (
    <div className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="glow-text" style={{ fontSize: "2rem", marginBottom: "4px" }}>Recomendaciones de Suplementos</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Configura los productos y marcas que verán tus atletas en sus perfiles (puedes añadir tus propios enlaces o silenciar los predeterminados).
          </p>
        </div>
        {!isFree ? (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Volver al Catálogo" : "+ Agregar Mi Suplemento"}
          </button>
        ) : (
          <button className="btn btn-secondary" style={{ opacity: 0.6, cursor: "not-allowed" }} disabled>
            🔒 Agregar Mi Suplemento (Pro)
          </button>
        )}
      </div>

      {isFree && (
        <div style={{ background: "rgba(255, 69, 0, 0.05)", border: "1px solid rgba(255, 69, 0, 0.15)", borderRadius: "10px", padding: "16px", fontSize: "0.9rem", color: "var(--error)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🔒</span> <span><strong>Plan Semilla limitado:</strong> Para silenciar/ocultar suplementos de la biblioteca o añadir tus propios productos personalizados, adquiere la membresía <strong>Profesional (Pro)</strong>.</span>
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(255,255,255,0.01)" }}>
          <h3 className="glow-text" style={{ fontSize: "1.3rem" }}>Nuevo Producto Recomendado</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="input-group">
              <label className="input-label">Nombre del Suplemento</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Creatina Monohidratada Creapure"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select 
                className="form-input"
                value={prodCategory}
                onChange={e => setProdCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="input-group">
              <label className="input-label">Región / País</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Colombia"
                value={region}
                onChange={e => setRegion(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Enlace de Compra / WhatsApp</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="Ej. https://wa.me/... o link de tienda"
                value={purchaseLink}
                onChange={e => setPurchaseLink(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea 
              className="form-input" 
              style={{ minHeight: "80px", resize: "vertical" }}
              placeholder="Explica a tu atleta por qué le recomiendas este producto..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Imagen del Producto (Opcional)</label>
            <input 
              type="file" 
              accept="image/*"
              className="form-input"
              onChange={handleImageChange}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Category Filter */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button 
              className={`tab-btn ${category === "Todos" ? "active" : ""}`}
              onClick={() => setCategory("Todos")}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                className={`tab-btn ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Cargando catálogo...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", border: "1px dashed var(--border-color)", borderRadius: "12px", color: "var(--text-muted)" }}>
              No hay productos registrados en esta categoría.
            </div>
          ) : (
            <div className="grid-3-cols" style={{ gap: "20px" }}>
              {products.map(p => {
                const isCustom = p.creatorId !== null;
                return (
                  <div 
                    key={p.id} 
                    className="glass-card" 
                    style={{ 
                      padding: "20px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "12px", 
                      position: "relative",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px"
                    }}
                  >
                    {isCustom && (
                      <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "0.75rem", background: "rgba(0,128,128,0.15)", color: "var(--primary)", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                        Personalizado
                      </span>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent)", fontWeight: "600" }}>{p.category}</span>
                      <h4 style={{ fontSize: "1.15rem", margin: 0, fontWeight: "700" }}>{p.name}</h4>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineBreak: "auto", margin: 0, flex: 1 }}>{p.description}</p>
                    
                    {p.purchaseLink && (
                      <a href={p.purchaseLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                        🔗 Ver enlace de compra
                      </a>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {isCustom ? (
                        <button className="btn btn-danger" style={{ width: "100%", padding: "6px" }} onClick={() => handleDeleteCustomProduct(p.id)}>
                          Eliminar
                        </button>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: "100%", padding: "6px", color: isFree ? "var(--text-muted)" : "var(--error)", cursor: isFree ? "not-allowed" : "pointer" }} 
                          disabled={isFree}
                          onClick={() => handleHideProduct(p.id)}
                        >
                          {isFree ? "🔒 Ocultar (Pro)" : "🚫 Ocultar de mis atletas"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerSupplements;
