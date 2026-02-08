import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdminUser() {
  const email = "c.stahmer@outlook.com";
  const password = "b";
  const hashedPassword = await hashPassword(password);

  // Update or insert the user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    // Update existing user
    await db
      .update(users)
      .set({
        password: hashedPassword,
        forcePasswordChange: true,
      })
      .where(eq(users.email, email));
    
    console.log(`✅ Updated user: ${email}`);
    console.log(`   Password reset to: "${password}"`);
    console.log(`   Force password change: true`);
    console.log(`   User will be prompted to change password after login`);
  } else {
    // Insert new user
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name: "Connor Stahmer",
      roleOwner: true,
      roleProvider: false,
      isAdmin: true,
      forcePasswordChange: true,
    });
    
    console.log(`✅ Created new admin user: ${email}`);
    console.log(`   Password: "${password}"`);
    console.log(`   Force password change: true`);
    console.log(`   User will be prompted to change password after login`);
  }

  process.exit(0);
}

resetAdminUser().catch((error) => {
  console.error("❌ Error resetting admin user:", error);
  process.exit(1);
});
