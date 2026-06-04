import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { checkDeploymentReadiness, requiredDeployFiles } from "../src/lib/deployCheck.js";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
const result = checkDeploymentReadiness({
  files: new Set(requiredDeployFiles.filter((file) => existsSync(resolve(root, file)))),
  envText: existsSync(envPath) ? readFileSync(envPath, "utf8") : "",
  processEnv: process.env,
  sqlText: existsSync(resolve(root, "supabase/migrations/001_initial_schema.sql"))
    ? readFileSync(resolve(root, "supabase/migrations/001_initial_schema.sql"), "utf8")
    : "",
});

if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}

console.log(result.message);
