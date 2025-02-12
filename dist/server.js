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
const python_shell_1 = require("python-shell");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.get("/compare-faces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Hardcoded or dynamic image paths
    const scriptPath = path_1.default.join(__dirname, "../face_rec.py");
    const selfiePath = path_1.default.join(__dirname, "selfie.jpg");
    const eventPath = path_1.default.join(__dirname, "group_image.jpg");
    try {
        const pythonPath = path_1.default.join(__dirname, "..", ".venv", "bin", "python3");
        const results = yield python_shell_1.PythonShell.run(scriptPath, {
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
        }
        else if (output === "NO_COMPARE") {
            return res.send("No face found in the event image");
        }
        const distance = parseFloat(output);
        const threshold = 0.6;
        const isMatch = distance < threshold;
        res.json({ distance, isMatch });
    }
    catch (err) {
        if (err) {
            console.error("Python error:", err);
            return res.status(500).send("Error running Python script");
        }
    }
}));
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
