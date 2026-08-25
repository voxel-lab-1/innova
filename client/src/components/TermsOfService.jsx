import React from "react";

export default function TermsOfService() {
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
            Términos de Servicio
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Última actualización: 25 de agosto de 2026
          </p>
        </div>

        {/* Content */}
        {[
          {
            title: "1. Aceptación de los términos",
            content: `Al acceder y usar ZEROFIT, aceptas estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes usar la plataforma. El uso continuado del servicio constituye aceptación de cualquier modificación a estos términos.`,
          },
          {
            title: "2. Descripción del servicio",
            content: `ZEROFIT es una plataforma CRM deportivo diseñada para entrenadores y preparadores físicos. Ofrece herramientas de gestión de atletas, seguimiento antropométrico (somatocartas ISAK), planificación de entrenamiento, gestión de suplementación y análisis de postura con inteligencia artificial.`,
          },
          {
            title: "3. Cuentas de usuario",
            content: `Para usar ZEROFIT debes registrarte con una cuenta válida de Google. Eres responsable de mantener la confidencialidad de tu cuenta y de todas las actividades que ocurran bajo ella. Debes notificarnos inmediatamente de cualquier uso no autorizado de tu cuenta.`,
          },
          {
            title: "4. Uso aceptable",
            content: `Te comprometes a usar ZEROFIT únicamente para fines legítimos relacionados con el entrenamiento deportivo. Queda prohibido: (a) usar la plataforma para actividades ilegales; (b) intentar acceder a cuentas de otros usuarios; (c) introducir datos falsos o engañosos; (d) usar la plataforma para spamear o acosar a otros usuarios.`,
          },
          {
            title: "5. Propiedad intelectual",
            content: `ZEROFIT y todo su contenido, características y funcionalidades son propiedad exclusiva de sus desarrolladores y están protegidos por leyes de propiedad intelectual. No puedes copiar, modificar, distribuir, vender o alquilar ninguna parte del servicio sin autorización expresa por escrito.`,
          },
          {
            title: "6. Datos y privacidad",
            content: `El uso de ZEROFIT está sujeto a nuestra Política de Privacidad, disponible en zerofit.vercel.app/privacy. Al usar el servicio, aceptas que recopilemos y usemos tu información según lo descrito en dicha política.`,
          },
          {
            title: "7. Membresías y pagos",
            content: `ZEROFIT ofrece planes de membresía con diferentes funcionalidades. Los pagos son procesados de forma segura. Las suscripciones se renuevan automáticamente salvo que las canceles antes de la fecha de renovación. No se realizan reembolsos por períodos parciales de uso.`,
          },
          {
            title: "8. Disponibilidad del servicio",
            content: `Nos esforzamos por mantener ZEROFIT disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados o no programados. No somos responsables por pérdidas derivadas de interrupciones del servicio.`,
          },
          {
            title: "9. Limitación de responsabilidad",
            content: `ZEROFIT se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del servicio. Nuestra responsabilidad máxima se limita al monto pagado por el servicio en los últimos 3 meses.`,
          },
          {
            title: "10. Terminación",
            content: `Podemos suspender o terminar tu acceso a ZEROFIT por violación de estos términos, sin previo aviso. Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil. Tras la cancelación, tus datos serán eliminados según nuestra Política de Privacidad.`,
          },
          {
            title: "11. Modificaciones",
            content: `Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigor al publicarse. Te notificaremos de cambios significativos por correo electrónico o mediante aviso en la plataforma.`,
          },
          {
            title: "12. Contacto",
            content: `Para preguntas sobre estos Términos de Servicio, contáctanos en: contacto@zerofit.app o a través de zerofit.vercel.app`,
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
            <a href="/privacy" style={{ color: "#00f2fe", textDecoration: "none", marginRight: "16px" }}>
              Política de Privacidad
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
