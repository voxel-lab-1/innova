import React from "react";
import ReactDOMServer from "react-dom/server";
import PatientForm from "../client/src/components/PatientForm.jsx";

try {
  console.log("Testing PatientForm component SSR rendering...");
  const html = ReactDOMServer.renderToString(
    React.createElement(PatientForm, {
      onSubmit: (data) => console.log("Submitted:", data),
      onCancel: () => console.log("Canceled")
    })
  );

  console.log("✅ PatientForm rendered cleanly!");
  console.log("HTML snippet includes Day select:", html.includes("Día"));
  console.log("HTML snippet includes Month select:", html.includes("Mes"));
  console.log("HTML snippet includes Year select:", html.includes("Año"));
} catch (err) {
  console.error("❌ PatientForm render error:", err);
}
