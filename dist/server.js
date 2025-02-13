"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const python_shell_1 = require("python-shell");
const app = (0, express_1.default)();
// Python interpreter
const PYTHON_PATH = path_1.default.join(__dirname, "..", ".venv", "bin", "python3");
// The face_recognition script
const SCRIPT_PATH = path_1.default.join(__dirname, "..", "face_rec.py");
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
app.get("/compare-faces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const selfieUrl = req.query.selfie_url;
        const eventUrl = req.query.image_url;
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
        const tempSelfiePath = yield downloadImageToTempFile(selfieUrl, "selfie");
        const tempEventPath = yield downloadImageToTempFile(eventUrl, "event");
        // 4) Run the Python script
        const results = yield python_shell_1.PythonShell.run(SCRIPT_PATH, {
            pythonPath: PYTHON_PATH,
            args: [tempSelfiePath, tempEventPath]
        });
        // 5) Clean up temp files
        fs_1.default.unlinkSync(tempSelfiePath);
        fs_1.default.unlinkSync(tempEventPath);
        // 6) Check Python output
        if (!results || results.length === 0) {
            return res.status(500).send("No output from Python");
        }
        const output = results[0];
        console.log("Python Output:", output);
        if (output === "NO_SELFIE") {
            return res.send("No face found in the selfie image");
        }
        else if (output === "NO_COMPARE") {
            return res.send("No face found in the event image");
        }
        // 7) Parse distance & respond
        const distance = parseFloat(output);
        const isMatch = distance < MATCH_THRESHOLD;
        return res.json({ distance, isMatch });
    }
    catch (error) {
        console.error("Error in /compare-faces:", error);
        return res.status(500).send("Error processing request");
    }
}));
/**
 * Checks if the URL ends with a known valid image extension.
 */
function isValidImageExtension(url) {
    const lowerUrl = url.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext));
}
/**
 * HEAD request to confirm the remote file's Content-Type is an image.
 */
function isValidImageContentType(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(url, {
                method: "GET",
                responseType: "stream",
                maxContentLength: 0,
                maxBodyLength: 0,
                headers: { Range: "bytes=0-0" } // ask only for the first byte
            });
            const contentType = response.headers["content-type"];
            // We only downloaded 1 byte, but we have the headers
            return contentType && contentType.startsWith("image/");
        }
        catch (err) {
            console.error("Partial GET request failed:", err);
            return false;
        }
    });
}
/**
 * Download the image from `imageUrl` and save it to a temp file.
 */
function downloadImageToTempFile(imageUrl, prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(imageUrl, {
            responseType: "arraybuffer"
        });
        const tempFilePath = path_1.default.join(os_1.default.tmpdir(), `${prefix}-${Date.now()}.jpg`);
        fs_1.default.writeFileSync(tempFilePath, Buffer.from(response.data));
        return tempFilePath;
    });
}
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
