import { PrismaClient } from "@prisma/client";

const urlsToTest = [
  { name: "Direct Connection (db.wfllpyxluxzeprioavsm.supabase.co)", url: "postgresql://postgres:Apolo2905*1@db.wfllpyxluxzeprioavsm.supabase.co:5432/postgres" },
  { name: "Pooler Port 6543 (aws-0-us-west-2)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true" },
  { name: "Pooler Port 5432 (aws-0-us-west-2)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-west-2.pooler.supabase.com:5432/postgres" },
  { name: "Pooler Port 6543 (aws-0-sa-east-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" },
  { name: "Pooler Port 6543 (aws-0-us-east-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" }
];

async function runTests() {
  for (const item of urlsToTest) {
    console.log(`\n--- Testing ${item.name} ---`);
    const prisma = new PrismaClient({
      datasources: {
        db: { url: item.url }
      }
    });
    try {
      const count = await prisma.patient.count();
      console.log(`✅ SUCCESS! ${item.name} connected. Total patients:`, count);
    } catch (err) {
      console.error(`❌ FAILED ${item.name}:`, err.message.split("\n")[0]);
    } finally {
      await prisma.$disconnect();
    }
  }
}

runTests();
