import { PrismaClient } from "@prisma/client";

const defaultPoolerUrl = "postgresql://postgres.wfllpyxluxzeprioavsm:Apolo2905*1@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
let activeUrl = process.env.DATABASE_URL || defaultPoolerUrl;

console.log("Prisma Client loading... DATABASE_URL active:", activeUrl.replace(/:[^:@]+@/, ":****@"));

const prisma = new PrismaClient({
  datasources: {
    db: { url: activeUrl }
  }
});

export default prisma;
