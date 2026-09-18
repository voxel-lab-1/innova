import { PrismaClient } from "@prisma/client";

const regions = [
  "aws-0-us-west-2",
  "aws-0-us-east-1",
  "aws-0-sa-east-1",
  "aws-0-eu-central-1",
  "aws-0-ap-southeast-1"
];

const pass = "Apolo2905*1";
const project = "wfllpyxluxzeprioavsm";

async function testPoolers() {
  for (const reg of regions) {
    const poolerUrl = `postgresql://postgres.${project}:${pass}@${reg}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    console.log(`\nTesting pooler domain [${reg}]...`);
    const prisma = new PrismaClient({
      datasources: {
        db: { url: poolerUrl }
      }
    });
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log(`🎉 SUCCESS! Connected to pooler [${reg}]!`, result);
      
      const newAthlete = await prisma.patient.create({
        data: {
          name: "Test Athlete",
          birthdate: "2001-01-11",
          gender: "male",
          sport: "Pérdida de grasa"
        }
      });
      console.log("🎉 CREATE PATIENT SUCCESSFUL! ID:", newAthlete.id);
      await prisma.patient.delete({ where: { id: newAthlete.id } });
      await prisma.$disconnect();
      return poolerUrl;
    } catch (err) {
      console.error(`❌ FAILED [${reg}]:`, err.message.split("\n")[0]);
    } finally {
      await prisma.$disconnect();
    }
  }
}

testPoolers();
