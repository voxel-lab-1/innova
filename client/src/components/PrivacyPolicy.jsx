import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#060913",
      color: "#e2e8f0",
      fontFamily: "'Inter', sans-serif",
      padding: "60px 20px",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <a href="/" style={{ color: "#00f2fe", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Volver a ZEROFIT
          </a>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #00f2fe, #4facfe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginTop: "20px",
            marginBottom: "8px",
          }}>
            Política de Privacidad
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Última actualización: 25 de agosto de 2026
          </p>
        </div>

        {/* Content */}
        {[
          {
            title: "1. Información que recopilamos",
            content: `ZEROFIT recopila la información que proporcionas al registrarte, incluyendo tu nombre, correo electrónico y datos de perfil de Google. También recopilamos información sobre los atletas que registres en la plataforma, como datos antropométricos, planes de entrenamiento y métricas de rendimiento, con el propósito exclusivo de prestarte el servicio.`,
          },
          {
            title: "2. Uso de la información",
            content: `Utilizamos tu información para: (a) proveer y mantener el servicio de CRM deportivo; (b) gestionar tu cuenta y autenticación; (c) almacenar y procesar los datos de tus atletas de forma segura; (d) enviarte comunicaciones relacionadas con el servicio cuando sea necesario.`,
          },
          {
            title: "3. Autenticación con Google",
            content: `ZEROFIT utiliza Google OAuth 2.0 para el inicio de sesión. Solo accedemos a tu nombre, correo electrónico y foto de perfil públicos de Google. No accedemos a tus contactos, correos, documentos ni ningún otro dato de tu cuenta de Google.`,
          },
          {
            title: "4. Almacenamiento de datos",
            content: `Tus datos son almacenados de forma segura en Supabase, una plataforma de base de datos con cifrado en reposo y en tránsito. No vendemos, alquilamos ni compartimos tu información personal con terceros sin tu consentimiento explícito.`,
          },
          {
            title: "5. Datos de atletas",
            content: `Como entrenador registrado, eres responsable de los datos que ingreses sobre tus atletas. ZEROFIT actúa como procesador de datos en tu nombre. Te recomendamos obtener el consentimiento de tus atletas antes de ingresar su información en la plataforma.`,
          },
          {
            title: "6. Seguridad",
            content: `Implementamos medidas técnicas y organizativas apropiadas para proteger tu información contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún sistema es 100% seguro y no podemos garantizar seguridad absoluta.`,
          },
          {
            title: "7. Tus derechos",
            content: `Tienes derecho a: acceder a tus datos personales, corregirlos, solicitar su eliminación, exportarlos o restringir su procesamiento. Para ejercer estos derechos, contáctanos en el correo indicado al final de este documento.`,
          },
          {
            title: "8. Cookies",
            content: `ZEROFIT utiliza almacenamiento local del navegador (localStorage y sessionStorage) para mantener tu sesión activa. No utilizamos cookies de rastreo de terceros ni publicidad.`,
          },
          {
            title: "9. Cambios en esta política",
            content: `Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos mediante un aviso en la plataforma. El uso continuado del servicio tras los cambios constituye tu aceptación de la nueva política.`,
          },
          {
            title: "10. Contacto",
            content: `Si tienes preguntas sobre esta Política de Privacidad, contáctanos en: contacto@zerofit.app o a través de la plataforma en www.zerofit.app`,
          },
        ].map((section, i) => (
          <div key={i} style={{
            marginBottom: "32px",
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h2 style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              color: "#00f2fe",
              marginBottom: "12px",
            }}>
              {section.title}
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: "1.7", fontSize: "0.95rem" }}>
              {section.content}
            </p>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "60px", color: "#475569", fontSize: "0.85rem" }}>
          <p>© 2026 ZEROFIT · CRM Deportivo para Entrenadores</p>
          <p style={{ marginTop: "8px" }}>
            <a href="/terms" style={{ color: "#00f2fe", textDecoration: "none", marginRight: "16px" }}>
              Términos de Servicio
            </a>
            <a href="/" style={{ color: "#00f2fe", textDecoration: "none" }}>
              Inicio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
