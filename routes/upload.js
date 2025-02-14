import express from "express";
import { agent } from "../server.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename; here we use the current timestamp and original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

uploadRouter.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const filePath = req.file.path;

    // Optional: Convert the file to a base64 string if needed
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");

    const file = await agent.create(imageBuffer);

    console.log(file);

    return res.status(200).json({
      message: "Image uploaded successfully",
      response: {
        file_id: file.fileId.toString(),
        file_hash: file.hash,
        file_portal_address: file.portalAddress
      }
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Error processing image" });
  }
});

uploadRouter.get("/get-image", async (req, res) => {
  try {
    const img_id = req.body.img_id;
    const file_details = await getFile(img_id);
    return res.status(200).json({
      message: "fetched details successfully",
      response: file_details
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching image" });
  }
});

const getFile = async (img_id) => {
  const response = await agent.getFile(img_id);

  return {
    ...response,
    url: `https://gateway.pinata.cloud/ipfs/${
      response.contentIpfsHash.split("ipfs://")[1]
    }`
  };
};

export { uploadRouter };
