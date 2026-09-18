import jwt from "jsonwebtoken";

function createPatientResilient(body, user) {
  const { name, birthdate, gender, email, phone, sport } = body;
  
  let creatorId = user.role === "admin" 
    ? (body.creatorId ? parseInt(body.creatorId) : (typeof user.id === 'number' ? user.id : null)) 
    : user.id;

  const patient = {
    id: Math.floor(Math.random() * 100000) + 100,
    name,
    birthdate,
    gender,
    email: email || null,
    phone: phone || null,
    sport: sport || null,
    creatorId: typeof creatorId === 'number' ? creatorId : null,
    createdAt: new Date().toISOString()
  };

  return patient;
}

const testUser = { id: 2, role: "patient" };
const testBody = { name: "Miguel Muñoz", birthdate: "2001-01-11", gender: "male", sport: "Pérdida de grasa" };

const result = createPatientResilient(testBody, testUser);
console.log("🎉 RESILIENT ATHLETE CREATED SUCCESSFULLY:", result);
