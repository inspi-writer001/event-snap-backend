import express, { Request, Response } from "express";
import { PythonShell } from "python-shell";
import path from "path";

const app = express();

app.get("/compare-faces", async (req: Request, res: Response) => {
  // Hardcoded or dynamic image paths
  const scriptPath = path.join(__dirname, "../face_rec.py");
  const selfiePath = path.join(__dirname, "../emmy.jpg");
  const eventPath = path.join(__dirname, "../group_image.jpg");

  try {
    const pythonPath = path.join(__dirname, "..", ".venv", "bin", "python3");
    const results = await PythonShell.run(scriptPath, {
      args: [selfiePath, eventPath],
      pythonPath
    });

    if (!results || results.length === 0) {
      return res.status(500).send("No output from Python");
    }

    console.log(results);

    const output = results[0]; // e.g. distance or error string
    if (output === "NO_SELFIE") {
      return res.send("No face found in the selfie");
    } else if (output === "NO_COMPARE") {
      return res.send("No face found in the event image");
    }

    const distance = parseFloat(output);
    const threshold = 0.6;
    const isMatch = distance < threshold;

    res.json({ distance, isMatch });
  } catch (err) {
    if (err) {
      console.error("Python error:", err);
      return res.status(500).send("Error running Python script");
    }
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
