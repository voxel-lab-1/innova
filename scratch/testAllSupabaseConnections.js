import { PrismaClient } from "@prisma/client";

const testCombinations = [
  // 1. Direct DB combinations
  { name: "Direct 1", url: "postgresql://postgres:Apolo2905*1@db.wfllpyxluxzeprioavsm.supabase.co:5432/postgres?sslmode=require" },
  { name: "Direct 2", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@db.wfllpyxluxzeprioavsm.supabase.co:5432/postgres?sslmode=require" },
  
  // 2. Pooler combinations (Port 6543)
  { name: "Pooler 6543 (US-West-2)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
  { name: "Pooler 6543 (US-East-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
  { name: "Pooler 6543 (SA-East-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
  { name: "Pooler 6543 (EU-Central-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require" },
  
  // 3. Pooler combinations (Port 5432)
  { name: "Pooler 5432 (US-West-2)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require" },
  { name: "Pooler 5432 (US-East-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" },
  { name: "Pooler 5432 (SA-East-1)", url: "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require" },
];

async function runTests() {
  console.log("Starting comprehensive Supabase connection testing...");
  for (const item of testCombinations) {
    console.log(`\nTesting: ${item.name} ...`);
    const prisma = new PrismaClient({
      datasources: {
        db: { url: item.url }
      }
    });
    try {
      const count = await prisma.patient.count();
      console.log(`🎉 WORKING CONNECTION FOUND! [${item.name}] Total patients:`, count);
      console.log(`SUCCESS URL: "${item.url}"`);
      await prisma.$disconnect();
      return item.url;
    } catch (err) {
      console.log(`❌ Failed [${item.name}]:`, err.message.split("\n")[0]);
    } finally {
      await prisma.$disconnect();
    }
  }
  console.log("\nAll network connection attempts failed.");
}

runTests();
