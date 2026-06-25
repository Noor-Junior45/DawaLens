import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.use(express.json({ limit: '10mb' }));

  // Google Search Console Dynamic HTML File Verification Handler
  app.get("/google:id.html", (req, res) => {
    const id = req.params.id;
    res.setHeader("Content-Type", "text/html");
    res.send(`google-site-verification: google${id}.html`);
  });

  // Public Privacy Policy Endpoint for Google Console OAuth verification
  app.get("/privacy", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - DawaLens AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { border-b: 2px solid #eaeaea; padding-bottom: 10px; color: #111; }
    h2 { color: #222; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px; }
    footer { margin-top: 50px; border-top: 1px solid #eaeaea; padding-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <h1>Privacy Policy for DawaLens AI</h1>
  <p><strong>Effective Date: June 25, 2026</strong></p>
  <p>Welcome to DawaLens AI. We are dedicated to protecting your personal information and your right to privacy. This privacy policy applies to our application hosted at <strong>https://noorpos.in</strong> and <strong>https://dawalens.vercel.app</strong>.</p>
  
  <h2>1. What Information We Access and How We Use It</h2>
  <p>DawaLens AI is an AI-powered medication scanner and scheduler designed to assist you in organizing your personal medical reminders.</p>
  <ul>
    <li><strong>Google OAuth and Google Tasks Integration:</strong> If you connect your Google Account, we request access to the Google Tasks API (<code>https://www.googleapis.com/auth/tasks</code>). This is used strictly to sync, create, edit, or check off your medication schedules and alarm events as tasks inside your Google account. We do NOT store or compile profiles of your task lists on our servers, nor do we share this data with any third parties.</li>
    <li><strong>Medicines & Prescriptions Data:</strong> Any medicine name, dosage, or scheduling frequency you input or scan is saved securely inside your private cloud database (Firebase).</li>
    <li><strong>Zero-Knowledge End-to-End Encryption (E2EE):</strong> You have the option to enable E2EE. When enabled, your medical inputs are encrypted locally in your browser using the Web Crypto API before being transmitted to the cloud database. We do not hold your decryption keys and cannot read your encrypted records under any circumstances.</li>
  </ul>

  <h2>2. Google User Data Policy Compliance</h2>
  <p>Our application strictly complies with the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements. We do not transfer, sell, or disclose your Google User data to marketing networks, data brokers, or third-party advertising platforms.</p>

  <h2>3. Contact Us</h2>
  <p>If you have any questions, feedback, or concerns regarding your privacy or data protection practices, feel free to contact us at:</p>
  <p>Email: <a href="mailto:mdhassan1738@gmail.com">mdhassan1738@gmail.com</a></p>
  
  <footer>
    <p>&copy; 2026 DawaLens AI. All rights reserved. Host: https://noorpos.in</p>
  </footer>
</body>
</html>`);
  });

  // Public Terms of Service Endpoint for Google Console OAuth verification
  app.get("/terms", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - DawaLens AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { border-b: 2px solid #eaeaea; padding-bottom: 10px; color: #111; }
    h2 { color: #222; margin-top: 30px; }
    footer { margin-top: 50px; border-top: 1px solid #eaeaea; padding-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <h1>Terms of Service for DawaLens AI</h1>
  <p><strong>Effective Date: June 25, 2026</strong></p>
  <p>These Terms of Service govern your use of the website and services at <strong>https://noorpos.in</strong> and <strong>https://dawalens.vercel.app</strong>. By accessing our application, you agree to these terms.</p>

  <h2>1. Description of Service</h2>
  <p>DawaLens AI provides medication barcode/label scanning, scheduling, and smart drug-interaction checking using AI technology. These features are designed strictly for educational and personal organization purposes.</p>

  <h2>2. Medical Disclaimer</h2>
  <p><strong>DawaLens AI is NOT a clinical tool, medical device, or licensed medical professional.</strong> Our features (including AI summaries and drug interaction warnings) are generated by general artificial intelligence models and are subject to errors. Never change, delay, or start medical treatment without directly consulting your doctor or pharmacist.</p>

  <h2>3. Third Party Services</h2>
  <p>To deliver advanced reminders, you may voluntarily grant authorization to Google Tasks. You acknowledge that Google's own terms and policies govern their services.</p>

  <h2>4. Privacy & Personal Data</h2>
  <p>We respect your privacy. All handling of user inputs is done in accordance with our <a href="/privacy">Privacy Policy</a>.</p>

  <h2>5. Limitation of Liability</h2>
  <p>DawaLens AI is provided "as is" without any guarantees. We are not responsible for any issues resulting from missed doses, data sync failures, or information accuracy errors.</p>

  <h2>6. Governing Law & Contact</h2>
  <p>For any questions or legal inquiries, please contact us at:</p>
  <p>Email: <a href="mailto:mdhassan1738@gmail.com">mdhassan1738@gmail.com</a></p>

  <footer>
    <p>&copy; 2026 DawaLens AI. All rights reserved. Host: https://noorpos.in</p>
  </footer>
</body>
</html>`);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "DawaLens AI Server is running" });
  });

  // Extraction Cache Routes
  app.post("/api/ai/extract-cache", async (req, res) => {
    try {
      const { imageHash } = req.body;
      const { getExtractionCache } = await import("./server/aiService.js");
      const result = await getExtractionCache(imageHash);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/ai/extract-save-cache", async (req, res) => {
    try {
      const { imageHash, data } = req.body;
      const { saveExtractionCache } = await import("./server/aiService.js");
      await saveExtractionCache(imageHash, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Interaction Cache Routes
  app.post("/api/ai/interactions-cache", async (req, res) => {
    try {
      const { key } = req.body;
      const { getInteractionCache } = await import("./server/aiService.js");
      const result = await getInteractionCache(key);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/ai/interactions-save-cache", async (req, res) => {
    try {
      const { key, data } = req.body;
      const { saveInteractionCache } = await import("./server/aiService.js");
      await saveInteractionCache(key, data);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
