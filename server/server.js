import "./load-env.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const JWT_SECRET = process.env.JWT_SECRET || "innova_jwt_secret_token_secure_9872";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "zerofit2026";

let prismaInstance = null;
const prisma = new Proxy({}, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    return new Proxy({}, {
      get(modelTarget, method) {
        if (method === 'then') return undefined;
        return async (...args) => {
          if (!prismaInstance) {
            console.log("Prisma Client: Lazy loading database.js...");
            const dbModule = await import("./database.js");
            prismaInstance = dbModule.default;
          }
          return prismaInstance[prop][method](...args);
        };
      }
    });
  }
});
import { calculateSomatotype, calculateBodyFat } from "./calculator.js";
import { getSupplementPresetPhases, checkInventoryAlert } from "./supplementEngine.js";
import { enqueuePostureJob, getQueueStatus } from "./queue.js";
import { analyzeCalories } from "./calorieEngine.js";
import { generateTrainingPlanWithAI } from "./trainingEngine.js";
import { generateMealPlan } from "./mealPlanEngine.js";


const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://innova-eta.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  }
}));
app.use(express.json());

// Token Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado." });
    }
    req.user = decoded;

    // If it's an athlete share token, restrict access to their own ID
    if (decoded.role === "athlete_share") {
      const parts = req.path.split("/");
      const pathId = parseInt(parts[1]);
      const queryId = parseInt(req.query.patientId || req.body.patientId);
      const targetPatientId = !isNaN(pathId) ? pathId : queryId;

      if (!isNaN(targetPatientId) && decoded.athleteId !== targetPatientId) {
        return res.status(403).json({ error: "Acceso denegado. Este token no corresponde a este atleta." });
      }
    }

    next();
  });
};

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Protect all /api/ routes except /api/auth/*
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return authenticateToken(req, res, next);
  }
  next();
});

// --- AUTHENTICATION ROUTES ---

// Register route
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, country, phone, birthdate, gender, sport } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios" });
    }

    const existing = await prisma.patient.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    });

    if (existing) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPatient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        country,
        birthdate: birthdate || "1995-01-01",
        gender: gender || "male",
        sport: sport || "General"
      }
    });

    const token = jwt.sign(
      { id: newPatient.id, email: newPatient.email, role: "patient" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newPatient.id,
        name: newPatient.name,
        email: newPatient.email,
        role: "patient"
      }
    });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ error: "Error en el registro del usuario" });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdminUser = cleanEmail === "admin" || cleanEmail === "admin@zerofit.app" || cleanEmail === "admin@innova.com" || cleanEmail === ADMIN_EMAIL.toLowerCase();
    const isAdminPass = password === "zerofit2026" || password === "innova2026" || password === ADMIN_PASSWORD;

    if (isAdminUser && isAdminPass) {
      const token = jwt.sign(
        { id: "admin", email: "admin@zerofit.app", role: "admin" },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      return res.json({
        success: true,
        token,
        user: {
          id: "admin",
          name: "Administrador ZEROFIT",
          email: "admin@zerofit.app",
          role: "admin"
        }
      });
    }

    const patient = await prisma.patient.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" }
      }
    });

    if (!patient || !patient.password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: "patient" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        role: "patient"
      }
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Error en el inicio de sesión" });
  }
});

// Google Authentication verification
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "El token de Google es obligatorio" });
    }

    // Verify token with Google's API
    const googleVerifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleVerifyRes.ok) {
      return res.status(401).json({ error: "Token de Google inválido o expirado" });
    }

    const payload = await googleVerifyRes.json();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: "No se pudo obtener el correo de Google" });
    }

    // Check if patient exists
    let patient = await prisma.patient.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    });

    if (!patient) {
      // Create new user (automatically a parent account with creatorId: null)
      patient = await prisma.patient.create({
        data: {
          name: name || "Atleta Google",
          email: email,
          birthdate: "1995-01-01",
          gender: "male",
          sport: "General",
          creatorId: null
        }
      });
    }

    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: "patient" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        role: "patient"
      }
    });
  } catch (error) {
    console.error("Error in Google authentication:", error);
    res.status(500).json({ error: "Error en la autenticación con Google" });
  }
});

// --- PATIENTS ROUTE ---

// Get all patients (supports filtering by creatorId)
app.get("/api/patients", async (req, res) => {
  console.log("ROUTE /api/patients: Request received.");
  try {
    let whereClause = {};

    if (req.user.role === "admin") {
      const creatorIdQuery = req.query.creatorId;
      if (creatorIdQuery) {
        whereClause = { creatorId: parseInt(creatorIdQuery) };
      } else {
        whereClause = { creatorId: null };
      }
    } else if (req.user.role === "athlete_share") {
      whereClause = { id: req.user.athleteId };
    } else {
      whereClause = {
        OR: [
          { creatorId: req.user.id },
          { id: req.user.id }
        ]
      };
    }

    console.log("ROUTE /api/patients: Querying Prisma with clause:", whereClause);
    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { evaluations: true }
        },
        athletes: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { evaluations: true }
            }
          }
        }
      }
    });

    // Sanitize passwords
    const sanitizedPatients = patients.map(p => {
      const { password, ...rest } = p;
      if (rest.athletes) {
        rest.athletes = rest.athletes.map(a => {
          const { password: _, ...athRest } = a;
          return athRest;
        });
      }
      return rest;
    });

    console.log(`ROUTE /api/patients: Query successful. Patients found: ${sanitizedPatients.length}`);
    res.json(sanitizedPatients);
  } catch (error) {
    console.error("ROUTE /api/patients: Error fetching patients:", error);
    res.status(500).json({ error: "Error al obtener los pacientes" });
  }
});

// Get a patient by ID (including all evaluations)
app.get("/api/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    // Enforce authorization checks (BOLA)
    if (req.user.role !== "admin") {
      if (req.user.role === "athlete_share") {
        if (req.user.athleteId !== patientId) {
          return res.status(403).json({ error: "Acceso denegado. No tienes autorización para ver este atleta." });
        }
      } else {
        const targetPatient = await prisma.patient.findUnique({
          where: { id: patientId }
        });
        if (!targetPatient) {
          return res.status(404).json({ error: "Paciente no encontrado" });
        }
        if (targetPatient.id !== req.user.id && targetPatient.creatorId !== req.user.id) {
          return res.status(403).json({ error: "Acceso denegado. No tienes permiso para ver este paciente." });
        }
      }
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        evaluations: {
          orderBy: { date: "desc" }
        },
        supplements: true,
        cycles: {
          include: {
            phases: true,
            logs: true
          }
        },
        workoutSchedule: true,
        calorieLogs: {
          orderBy: { createdAt: "desc" }
        },
        athletes: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { evaluations: true }
            }
          }
        },
        creator: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Sanitize passwords
    delete patient.password;
    if (patient.creator) delete patient.creator.password;
    if (patient.athletes) {
      patient.athletes.forEach(a => delete a.password);
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient detail:", error);
    res.status(500).json({ error: "Error al obtener los detalles del paciente" });
  }
});

// Get a secure read-only share token for a patient (QR code)
app.get("/api/patients/:id/share-token", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    // Only the creator, the athlete themselves, or admin can generate the share token
    if (req.user.role !== "admin" && patient.creatorId !== req.user.id && patient.id !== req.user.id) {
      return res.status(403).json({ error: "Acceso denegado. No tienes autorización para compartir este paciente." });
    }

    const shareToken = jwt.sign(
      { athleteId: patientId, role: "athlete_share" },
      JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.json({ shareToken });
  } catch (error) {
    console.error("Error generating share token:", error);
    res.status(500).json({ error: "Error al generar el token de compartición" });
  }
});

// Create a new patient
app.post("/api/patients", async (req, res) => {
  try {
    const { name, birthdate, gender, email, phone, sport } = req.body;
    
    if (!name || !birthdate || !gender) {
      return res.status(400).json({ error: "El nombre, fecha de nacimiento y género son obligatorios" });
    }

    // Automatically set creatorId based on logged-in user unless admin specifies another creator
    let creatorId = req.user.role === "admin" ? (req.body.creatorId ? parseInt(req.body.creatorId) : null) : req.user.id;

    // Check subscription limits for non-admin creators
    if (creatorId && req.user.role !== "admin") {
      const trainer = await prisma.patient.findUnique({ where: { id: creatorId } });
      if (trainer) {
        const plan = trainer.planType || "free";
        const isExpired = trainer.subExpiresAt && new Date(trainer.subExpiresAt) < new Date();
        const isActive = trainer.subActive && !isExpired;

        if (plan !== "free" && !isActive) {
          return res.status(403).json({ error: "Tu suscripción ha expirado. Por favor, realiza la renovación en tu cuenta." });
        }

        const count = await prisma.patient.count({ where: { creatorId } });
        const limit = plan === "free" ? 1 : plan === "pro" ? 30 : 999999;

        if (count >= limit) {
          return res.status(403).json({ 
            error: `Has alcanzado el límite de atletas para tu plan (${plan.toUpperCase()}). Límite actual: ${limit} atletas.` 
          });
        }
      }
    }

    const newPatient = await prisma.patient.create({
      data: {
        name,
        birthdate,
        gender,
        email,
        phone,
        sport,
        creatorId
      }
    });

    delete newPatient.password;
    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({ error: `Error al crear el paciente: ${error.message || error}` });
  }
});

// Update patient details
app.put("/api/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const { name, birthdate, gender, email, phone, sport } = req.body;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name,
        birthdate,
        gender,
        email,
        phone,
        sport
      }
    });

    delete updatedPatient.password;
    res.json(updatedPatient);
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
});

// Delete a patient
app.delete("/api/patients/:id", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    await prisma.patient.delete({
      where: { id: patientId }
    });

    res.json({ message: "Paciente eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
});

// --- EVALUATIONS ROUTE ---

// Add a new evaluation to a patient
app.post("/api/patients/:id/evaluations", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const evalData = req.body;
    
    // Validate key fields
    if (!evalData.date || !evalData.weight || !evalData.height || !evalData.age) {
      return res.status(400).json({ error: "Fecha, peso, altura y edad son requeridos" });
    }

    // Helper to extract fields and ensure they are floats/ints
    const cleanData = {
      age: parseInt(evalData.age),
      gender: patient.gender,
      height: parseFloat(evalData.height),
      weight: parseFloat(evalData.weight),
      skinfoldTriceps: parseFloat(evalData.skinfoldTriceps || 0),
      skinfoldBiceps: parseFloat(evalData.skinfoldBiceps || 0),
      skinfoldSubescapular: parseFloat(evalData.skinfoldSubescapular || 0),
      skinfoldSupraspinale: parseFloat(evalData.skinfoldSupraspinale || 0),
      skinfoldCrestaIliaca: parseFloat(evalData.skinfoldCrestaIliaca || 0),
      skinfoldAbdominal: parseFloat(evalData.skinfoldAbdominal || 0),
      skinfoldThigh: parseFloat(evalData.skinfoldThigh || 0),
      skinfoldCalf: parseFloat(evalData.skinfoldCalf || 0),
      girthArm: parseFloat(evalData.girthArm || 0),
      girthArmRelaxed: parseFloat(evalData.girthArmRelaxed || 0),
      girthArmContracted: parseFloat(evalData.girthArmContracted || 0),
      girthWaist: parseFloat(evalData.girthWaist || 0),
      girthHip: parseFloat(evalData.girthHip || 0),
      girthThigh: parseFloat(evalData.girthThigh || 0),
      girthCalf: parseFloat(evalData.girthCalf || 0),
      diameterHumerus: parseFloat(evalData.diameterHumerus || 0),
      diameterBiestiloideo: parseFloat(evalData.diameterBiestiloideo || 0),
      diameterFemur: parseFloat(evalData.diameterFemur || 0),
    };

    // Calculate Somatotype and Body Fat
    const somatotype = calculateSomatotype(cleanData);
    const bodyFatRes = calculateBodyFat(cleanData);

    const newEvaluation = await prisma.evaluation.create({
      data: {
        patientId,
        date: evalData.date,
        weight: cleanData.weight,
        height: cleanData.height,
        age: cleanData.age,
        skinfoldTriceps: cleanData.skinfoldTriceps,
        skinfoldBiceps: cleanData.skinfoldBiceps,
        skinfoldSubescapular: cleanData.skinfoldSubescapular,
        skinfoldSupraspinale: cleanData.skinfoldSupraspinale,
        skinfoldCrestaIliaca: cleanData.skinfoldCrestaIliaca,
        skinfoldAbdominal: cleanData.skinfoldAbdominal,
        skinfoldThigh: cleanData.skinfoldThigh,
        skinfoldCalf: cleanData.skinfoldCalf,
        girthArm: cleanData.girthArmContracted || cleanData.girthArm, // Fallback for backward compatibility
        girthArmRelaxed: cleanData.girthArmRelaxed,
        girthArmContracted: cleanData.girthArmContracted,
        girthWaist: cleanData.girthWaist,
        girthHip: cleanData.girthHip,
        girthThigh: cleanData.girthThigh,
        girthCalf: cleanData.girthCalf,
        diameterHumerus: cleanData.diameterHumerus,
        diameterBiestiloideo: cleanData.diameterBiestiloideo,
        diameterFemur: cleanData.diameterFemur,
        density: bodyFatRes.density || 0,
        bodyFat: bodyFatRes.bodyFat || 0,
        endomorphy: somatotype.endomorphy || 0,
        mesomorphy: somatotype.mesomorphy || 0,
        ectomorphy: somatotype.ectomorphy || 0,
        xCoord: somatotype.xCoord || 0,
        yCoord: somatotype.yCoord || 0,
      }
    });

    res.status(201).json(newEvaluation);
  } catch (error) {
    console.error("Error creating evaluation:", error);
    res.status(500).json({ error: "Error al registrar la evaluación" });
  }
});

// Delete an evaluation
app.delete("/api/evaluations/:id", async (req, res) => {
  try {
    const evalId = parseInt(req.params.id);
    if (isNaN(evalId)) {
      return res.status(400).json({ error: "ID de evaluación inválido" });
    }

    await prisma.evaluation.delete({
      where: { id: evalId }
    });

    res.json({ message: "Evaluación eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    res.status(500).json({ error: "Error al eliminar la evaluación" });
  }
});

// Real-time calculations endpoint (no database save)
app.post("/api/calculate", (req, res) => {
  try {
    const evalData = req.body;
    const cleanData = {
      age: parseInt(evalData.age || 20),
      gender: evalData.gender || "male",
      height: parseFloat(evalData.height || 170),
      weight: parseFloat(evalData.weight || 70),
      skinfoldTriceps: parseFloat(evalData.skinfoldTriceps || 0),
      skinfoldBiceps: parseFloat(evalData.skinfoldBiceps || 0),
      skinfoldSubescapular: parseFloat(evalData.skinfoldSubescapular || 0),
      skinfoldSupraspinale: parseFloat(evalData.skinfoldSupraspinale || 0),
      skinfoldAbdominal: parseFloat(evalData.skinfoldAbdominal || 0),
      skinfoldThigh: parseFloat(evalData.skinfoldThigh || 0),
      skinfoldCalf: parseFloat(evalData.skinfoldCalf || 0),
      girthArm: parseFloat(evalData.girthArm || 0),
      girthCalf: parseFloat(evalData.girthCalf || 0),
      diameterHumerus: parseFloat(evalData.diameterHumerus || 0),
      diameterFemur: parseFloat(evalData.diameterFemur || 0),
    };

    const somatotype = calculateSomatotype(cleanData);
    const bodyFatRes = calculateBodyFat(cleanData);

    res.json({
      somatotype,
      bodyFat: bodyFatRes,
    });
  } catch (error) {
    console.error("Error running real-time calculations:", error);
    res.status(400).json({ error: "Parámetros de cálculo inválidos" });
  }
});

// --- WORKOUT SCHEDULE ROUTES ---

// Get schedule
app.get("/api/patients/:id/schedule", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    let schedule = await prisma.workoutSchedule.findUnique({
      where: { patientId }
    });
    if (!schedule) {
      // Create a default schedule
      schedule = await prisma.workoutSchedule.create({
        data: {
          patientId,
          workoutTime: "18:00",
          activeDays: "Lunes,Miércoles,Viernes"
        }
      });
    }
    res.json(schedule);
  } catch (error) {
    console.error("Error getting schedule:", error);
    res.status(500).json({ error: "Error al obtener el horario" });
  }
});

// Save schedule
app.post("/api/patients/:id/schedule", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { workoutTime, activeDays } = req.body;
    const schedule = await prisma.workoutSchedule.upsert({
      where: { patientId },
      update: { workoutTime, activeDays },
      create: { patientId, workoutTime, activeDays }
    });
    res.json(schedule);
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ error: "Error al guardar el horario" });
  }
});

// --- SUPPLEMENT INVENTORY ROUTES ---

app.get("/api/patients/:id/supplements", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const supplements = await prisma.supplement.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    });
    res.json(supplements);
  } catch (error) {
    console.error("Error fetching supplements:", error);
    res.status(500).json({ error: "Error al obtener suplementos" });
  }
});

app.post("/api/patients/:id/supplements", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { name, brand, totalCapacity, remainingQuantity, unit, purchaseLink } = req.body;
    const supplement = await prisma.supplement.create({
      data: {
        patientId,
        name,
        brand,
        totalCapacity: parseFloat(totalCapacity),
        remainingQuantity: parseFloat(remainingQuantity),
        unit,
        purchaseLink
      }
    });
    res.status(201).json(supplement);
  } catch (error) {
    console.error("Error creating supplement:", error);
    res.status(500).json({ error: "Error al crear suplemento" });
  }
});

app.delete("/api/supplements/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.supplement.delete({ where: { id } });
    res.json({ message: "Suplemento eliminado" });
  } catch (error) {
    console.error("Error deleting supplement:", error);
    res.status(500).json({ error: "Error al eliminar suplemento" });
  }
});

// --- SUPPLEMENT CYCLE ROUTES ---

app.get("/api/patients/:id/cycles", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const cycles = await prisma.supplementCycle.findMany({
      where: { patientId },
      include: {
        phases: true,
        logs: { orderBy: { date: "desc" } },
        supplement: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(cycles);
  } catch (error) {
    console.error("Error fetching cycles:", error);
    res.status(500).json({ error: "Error al obtener ciclos" });
  }
});

app.post("/api/patients/:id/cycles", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { name, supplementId, startDate, presetName } = req.body;

    // Fetch latest weight from evaluations to adjust Creatine load phase
    const latestEval = await prisma.evaluation.findFirst({
      where: { patientId },
      orderBy: { date: "desc" }
    });
    const weight = latestEval ? latestEval.weight : 70;

    const phasesToCreate = getSupplementPresetPhases(presetName, weight);

    const cycle = await prisma.supplementCycle.create({
      data: {
        patientId,
        name,
        supplementId: supplementId ? parseInt(supplementId) : null,
        startDate,
        isActive: true,
        phases: {
          create: phasesToCreate.map(p => ({
            name: p.name,
            durationDays: p.durationDays,
            dailyDose: p.dailyDose,
            timingType: p.timingType,
            customTime: p.customTime
          }))
        }
      },
      include: {
        phases: true
      }
    });

    res.status(201).json(cycle);
  } catch (error) {
    console.error("Error creating cycle:", error);
    res.status(500).json({ error: "Error al crear el ciclo de suplementación" });
  }
});

app.delete("/api/cycles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.supplementCycle.delete({ where: { id } });
    res.json({ message: "Ciclo eliminado" });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    res.status(500).json({ error: "Error al eliminar el ciclo" });
  }
});

// --- INTAKE LOGS AND DEDUCTION ---

app.post("/api/cycles/:id/logs", async (req, res) => {
  try {
    const cycleId = parseInt(req.params.id);
    const { date, time, doseTaken, status } = req.body;

    const cycle = await prisma.supplementCycle.findUnique({
      where: { id: cycleId },
      include: { supplement: true }
    });

    if (!cycle) {
      return res.status(404).json({ error: "Ciclo no encontrado" });
    }

    // Create log record
    const log = await prisma.intakeLog.create({
      data: {
        cycleId,
        date,
        time,
        doseTaken: parseFloat(doseTaken),
        status
      }
    });

    // If marked as taken and linked to an inventory supplement, deduct stock
    if (status === "taken" && cycle.supplement) {
      const updatedRemaining = Math.max(0, cycle.supplement.remainingQuantity - parseFloat(doseTaken));
      await prisma.supplement.update({
        where: { id: cycle.supplement.id },
        data: { remainingQuantity: updatedRemaining }
      });
    }

    res.status(201).json(log);
  } catch (error) {
    console.error("Error logging supplement intake:", error);
    res.status(500).json({ error: "Error al registrar la toma" });
  }
});

// --- REMINDERS & NOTIFICATION ALERTS ENGINE ---

app.get("/api/patients/:id/reminders", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const queryDate = req.query.date || new Date().toISOString().split("T")[0];

    const schedule = await prisma.workoutSchedule.findUnique({
      where: { patientId }
    }) || { workoutTime: "18:00", activeDays: "Lunes,Miércoles,Viernes" };

    const cycles = await prisma.supplementCycle.findMany({
      where: { patientId, isActive: true },
      include: {
        phases: true,
        logs: { where: { date: queryDate } },
        supplement: true
      }
    });

    const reminders = [];

    // Helper: calculate pre-workout and post-workout times
    const calculateRelativeTime = (baseTime, minutesOffset) => {
      try {
        const [hours, minutes] = baseTime.split(":").map(Number);
        const dateObj = new Date();
        dateObj.setHours(hours, minutes, 0, 0);
        dateObj.setMinutes(dateObj.getMinutes() + minutesOffset);
        return dateObj.toTimeString().split(" ")[0].substring(0, 5);
      } catch (err) {
        return baseTime;
      }
    };

    for (const cycle of cycles) {
      // Determine which phase is currently active
      // Order phases to calculate start offset
      const sortedPhases = cycle.phases; 
      let activePhase = null;
      let dayOffsetAccumulator = 0;

      const startDate = new Date(cycle.startDate);
      const targetDate = new Date(queryDate);
      const diffTime = Math.abs(targetDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days since start (1-indexed)

      if (targetDate >= startDate) {
        for (const phase of sortedPhases) {
          if (diffDays >= dayOffsetAccumulator && diffDays <= (dayOffsetAccumulator + phase.durationDays)) {
            activePhase = phase;
            break;
          }
          dayOffsetAccumulator += phase.durationDays;
        }
      }

      if (!activePhase && sortedPhases.length > 0) {
        // Fallback: default to the last phase if cycle is active but timeline is exceeded
        activePhase = sortedPhases[sortedPhases.length - 1];
      }

      if (activePhase) {
        let reminderTime = "12:00";
        if (activePhase.timingType === "morning") reminderTime = "08:00";
        else if (activePhase.timingType === "night") reminderTime = "21:00";
        else if (activePhase.timingType === "pre-workout") {
          reminderTime = calculateRelativeTime(schedule.workoutTime, -45);
        } else if (activePhase.timingType === "post-workout") {
          reminderTime = calculateRelativeTime(schedule.workoutTime, 60);
        } else if (activePhase.timingType === "custom" && activePhase.customTime) {
          reminderTime = activePhase.customTime;
        }

        const logged = cycle.logs.find(l => l.time === reminderTime || cycle.logs.length > 0);

        let stockInfo = null;
        if (cycle.supplement) {
          const alert = checkInventoryAlert(cycle.supplement, activePhase.dailyDose);
          stockInfo = {
            id: cycle.supplement.id,
            remainingQuantity: cycle.supplement.remainingQuantity,
            unit: cycle.supplement.unit,
            daysRemaining: alert.daysRemaining,
            isLowStock: alert.isLowStock,
            purchaseLink: cycle.supplement.purchaseLink
          };
        }

        reminders.push({
          cycleId: cycle.id,
          cycleName: cycle.name,
          phaseName: activePhase.name,
          dailyDose: activePhase.dailyDose,
          timingType: activePhase.timingType,
          scheduledTime: reminderTime,
          status: logged ? logged.status : "pending",
          logId: logged ? logged.id : null,
          stock: stockInfo
        });
      }
    }

    res.json({
      date: queryDate,
      workoutTime: schedule.workoutTime,
      activeDays: schedule.activeDays,
      reminders
    });
  } catch (error) {
    console.error("Error creating reminders list:", error);
    res.status(500).json({ error: "Error al calcular recordatorios" });
  }
});

// --- POSTURE ANALYSIS MODULE ---

const uploadDir = process.env.VERCEL ? "/tmp" : "uploads";
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "posture-" + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Serve uploaded files from Database (Supabase) to support Vercel serverless persistence
app.get("/api/uploads/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { filename }
    });
    if (!fileRecord) {
      // Fallback to local files if it exists (e.g. local development)
      const localPath = path.join(uploadDir, filename);
      if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
      }
      return res.status(404).send("Archivo no encontrado");
    }
    const buffer = Buffer.from(fileRecord.data, "base64");
    res.setHeader("Content-Type", fileRecord.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    return res.send(buffer);
  } catch (err) {
    console.error("Error serving file from database:", err);
    return res.status(500).send("Error al obtener el archivo");
  }
});

// Serve uploaded videos statically
app.use("/api/uploads", express.static(uploadDir));

// Upload video and queue analysis
app.post("/api/patients/:id/posture", upload.single("video"), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    if (req.user.role !== "admin") {
      const athlete = await prisma.patient.findUnique({ where: { id: patientId } });
      if (athlete && athlete.creatorId) {
        const trainer = await prisma.patient.findUnique({ where: { id: athlete.creatorId } });
        if (trainer && (trainer.planType || "free") === "free") {
          return res.status(403).json({ error: "El análisis biomecánico por IA es exclusivo para planes Profesional y Elite. Actualiza la membresía para desbloquearlo." });
        }
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo de video" });
    }

    const videoPath = `/uploads/${req.file.filename}`;

    // Back up video file to database for serverless persistence
    try {
      const fileData = fs.readFileSync(req.file.path);
      await prisma.uploadedFile.create({
        data: {
          filename: req.file.filename,
          mimeType: req.file.mimetype,
          data: fileData.toString("base64")
        }
      });
    } catch (err) {
      console.error("Error backing up video to database:", err);
    }

    // Create record in database
    const job = await prisma.postureAnalysisJob.create({
      data: {
        patientId,
        videoPath,
        status: "pending",
        progress: 0
      }
    });

    // Enqueue to background process
    enqueuePostureJob(job.id, req.file.path);

    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating posture analysis job:", error);
    res.status(500).json({ error: "Error al encolar el análisis biomecánico" });
  }
});

// Get all posture jobs for a patient
app.get("/api/patients/:id/posture/jobs", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const jobs = await prisma.postureAnalysisJob.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching posture jobs:", error);
    res.status(500).json({ error: "Error al obtener los análisis" });
  }
});

// Poll status of a single job
app.get("/api/posture/jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.postureAnalysisJob.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    res.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      videoPath: job.videoPath,
      result: job.resultJson ? JSON.parse(job.resultJson) : null,
      createdAt: job.createdAt
    });
  } catch (error) {
    console.error("Error polling job status:", error);
    res.status(500).json({ error: "Error al obtener estado del análisis" });
  }
});

// Get queue health check
app.get("/api/posture/queue", (req, res) => {
  res.json(getQueueStatus());
});

// --- CALORIE TRACKER MODULE ---

const calorieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "food-" + uniqueSuffix + ext);
  }
});

const uploadCalorie = multer({ storage: calorieStorage });

// 1. Analyze food calories (AI / Simulation fallback)
app.post("/api/patients/:id/calories/analyze", uploadCalorie.single("image"), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const { foodName, ingredients, preparation } = req.body;
    const file = req.file;
    const customApiKey = req.headers["x-gemini-key"] || null;

    const result = await analyzeCalories({
      imagePath: file ? file.path : null,
      mimeType: file ? file.mimetype : null,
      foodName,
      ingredients,
      preparation,
      customApiKey
    });

    if (file) {
      result.imagePath = `/uploads/${file.filename}`;
      try {
        const fileData = fs.readFileSync(file.path);
        await prisma.uploadedFile.create({
          data: {
            filename: file.filename,
            mimeType: file.mimetype,
            data: fileData.toString("base64")
          }
        });
        // Delete the temporary file from disk
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Error backing up calorie image to database:", err);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("Error analyzing calories:", error);
    res.status(500).json({ error: "Error al analizar calorías del plato" });
  }
});

// 2. Save Calorie Log to DB
app.post("/api/patients/:id/calories/logs", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const { date, foodName, calories, protein, carbs, fat, sugar, sodium, ingredients, preparation, imagePath } = req.body;

    if (!date || !foodName || calories === undefined) {
      return res.status(400).json({ error: "Fecha, alimento y calorías son obligatorios" });
    }

    const log = await prisma.calorieLog.create({
      data: {
        patientId,
        date,
        foodName,
        calories: parseInt(calories),
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        sugar: sugar ? parseFloat(sugar) : null,
        sodium: sodium ? parseFloat(sodium) : null,
        ingredients,
        preparation,
        imagePath
      }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error("Error saving calorie log:", error);
    res.status(500).json({ error: "Error al guardar registro en el diario" });
  }
});

// 3. Get Calorie Logs
app.get("/api/patients/:id/calories/logs", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    const logs = await prisma.calorieLog.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching calorie logs:", error);
    res.status(500).json({ error: "Error al obtener el historial del diario" });
  }
});

// 4. Delete Calorie Log
app.delete("/api/calories/logs/:id", async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    if (isNaN(logId)) {
      return res.status(400).json({ error: "ID de registro inválido" });
    }

    await prisma.calorieLog.delete({
      where: { id: logId }
    });

    res.json({ message: "Registro eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting calorie log:", error);
    res.status(500).json({ error: "Error al eliminar el registro del diario" });
  }
});

// --- MEAL PLANS & RECOMMENDED PRODUCTS MODULE ---

// 1. Generate custom meal plan based on body parameters and objective
app.post("/api/patients/:id/mealplans/generate", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID de paciente inválido" });

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

    // Fetch latest evaluation for fallback anthropometric metrics
    const latestEval = await prisma.evaluation.findFirst({
      where: { patientId },
      orderBy: { date: "desc" }
    });

    const {
      weight = latestEval ? latestEval.weight : 70,
      height = latestEval ? latestEval.height : 170,
      age = latestEval ? latestEval.age : 30,
      gender = patient.gender || "male",
      goal = "maintenance",
      activityLevel = 1.55,
      formula = latestEval && latestEval.bodyFat > 0 ? "katch_mcardle" : "mifflin_st_jeor",
      bodyFat = latestEval ? latestEval.bodyFat : 15,
      proteinFactor = 2.2,
      fatFactor = 0.8
    } = req.body;

    const plan = generateMealPlan({
      weight: parseFloat(weight),
      height: parseFloat(height),
      age: parseInt(age, 10),
      gender,
      goal,
      activityLevel: parseFloat(activityLevel),
      formula,
      bodyFat: parseFloat(bodyFat),
      proteinFactor: parseFloat(proteinFactor),
      fatFactor: parseFloat(fatFactor)
    });

    res.json(plan);
  } catch (error) {
    console.error("Error generating meal plan:", error);
    res.status(500).json({ error: "Error al generar el plan de alimentación personalizado" });
  }
});

// 1b. Generate custom meal plan via Gemini AI
app.post("/api/patients/:id/mealplans/generate-ai", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID de paciente inválido" });

    // Check subscription plan limits for AI Diet Generation
    if (req.user.role !== "admin") {
      const trainer = await prisma.patient.findUnique({ where: { id: req.user.id } });
      if (trainer && (trainer.planType || "free") === "free") {
        return res.status(403).json({ error: "La generación de dietas y macros por IA es exclusiva para planes Profesional y Elite. Actualiza tu membresía para desbloquear esta función." });
      }
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

    // Fetch latest evaluation for fallback anthropometric metrics
    const latestEval = await prisma.evaluation.findFirst({
      where: { patientId },
      orderBy: { date: "desc" }
    });

    const {
      weight = latestEval ? latestEval.weight : 70,
      height = latestEval ? latestEval.height : 170,
      age = latestEval ? latestEval.age : 30,
      gender = patient.gender || "male",
      goal = "maintenance",
      activityLevel = 1.55,
      bodyFat = latestEval ? latestEval.bodyFat : 15
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Clave de API de Gemini no configurada en el servidor" });
    }

    // Call Gemini to generate a scientific nutrition plan
    const systemPrompt = `
You are an expert sports nutritionist and dietician.
Create a customized meal plan and daily caloric/macro target for an athlete based on their body metrics, gender, goal, and activity level.

Goals:
- "hypertrophy" (muscle gain, protein 2.2g/kg, slight calorie surplus)
- "fat_loss" (fat reduction, protein 2.3-2.5g/kg, safe calorie deficit)
- "strength" (power output, balanced macros, calorie surplus/maintenance)
- "endurance" (cardio efficiency, higher carb ratio, calorie maintenance)
- "maintenance" (stability, standard macro ratio)

Calculate the perfect TDEE and target macronutrient split. Then, devise a daily meal outline (Desayuno, Almuerzo, Merienda, Cena) with actual whole-food suggestions, avoiding clean/unrealistic diets (use standard healthy Latin American ingredients like rice, eggs, chicken, avocado, arepa, etc.).
Also calculate daily hydration targets in liters.

You must return ONLY a raw JSON object with the following structure (do NOT wrap it in markdown code blocks or any prose):
{
  "calories": 2500,
  "protein": 150,
  "carbs": 300,
  "fat": 70,
  "planJson": {
    "desayuno": "Detalle de los alimentos recomendados para desayunar...",
    "almuerzo": "Detalle de los alimentos recomendados para almorzar...",
    "merienda": "Detalle de la merienda recomendada...",
    "cena": "Detalle de la cena recomendada...",
    "hidratacion": "Cantidad en litros recomendada por día...",
    "motivoMetabolico": "Explicación metabólica y científica del porqué de estos macros según su somatotipo y objetivo..."
  }
}
`;

    const userPrompt = `
Generate a nutritional plan for:
- Name: ${patient.name}
- Gender: ${gender}
- Age: ${age} years old
- Height: ${height} cm
- Weight: ${weight} kg
- Body Fat: ${bodyFat}%
- Physical Activity Factor: ${activityLevel}
- Athletic Goal: ${goal}
`;

    const payload = {
      contents: [{
        parts: [{ text: userPrompt }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text.trim());
    res.json(parsed);

  } catch (error) {
    console.error("Error generating AI diet:", error);
    res.status(500).json({ error: "Error al generar el plan de alimentación con Inteligencia Artificial" });
  }
});

// 2. Save meal plan to Database
app.post("/api/patients/:id/mealplans", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID de paciente inválido" });

    const { name, goal, calories, protein, carbs, fat, planJson } = req.body;

    if (!name || !goal || !calories || !planJson) {
      return res.status(400).json({ error: "Nombre, objetivo, calorías y datos del plan son requeridos" });
    }

    // Deactivate previous meal plans for this patient
    await prisma.mealPlan.updateMany({
      where: { patientId },
      data: { isActive: false }
    });

    // Create the new active meal plan
    const createdPlan = await prisma.mealPlan.create({
      data: {
        patientId,
        name,
        goal,
        calories: parseInt(calories, 10),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        planJson: typeof planJson === "string" ? planJson : JSON.stringify(planJson),
        isActive: true
      }
    });

    res.status(201).json(createdPlan);
  } catch (error) {
    console.error("Error saving meal plan:", error);
    res.status(500).json({ error: "Error al guardar el plan de alimentación" });
  }
});

// 3. Get active meal plan
app.get("/api/patients/:id/mealplans/active", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID de paciente inválido" });

    const activePlan = await prisma.mealPlan.findFirst({
      where: { patientId, isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (!activePlan) {
      return res.status(404).json({ error: "No hay un plan de alimentación activo registrado para este paciente" });
    }

    res.json({
      ...activePlan,
      planJson: JSON.parse(activePlan.planJson)
    });
  } catch (error) {
    console.error("Error fetching active meal plan:", error);
    res.status(500).json({ error: "Error al obtener el plan activo" });
  }
});

// 4. Get all meal plans
app.get("/api/patients/:id/mealplans", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID de paciente inválido" });

    const plans = await prisma.mealPlan.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    });

    const parsedPlans = plans.map(p => ({
      ...p,
      planJson: JSON.parse(p.planJson)
    }));

    res.json(parsedPlans);
  } catch (error) {
    console.error("Error fetching meal plans list:", error);
    res.status(500).json({ error: "Error al obtener el historial de planes" });
  }
});

// 4b. Delete a specific meal plan
app.delete("/api/mealplans/:id", async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) return res.status(400).json({ error: "ID de plan inválido" });

    const plan = await prisma.mealPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan de alimentación no encontrado" });
    }

    await prisma.mealPlan.delete({
      where: { id: planId }
    });

    res.json({ message: "Plan de alimentación eliminado con éxito" });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    res.status(500).json({ error: "Error al eliminar el plan de alimentación" });
  }
});

// 4c. Set a specific meal plan as active (cambiar el plan activo o su objetivo)
app.post("/api/mealplans/:id/active", async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    if (isNaN(planId)) return res.status(400).json({ error: "ID de plan inválido" });

    const plan = await prisma.mealPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan de alimentación no encontrado" });
    }

    // Deactivate all plans for this patient
    await prisma.mealPlan.updateMany({
      where: { patientId: plan.patientId },
      data: { isActive: false }
    });

    // Activate this specific plan
    const updatedPlan = await prisma.mealPlan.update({
      where: { id: planId },
      data: { isActive: true }
    });

    res.json(updatedPlan);
  } catch (error) {
    console.error("Error activating meal plan:", error);
    res.status(500).json({ error: "Error al activar el plan de alimentación" });
  }
});

// --- TRAINER DASHBOARD CENTRAL ENDPOINT ---
app.get("/api/trainer/dashboard", async (req, res) => {
  try {
    const trainerId = req.user.id;

    // Get all athlete IDs under this trainer
    const athletes = await prisma.patient.findMany({
      where: { creatorId: trainerId },
      select: { id: true, name: true }
    });
    const athleteIds = athletes.map(a => a.id);

    // 1. Stats
    const totalAthletes = athletes.length;

    const activeCycles = await prisma.supplementCycle.count({
      where: { patientId: { in: athleteIds } }
    });

    const postureJobs = await prisma.postureAnalysisJob.count({
      where: { patientId: { in: athleteIds } }
    });

    // Get low stock alerts
    const allSupplements = await prisma.supplementCycle.findMany({
      where: { patientId: { in: athleteIds } },
      select: {
        id: true,
        name: true,
        stockRemaining: true,
        patient: { select: { name: true } }
      }
    });

    const lowStockSupplements = allSupplements.filter(s => s.stockRemaining !== null && s.stockRemaining <= 20);
    const lowStockAlerts = lowStockSupplements.length;

    // 2. Build Alerts List
    const alertsList = [];
    for (const s of lowStockSupplements) {
      alertsList.push({
        id: `stock-${s.id}`,
        type: "warning",
        text: `Stock bajo para ${s.name} de ${s.patient.name} (${s.stockRemaining} unidades restantes).`
      });
    }

    // Add general alert if no athletes
    if (totalAthletes === 0) {
      alertsList.push({
        id: "no-athletes",
        type: "info",
        text: "Aún no has registrado ningún atleta. Comienza registrando tu primer atleta."
      });
    }

    // 3. Recent Activity (latest evaluations & cycles & training plans)
    const evals = await prisma.evaluation.findMany({
      where: { patientId: { in: athleteIds } },
      orderBy: { date: "desc" },
      take: 3,
      include: { patient: { select: { name: true } } }
    });

    const plans = await prisma.trainingPlan.findMany({
      where: { patientId: { in: athleteIds } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { patient: { select: { name: true } } }
    });

    const activities = [];
    for (const e of evals) {
      activities.push({
        type: "eval",
        text: `Nueva evaluación registrada para ${e.patient.name} (${e.weight} kg, ${e.bodyFat}% grasa).`,
        date: e.date
      });
    }
    for (const p of plans) {
      activities.push({
        type: "plan",
        text: `Se actualizó el plan de entrenamiento "${p.name}" de ${p.patient.name}.`,
        date: p.createdAt.toISOString().split("T")[0]
      });
    }

    // Sort activities by date descending
    activities.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      stats: {
        totalAthletes,
        activeCycles,
        postureJobs,
        lowStockAlerts
      },
      alerts: alertsList,
      recentActivity: activities.slice(0, 5)
    });
  } catch (error) {
    console.error("Error fetching trainer dashboard:", error);
    res.status(500).json({ error: "Error al obtener el dashboard del entrenador" });
  }
});


// --- TRAINER SUBSCRIPTION & BILLING ROUTES ---
app.get("/api/trainer/subscription", async (req, res) => {
  try {
    const trainerId = req.user.id;
    const trainer = await prisma.patient.findUnique({
      where: { id: trainerId },
      select: {
        id: true,
        name: true,
        email: true,
        planType: true,
        subActive: true,
        subExpiresAt: true,
      }
    });

    if (!trainer) {
      return res.status(404).json({ error: "Entrenador no encontrado" });
    }

    const count = await prisma.patient.count({ where: { creatorId: trainerId } });
    const plan = trainer.planType || "free";
    const limit = plan === "free" ? 1 : plan === "pro" ? 30 : 999999;

    res.json({
      planType: plan,
      subActive: trainer.subActive,
      subExpiresAt: trainer.subExpiresAt,
      athletesCount: count,
      athletesLimit: limit
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({ error: "Error al obtener detalles de la suscripción" });
  }
});

app.post("/api/trainer/subscription/checkout", async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { planType } = req.body; // "free", "pro", or "elite"

    if (!["free", "pro", "elite"].includes(planType)) {
      return res.status(400).json({ error: "Tipo de plan inválido" });
    }

    const expiryDate = planType === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const updatedTrainer = await prisma.patient.update({
      where: { id: trainerId },
      data: {
        planType,
        subActive: true,
        subExpiresAt: expiryDate
      }
    });

    res.json({
      message: `Plan actualizado exitosamente a ${planType.toUpperCase()}`,
      planType: updatedTrainer.planType,
      subActive: updatedTrainer.subActive,
      subExpiresAt: updatedTrainer.subExpiresAt
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).json({ error: "Error al actualizar la suscripción" });
  }
});

app.get("/api/products/recommended", async (req, res) => {
  try {
    const { category, region, athleteId } = req.query;
    
    // Determine the relevant trainer/creator ID
    let trainerId = null;
    if (req.user) {
      if (req.user.role === "admin") {
        trainerId = null;
      } else {
        const userRecord = await prisma.patient.findUnique({ where: { id: req.user.id } });
        if (userRecord) {
          trainerId = userRecord.creatorId || userRecord.id;
        } else {
          trainerId = req.user.id;
        }
      }
    } else if (athleteId) {
      const athlete = await prisma.patient.findUnique({ where: { id: parseInt(athleteId) } });
      if (athlete) {
        trainerId = athlete.creatorId;
      }
    }

    // Fetch hidden product IDs for this trainer
    let hiddenProductIds = [];
    if (trainerId) {
      const hidden = await prisma.trainerHiddenProduct.findMany({
        where: { trainerId }
      });
      hiddenProductIds = hidden.map(h => h.productId);
    }

    // Fetch products:
    // If trainerId is null (e.g. admin or no trainer context), get all global products (creatorId: null)
    // Else, get global products NOT hidden by trainer, plus custom products by this trainer
    const products = await prisma.recommendedProduct.findMany({
      where: {
        OR: [
          {
            creatorId: null,
            id: { notIn: hiddenProductIds }
          },
          ...(trainerId ? [{ creatorId: trainerId }] : [])
        ]
      }
    });

    let filtered = products;
    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (region) {
      filtered = filtered.filter(p => p.region.toLowerCase().includes(String(region).toLowerCase()));
    }

    res.json(filtered);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    res.status(500).json({ error: "Error al obtener la lista de productos recomendados" });
  }
});

// 5b. Add a new recommended product with image upload and Supabase backup
app.post("/api/products/recommended", uploadCalorie.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      const trainer = await prisma.patient.findUnique({ where: { id: req.user.id } });
      if (trainer && (trainer.planType || "free") === "free") {
        return res.status(403).json({ error: "El plan Semilla (Gratuito) no permite agregar suplementos personalizados. Actualiza a un plan superior para desbloquear esta función." });
      }
    }

    const { name, category, region, isLocalStore, purchaseLink, description } = req.body;
    const file = req.file;

    if (!name || !category || !description) {
      return res.status(400).json({ error: "El nombre, categoría y descripción son obligatorios" });
    }

    let imagePath = null;
    if (file) {
      imagePath = `/uploads/${file.filename}`;
      try {
        const fileData = fs.readFileSync(file.path);
        await prisma.uploadedFile.create({
          data: {
            filename: file.filename,
            mimeType: file.mimetype,
            data: fileData.toString("base64")
          }
        });
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Error backing up product image to database:", err);
      }
    }

    // The creator is the logged-in coach (or null if admin)
    const creatorId = req.user.role === "admin" ? null : req.user.id;

    const newProduct = await prisma.recommendedProduct.create({
      data: {
        name,
        category,
        region: region || "Colombia",
        isLocalStore: isLocalStore === "true" || isLocalStore === true,
        purchaseLink: purchaseLink || "",
        description,
        imagePath,
        creatorId
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error adding recommended product:", error);
    res.status(500).json({ error: "Error al registrar el producto recomendado" });
  }
});

// 5c. Hide a global recommended product for a trainer
app.post("/api/trainer/products/:id/hide", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const trainerId = req.user.id;
    
    if (isNaN(productId)) return res.status(400).json({ error: "ID de producto inválido" });

    await prisma.trainerHiddenProduct.upsert({
      where: {
        trainerId_productId: { trainerId, productId }
      },
      create: { trainerId, productId },
      update: {}
    });

    res.json({ message: "Producto ocultado exitosamente" });
  } catch (error) {
    console.error("Error hiding product:", error);
    res.status(500).json({ error: "Error al ocultar el producto" });
  }
});

// 5d. Show (unhide) a global recommended product for a trainer
app.post("/api/trainer/products/:id/show", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const trainerId = req.user.id;

    if (isNaN(productId)) return res.status(400).json({ error: "ID de producto inválido" });

    await prisma.trainerHiddenProduct.deleteMany({
      where: { trainerId, productId }
    });

    res.json({ message: "Producto visible nuevamente" });
  } catch (error) {
    console.error("Error showing product:", error);
    res.status(500).json({ error: "Error al mostrar el producto" });
  }
});

// 5e. Delete a custom product created by a trainer
app.delete("/api/trainer/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const trainerId = req.user.id;

    if (isNaN(productId)) return res.status(400).json({ error: "ID de producto inválido" });

    // Ensure the product belongs to this trainer
    const product = await prisma.recommendedProduct.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    if (product.creatorId !== trainerId && req.user.role !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }

    await prisma.recommendedProduct.delete({ where: { id: productId } });
    res.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting trainer product:", error);
    res.status(500).json({ error: "Error al eliminar el producto personalizado" });
  }
});


// --- TRAINER EXERCISE LIBRARY ROUTES ---
app.get("/api/trainer/exercises", async (req, res) => {
  try {
    const trainerId = req.user.id;

    // Load global templates
    const templatesPath = path.join(process.cwd(), "trainingTemplates.json");
    let globalExercises = [];
    if (fs.existsSync(templatesPath)) {
      try {
        const templateData = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
        const list = [];
        for (const key of Object.keys(templateData.days)) {
          for (const ex of templateData.days[key]) {
            list.push({
              name: ex.name,
              muscleGroup: ex.muscleGroup === "arms" ? "arms, triceps, biceps" : (ex.muscleGroup === "legs" ? "legs, quads, glutes" : ex.muscleGroup === "chest" ? "chest, triceps" : ex.muscleGroup === "back" ? "back, lats" : ex.muscleGroup),
              videoUrl: ex.videoUrl || "",
              technique: ex.technique || "",
              notes: ex.notes || "",
              isCustom: false
            });
          }
        }
        
        // Deduplicate
        const seen = new Set();
        for (const ex of list) {
          const norm = ex.name.trim().toUpperCase();
          if (!seen.has(norm)) {
            seen.add(norm);
            globalExercises.push(ex);
          }
        }
      } catch (err) {
        console.error("Error parsing trainingTemplates.json:", err);
      }
    }

    // Get hidden global exercise names
    const hidden = await prisma.trainerHiddenExercise.findMany({
      where: { trainerId }
    });
    const hiddenNames = new Set(hidden.map(h => h.exerciseName.trim().toUpperCase()));

    // Mark globals as hidden/visible
    const globalsWithStatus = globalExercises.map(ex => ({
      ...ex,
      hidden: hiddenNames.has(ex.name.trim().toUpperCase())
    }));

    // Get custom exercises
    const customs = await prisma.customExercise.findMany({
      where: { trainerId }
    });

    const mappedCustoms = customs.map(c => ({
      id: c.id,
      name: c.name,
      muscleGroup: c.muscleGroup,
      videoUrl: c.videoUrl || "",
      technique: c.technique || "",
      notes: c.notes || "",
      isCustom: true,
      hidden: false
    }));

    res.json({
      globals: globalsWithStatus,
      customs: mappedCustoms
    });
  } catch (error) {
    console.error("Error fetching trainer exercise library:", error);
    res.status(500).json({ error: "Error al obtener la biblioteca de ejercicios" });
  }
});

app.post("/api/trainer/exercises", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      const trainer = await prisma.patient.findUnique({ where: { id: req.user.id } });
      if (trainer && (trainer.planType || "free") === "free") {
        return res.status(403).json({ error: "El plan Semilla (Gratuito) no permite agregar ejercicios personalizados. Actualiza a un plan superior para desbloquear esta función." });
      }
    }

    const trainerId = req.user.id;
    const { name, muscleGroup, videoUrl, technique, notes } = req.body;

    if (!name || !muscleGroup) {
      return res.status(400).json({ error: "El nombre y el grupo muscular son obligatorios" });
    }

    const custom = await prisma.customExercise.create({
      data: {
        trainerId,
        name,
        muscleGroup,
        videoUrl: videoUrl || "",
        technique: technique || "",
        notes: notes || ""
      }
    });

    res.status(201).json(custom);
  } catch (error) {
    console.error("Error creating custom exercise:", error);
    res.status(500).json({ error: "Error al registrar el ejercicio personalizado" });
  }
});

app.delete("/api/trainer/exercises/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const trainerId = req.user.id;

    if (isNaN(id)) return res.status(400).json({ error: "ID de ejercicio inválido" });

    const exercise = await prisma.customExercise.findUnique({ where: { id } });
    if (!exercise) return res.status(404).json({ error: "Ejercicio no encontrado" });

    if (exercise.trainerId !== trainerId && req.user.role !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para eliminar este ejercicio" });
    }

    await prisma.customExercise.delete({ where: { id } });
    res.json({ message: "Ejercicio personalizado eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting custom exercise:", error);
    res.status(500).json({ error: "Error al eliminar el ejercicio personalizado" });
  }
});

app.post("/api/trainer/exercises/hide", async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { exerciseName } = req.body;

    if (!exerciseName) return res.status(400).json({ error: "El nombre del ejercicio es requerido" });

    await prisma.trainerHiddenExercise.upsert({
      where: {
        trainerId_exerciseName: { trainerId, exerciseName }
      },
      create: { trainerId, exerciseName },
      update: {}
    });

    res.json({ message: "Ejercicio global ocultado exitosamente" });
  } catch (error) {
    console.error("Error hiding exercise:", error);
    res.status(500).json({ error: "Error al ocultar el ejercicio" });
  }
});

app.post("/api/trainer/exercises/show", async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { exerciseName } = req.body;

    if (!exerciseName) return res.status(400).json({ error: "El nombre del ejercicio es requerido" });

    await prisma.trainerHiddenExercise.deleteMany({
      where: { trainerId, exerciseName }
    });

    res.json({ message: "Ejercicio global visible nuevamente" });
  } catch (error) {
    console.error("Error showing exercise:", error);
    res.status(500).json({ error: "Error al mostrar el ejercicio" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING PLANS — CRUD

// GET /api/patients/:id/training-plans — list all plans for a patient
app.get("/api/patients/:id/training-plans", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) return res.status(400).json({ error: "ID inválido" });

    const plans = await prisma.trainingPlan.findMany({
      where: { patientId },
      include: {
        days: {
          include: { exercises: { orderBy: { order: "asc" } } },
          orderBy: { dayIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(plans);
  } catch (error) {
    console.error("Error fetching training plans:", error);
    res.status(500).json({ error: "Error al obtener los planes" });
  }
});

// POST /api/patients/:id/training-plans — create a new plan
app.post("/api/patients/:id/training-plans", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const { name, goal, daysPerWeek } = req.body;

    if (!name || !goal) return res.status(400).json({ error: "Nombre y objetivo son requeridos" });

    // Fetch patient info
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (req.user.role !== "admin" && patient && patient.creatorId) {
      const trainer = await prisma.patient.findUnique({ where: { id: patient.creatorId } });
      if (trainer && (trainer.planType || "free") === "free") {
        return res.status(403).json({ error: "La generación de rutinas por IA (Gemini) es exclusiva para planes Profesional y Elite. Actualiza tu cuenta para habilitarla." });
      }
    }

    const latestEval = await prisma.evaluation.findFirst({
      where: { patientId },
      orderBy: { date: "desc" }
    });

    const patientInfo = {
      name: patient?.name || "Athlete",
      gender: patient?.gender || "Not specified",
      sport: patient?.sport || "General fitness",
      weight: latestEval ? latestEval.weight : 70,
      bodyFat: latestEval ? latestEval.bodyFat : 15
    };

    // Fetch trainer customization if applicable
    let hiddenExercises = [];
    let customExercises = [];
    if (patient && patient.creatorId) {
      const trainerId = patient.creatorId;
      const hidden = await prisma.trainerHiddenExercise.findMany({
        where: { trainerId }
      });
      hiddenExercises = hidden.map(h => h.exerciseName);

      const customs = await prisma.customExercise.findMany({
        where: { trainerId }
      });
      customExercises = customs.map(c => ({
        name: c.name,
        muscleGroup: c.muscleGroup,
        videoUrl: c.videoUrl || "",
        technique: c.technique || "",
        notes: c.notes || ""
      }));
    }

    // Generate training plan via AI (or fallback to simulator)
    const generatedDays = await generateTrainingPlanWithAI({ 
      goal, 
      planName: name, 
      patientInfo, 
      daysPerWeek: daysPerWeek ? parseInt(daysPerWeek) : 4,
      hiddenExercises,
      customExercises
    });

    // Deactivate previous plans
    await prisma.trainingPlan.updateMany({
      where: { patientId },
      data: { isActive: false },
    });

    // Prepare nested create day objects
    const daysCreateInput = (generatedDays || []).map((day) => ({
      dayIndex: day.dayIndex,
      name: day.name,
      muscleGroup: day.muscleGroup,
      exercises: {
        create: (day.exercises || []).map((ex, idx) => ({
          name: ex.name,
          sets: ex.sets || 3,
          reps: String(ex.reps || "8-12"),
          weight: (ex.weight !== undefined && ex.weight !== null && !isNaN(parseFloat(ex.weight))) ? parseFloat(ex.weight) : null,
          muscleGroup: ex.muscleGroup || day.muscleGroup,
          order: idx,
          videoUrl: ex.videoUrl || null,
          technique: ex.technique || null,
          notes: ex.notes || null,
          rest: ex.rest || null,
          rir: ex.rir || null,
          alternatives: ex.alternatives ? (typeof ex.alternatives === "string" ? ex.alternatives : JSON.stringify(ex.alternatives)) : null
        }))
      }
    }));

    const plan = await prisma.trainingPlan.create({
      data: {
        patientId,
        name,
        goal,
        daysPerWeek: daysPerWeek || 4,
        isActive: true,
        days: {
          create: daysCreateInput
        }
      },
      include: {
        days: {
          include: {
            exercises: {
              orderBy: { order: "asc" }
            }
          },
          orderBy: { dayIndex: "asc" }
        }
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating training plan:", error);
    res.status(500).json({ error: "Error al crear el plan con generación automática" });
  }
});

// DELETE /api/training-plans/:id
app.delete("/api/training-plans/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.trainingPlan.delete({ where: { id } });
    res.json({ message: "Plan eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el plan" });
  }
});

// POST /api/training-exercises/:id/swap — Swap an exercise for one of its alternatives
app.post("/api/training-exercises/:id/swap", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID de ejercicio inválido" });

    const { alternativeName, alternativeVideoUrl } = req.body;
    if (!alternativeName) return res.status(400).json({ error: "El nombre de la alternativa es requerido" });

    // Fetch the current exercise
    const exercise = await prisma.trainingExercise.findUnique({ where: { id } });
    if (!exercise) return res.status(404).json({ error: "Ejercicio no encontrado" });

    // Parse the current alternatives
    let alts = [];
    if (exercise.alternatives) {
      try {
        alts = JSON.parse(exercise.alternatives);
      } catch (err) {
        alts = [];
      }
    }

    // Add current exercise state to alternatives (so the user can swap back!)
    const updatedAlts = [
      ...alts.filter(a => a.name.toLowerCase() !== alternativeName.toLowerCase()),
      { name: exercise.name, videoUrl: exercise.videoUrl || "" }
    ];

    const updated = await prisma.trainingExercise.update({
      where: { id },
      data: {
        name: alternativeName,
        videoUrl: alternativeVideoUrl || "",
        alternatives: JSON.stringify(updatedAlts)
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error swapping exercise:", error);
    res.status(500).json({ error: "Error al intercambiar el ejercicio por su alternativa" });
  }
});

// POST /api/training-days — create or update a training day
app.post("/api/training-days", async (req, res) => {
  try {
    const { planId, dayIndex, name, muscleGroup } = req.body;

    // Upsert by planId + dayIndex
    const existing = await prisma.trainingDay.findFirst({
      where: { planId, dayIndex },
    });

    let day;
    if (existing) {
      day = await prisma.trainingDay.update({
        where: { id: existing.id },
        data: { name, muscleGroup },
        include: { exercises: { orderBy: { order: "asc" } } },
      });
    } else {
      day = await prisma.trainingDay.create({
        data: { planId, dayIndex, name, muscleGroup },
        include: { exercises: { orderBy: { order: "asc" } } },
      });
    }

    res.status(201).json(day);
  } catch (error) {
    console.error("Error creating training day:", error);
    res.status(500).json({ error: "Error al crear/actualizar el día" });
  }
});

// POST /api/training-days/:dayId/exercises — add exercise to a day
app.post("/api/training-days/:dayId/exercises", async (req, res) => {
  try {
    const dayId = parseInt(req.params.dayId);
    const { name, sets, reps, weight, muscleGroup, order } = req.body;

    const countExisting = await prisma.trainingExercise.count({ where: { dayId } });

    const exercise = await prisma.trainingExercise.create({
      data: {
        dayId,
        name,
        sets: sets || 3,
        reps: reps || "8-12",
        weight: (weight !== undefined && weight !== null && !isNaN(parseFloat(weight))) ? parseFloat(weight) : null,
        muscleGroup: muscleGroup || "full_body",
        order: order !== undefined ? order : countExisting,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: "Error al añadir el ejercicio" });
  }
});

// DELETE /api/training-exercises/:id
app.delete("/api/training-exercises/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.trainingExercise.delete({ where: { id } });
    res.json({ message: "Ejercicio eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el ejercicio" });
  }
});

// GET /api/patients/:id/exercise-logs — logs for current week
app.get("/api/patients/:id/exercise-logs", async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    // Get all exercise IDs for this patient
    const plans = await prisma.trainingPlan.findMany({
      where: { patientId },
      include: { days: { include: { exercises: { select: { id: true } } } } },
    });

    const exerciseIds = plans.flatMap((p) =>
      p.days.flatMap((d) => d.exercises.map((e) => e.id))
    );

    // Get logs from the last 14 days
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const sinceStr = since.toISOString().split("T")[0];

    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        date: { gte: sinceStr },
      },
      orderBy: { date: "desc" },
    });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching exercise logs:", error);
    res.status(500).json({ error: "Error al obtener los registros" });
  }
});

// POST /api/exercise-logs — log a completed exercise
app.post("/api/exercise-logs", async (req, res) => {
  try {
    const { exerciseId, date, completed, actualSets, actualReps, actualWeight } = req.body;

    const log = await prisma.exerciseLog.create({
      data: {
        exerciseId,
        date: date || new Date().toISOString().split("T")[0],
        completed: completed !== undefined ? completed : true,
        actualSets: actualSets || null,
        actualReps: actualReps || null,
        actualWeight: (actualWeight !== undefined && actualWeight !== null && !isNaN(parseFloat(actualWeight))) ? parseFloat(actualWeight) : null,
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating exercise log:", error);
    res.status(500).json({ error: "Error al registrar el ejercicio" });
  }
});

// PATCH /api/exercise-logs/:id — update log (toggle completed, weight etc)
app.patch("/api/exercise-logs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completed, actualWeight, actualSets, actualReps } = req.body;

    const log = await prisma.exerciseLog.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(actualWeight !== undefined && { actualWeight: (actualWeight !== null && !isNaN(parseFloat(actualWeight))) ? parseFloat(actualWeight) : null }),
        ...(actualSets !== undefined && { actualSets }),
        ...(actualReps !== undefined && { actualReps }),
      },
    });

    res.json(log);
  } catch (error) {
    console.error("Error updating exercise log:", error);
    res.status(500).json({ error: "Error al actualizar el registro" });
  }
});


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
