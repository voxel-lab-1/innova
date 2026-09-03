import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:Apolo2905*1@db.wfllpyxluxzeprioavsm.supabase.co:5432/postgres";

let activeUrl = process.env.DATABASE_URL || directUrl;
if (!activeUrl || activeUrl.includes("pooler.supabase.com")) {
  console.log("Database: Overriding deprecated pooler URL with direct Supabase connection URL.");
  activeUrl = directUrl;
}

console.log("Prisma Client loading... DATABASE_URL active:", activeUrl.replace(/:[^:@]+@/, ":****@"));

const prisma = new PrismaClient({
  datasources: {
    db: { url: activeUrl }
  }
});

export default prisma;
