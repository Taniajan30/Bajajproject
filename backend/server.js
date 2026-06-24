import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processHierarchies } from './process_hierarchies.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS - allow frontend URL from env or all origins in dev
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : true; // allow all in dev

app.use(cors({ origin: allowedOrigins }));

// Parse JSON request body
app.use(express.json());

// Identity Credentials
const identity = {
  user_id: process.env.USER_ID || "fullname_ddmmyyyy",
  email_id: process.env.EMAIL_ID || "college_email@college.edu",
  college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "21CS1001"
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', identity });
});

// POST /bfhl
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: "Missing 'data' field in request body. It must be an array of strings."
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "'data' field must be an array of strings."
      });
    }

    const response = processHierarchies(data, identity);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while processing hierarchies."
    });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Wildcard route to serve React's index.html for all non-API GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
