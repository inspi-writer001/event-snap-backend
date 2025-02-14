import dotenv from "dotenv";
dotenv.config();

const env = process.env;

const PINATA_APIKey = env.PINATA_APIKey;
const PINATA_APISecret = env.PINATA_APISecret;
const PINATA_JWT = env.PINATA_JWT;
const PIMLICO_APIKey = env.PIMLICO_APIKey;
const PINATA_GATEWAY = env.PINATA_GATEWAY;
const PRIVATE_KEY = env.PRIVATE_KEY;

export {
  PINATA_APIKey,
  PINATA_APISecret,
  PINATA_JWT,
  PIMLICO_APIKey,
  PINATA_GATEWAY,
  PRIVATE_KEY
};
