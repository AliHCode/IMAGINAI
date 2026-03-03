<div align="center">

# IMAGINAI: Create Reality 

**A modern, dual-client AI Image Generation Platform**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=000)](https://huggingface.co/)

</div>

---

## 📖 Overview

**IMAGINAI** is a premium, highly-responsive AI image generation platform designed with a sleek, futuristic dark-mode UI. It allows users to turn text prompts into stunning visual art instantly.

The project features a **dual-stack architecture**:
1. **Web Client (React + Vercel):** A zero-backend web experience utilizing Google Gemini 2.5 Flash Image and Vercel Serverless Functions for secure API key handling.
2. **Cross-Platform Client (Flutter + FastAPI):** A robust mobile & web client connecting to a custom Python backend that leverages the Hugging Face Serverless Inference API (Stable Diffusion XL).

---

## 📸 Screenshots

*Replace the placeholder links below with actual screenshots of your application.*

| Feature | Screenshot (React Web) | Screenshot (Flutter Client) |
| :--- | :---: | :---: |
| **Main Interface** | <img src="[INSERT_URL_HERE]" width="350"/> | <img src="[INSERT_URL_HERE]" width="350"/> |
| **Generation Process** | <img src="[INSERT_URL_HERE]" width="350"/> | <img src="[INSERT_URL_HERE]" width="350"/> |
| **Style Dropdowns & Settings** | <img src="[INSERT_URL_HERE]" width="350"/> | <img src="[INSERT_URL_HERE]" width="350"/> |
| **Image Download & Overlay**| <img src="[INSERT_URL_HERE]" width="350"/> | <img src="[INSERT_URL_HERE]" width="350"/> |

---

## ✨ Key Features

- **Text-to-Image Generation:** Powered by Stable Diffusion XL (via Hugging Face) and Google Gemini 2.5.
- **AI Prompt Enhancement:** Uses Gemini 3.0 Flash Preview to automatically rewrite basic prompts into highly detailed, stylistic descriptions.
- **Image-to-Image Generation:** Upload reference images to guide the AI generation process.
- **Styling Presets & Aspect Ratios:** Quickly apply modifiers like "Cyberpunk", "Photorealistic", or "Anime", and generate in 1:1, 16:9, or 9:16.
- **Local History Strip:** Automatically saves your generated session images locally for easy review and bulk cleanup.
- **Secure Serverless Architecture:** API keys are never exposed to the client. The React app uses Vercel Serverless `/api/generate` routes, and the Flutter app bridges to a secure FastAPI Python server.

---

## 🛠️ Technology Stack

### Architecture 1: The React Web App (Vercel Native)
* **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
* **Backend:** Vercel Serverless Functions
* **AI Engine:** `@google/genai` (Gemini 2.5 Flash, Gemini 3 Flash Preview)
* **Storage:** IndexedDB (localforage)

### Architecture 2: The Flutter App (Cross-Platform)
* **Frontend:** Flutter (Dart), Provider (State Management), Universal HTML
* **Backend:** Python, FastAPI, Uvicorn
* **AI Engine:** Hugging Face Serverless Inference API (`stabilityai/stable-diffusion-xl-base-1.0`)

---

## 🚀 Getting Started

### 1. Running the React Web App Locally

1. Navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server (Note: Serverless functions require running via Vercel CLI for local testing, or deploying directly):
   ```bash
   npm run dev
   ```

### 2. Running the Flutter App & Python Backend Locally

**Start the FastAPI Backend:**
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create/update the `.env` file in the root/backend directory:
   ```env
   HUGGINGFACE_API_KEY=hf_your_huggingface_token
   ```
3. Activate the virtual environment and start Uvicorn:
   ```bash
   .\venv\Scripts\activate
   uvicorn main:app --reload
   ```

**Start the Flutter Frontend:**
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Get packages and run:
   ```bash
   flutter pub get
   flutter run -d chrome
   ```

---

## 🔒 Security & Deployment (Vercel)

The React application is structured to be deployed directly to Vercel. Because adding API keys to client-side code is a severe security risk, the app uses **Vercel Serverless Functions** (`api/generate.ts` and `api/enhance.ts`). 

To deploy:
1. Push your repository to GitHub.
2. Import the repository in your Vercel Dashboard.
3. In the Vercel project settings, navigate to **Environment Variables** and add `GEMINI_API_KEY`.
4. Deploy the application.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for the future of AI.*
