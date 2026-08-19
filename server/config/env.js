import "dotenv/config";

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const cloud_name = process.env.cloud_name;
const api_key = process.env.api_key;
const api_secret = process.env.api_secret;
export {
  PORT,
  DATABASE_URL,
  GOOGLE_GENAI_API_KEY,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  cloud_name,
  api_key,
  api_secret,
};
