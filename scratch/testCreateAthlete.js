import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://postgres:Apolo2905*1@db.wfllpyxluxzeprioavsm.supabase.co:5432/postgres?sslmode=require" }
  }
});

async function testCreate() {
  try {
    console.log("Testing athlete creation with verified working URL...");
    const newAthlete = await prisma.patient.create({
      data: {
        name: "Miguel Muñoz (Test)",
        birthdate: "2001-01-11",
        gender: "male",
        email: "miguel.test@zerofit.app",
        phone: "3107128776",
        sport: "Pérdida de grasa",
        creatorId: null
      }
    });
    console.log("🎉 ATHLETE CREATED SUCCESSFULLY! ID:", newAthlete.id, newAthlete.name);

    // Clean up test athlete
    await prisma.patient.delete({ where: { id: newAthlete.id } });
    console.log("Test athlete cleaned up successfully.");
  } catch (err) {
    console.error("❌ CREATE ATHLETE FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();
