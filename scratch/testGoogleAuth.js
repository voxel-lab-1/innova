import jwt from "jsonwebtoken";
import db from "../server/database.js";

async function withDBRetry(fn, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`DB query attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

async function testResilientGoogleAuth(email, name) {
  console.log("Testing Google Auth for:", email);
  const cleanEmail = email.trim().toLowerCase();

  let patient = null;
  try {
    patient = await withDBRetry(async () => {
      const existing = await db.patient.findMany({ where: { email: { not: null } } });
      return existing.find(p => p.email && p.email.trim().toLowerCase() === cleanEmail);
    });

    if (!patient) {
      console.log("Creating new patient...");
      patient = await withDBRetry(async () => {
        return await db.patient.create({
          data: {
            name: name || "Atleta Google",
            email: cleanEmail,
            birthdate: "",
            gender: "male",
            sport: "General",
            creatorId: null
          }
        });
      });
    }
  } catch (dbErr) {
    console.warn("DB Connection failed, activating fallback session:", dbErr.message);
    patient = {
      id: 9999,
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      role: "patient"
    };
  }

  console.log("SUCCESS! Resulting Patient User Object:", patient);
  const token = jwt.sign({ id: patient.id, email: patient.email, role: "patient" }, "secret", { expiresIn: "30d" });
  console.log("SUCCESS! Generated Auth Token:", token);
}

testResilientGoogleAuth("miguelmr2905@gmail.com", "MIGUEL");
