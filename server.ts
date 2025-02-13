import express, { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { PythonShell } from "python-shell";

const app = express();

// Python interpreter
const PYTHON_PATH = path.join(__dirname, "..", ".venv", "bin", "python3");
// The face_recognition script
const SCRIPT_PATH = path.join(__dirname, "..", "face_rec.py");
// Face match threshold
const MATCH_THRESHOLD = 0.6;

// Allowed extensions: you can add or remove as needed
const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".heic",
  ".gif",
  ".bmp",
  ".webp"
];

app.get("/compare-faces", async (req: Request, res: Response) => {
  try {
    const selfieUrl = req.query.selfie_url as string;
    const eventUrl = req.query.image_url as string;

    console.log([selfieUrl, eventUrl]);

    if (!selfieUrl || !eventUrl) {
      return res
        .status(400)
        .json({ error: "Please provide selfie_url and image_url" });
    }

    // 1) Validate the extension
    if (!isValidImageExtension(selfieUrl) || !isValidImageExtension(eventUrl)) {
      return res
        .status(400)
        .json({ error: "Invalid image extension. Must be png/jpg/heic, etc." });
    }

    // 2) Validate the content type with a HEAD request
    // const isSelfieValid = await isValidImageContentType(selfieUrl);
    // const isEventValid = await isValidImageContentType(eventUrl);

    // if (!isSelfieValid || !isEventValid) {
    //   return res.status(400).json({
    //     error: "Content-Type is not an image or HEAD request failed."
    //   });
    // }

    // 3) Download the images to temp files
    const tempSelfiePath = await downloadImageToTempFile(selfieUrl, "selfie");
    const tempEventPath = await downloadImageToTempFile(eventUrl, "event");

    // 4) Run the Python script
    const results = await PythonShell.run(SCRIPT_PATH, {
      pythonPath: PYTHON_PATH,
      args: [tempSelfiePath, tempEventPath]
    });

    // 5) Clean up temp files
    fs.unlinkSync(tempSelfiePath);
    fs.unlinkSync(tempEventPath);

    // 6) Check Python output
    if (!results || results.length === 0) {
      return res.status(500).send("No output from Python");
    }
    const output = results[0];
    console.log("Python Output:", output);

    if (output === "NO_SELFIE") {
      return res.send("No face found in the selfie image");
    } else if (output === "NO_COMPARE") {
      return res.send("No face found in the event image");
    }

    // 7) Parse distance & respond
    const distance = parseFloat(output);
    const isMatch = distance < MATCH_THRESHOLD;
    return res.json({ distance, isMatch });
  } catch (error) {
    console.error("Error in /compare-faces:", error);
    return res.status(500).send("Error processing request");
  }
});

/**
 * Checks if the URL ends with a known valid image extension.
 */
function isValidImageExtension(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext));
}

/**
 * HEAD request to confirm the remote file's Content-Type is an image.
 */
async function isValidImageContentType(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      method: "GET",
      responseType: "stream",
      maxContentLength: 0,
      maxBodyLength: 0,
      headers: { Range: "bytes=0-0" } // ask only for the first byte
    });
    const contentType = response.headers["content-type"];
    // We only downloaded 1 byte, but we have the headers
    return contentType && contentType.startsWith("image/");
  } catch (err) {
    console.error("Partial GET request failed:", err);
    return false;
  }
}

/**
 * Download the image from `imageUrl` and save it to a temp file.
 */
async function downloadImageToTempFile(
  imageUrl: string,
  prefix: string
): Promise<string> {
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer"
  });
  const tempFilePath = path.join(os.tmpdir(), `${prefix}-${Date.now()}.jpg`);
  fs.writeFileSync(tempFilePath, Buffer.from(response.data));
  return tempFilePath;
}

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
