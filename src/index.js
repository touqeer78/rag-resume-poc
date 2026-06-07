"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
async function loadPdf(filePath) {
    const buffer = fs_1.default.readFileSync(filePath);
    const data = await (0, pdf_parse_1.default)(buffer);
    return data.text;
}
async function main() {
    const filePath = "documents/resume.pdf";
    console.log("Loading PDF...");
    const text = await loadPdf(filePath);
    console.log("\n--- PDF TEXT START ---\n");
    console.log(text.slice(0, 2000)); // first 2000 chars only
    console.log("\n--- PDF TEXT END ---\n");
    console.log("Total characters:", text.length);
}
main().catch((err) => {
    console.error("Error:", err);
});
//# sourceMappingURL=index.js.map