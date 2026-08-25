import prisma from './database.js';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing DB connection...");
try {
  const count = await prisma.patient.count();
  console.log("Connection successful! Patient count:", count);
} catch (error) {
  console.error("Failed to connect to the database:", error);
} finally {
  await prisma.$disconnect();
}
