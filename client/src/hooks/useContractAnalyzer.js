/**
 * useContractAnalyzer.js
 * All contract analysis logic — state, file reading, API calls.
 * Points to Express server at /api/* (proxied via package.json proxy in dev)
 */

import { useState, useCallback } from "react";

// In dev: React proxies /api → http://localhost:5000 (set in client/package.json)
// In prod: same origin, so /api works directly
const API = "/api";

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function extractTextFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API}/extract`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to extract text from file");
  return data.text;
}

async function analyzeContractText(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s
  try {
    const response = await fetch(`${API}/analyze`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractText: text }),
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed");
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("Request timed out. Try a shorter contract or wait a moment and retry.");
    throw err;
  }
}

export function useContractAnalyzer() {
  const [contractText, setContractText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("paste");

  const handleFileSelect = useCallback((file) => {
    setError("");
    setAnalysis(null);
    if (!file) { setUploadedFile(null); return; }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext)) {
      setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    setUploadedFile(file);
  }, []);

  const analyze = useCallback(async () => {
    setError("");
    setAnalysis(null);

    try {
      setLoading(true);
      let textToAnalyze = "";

      if (activeTab === "upload" && uploadedFile) {
        const ext = uploadedFile.name.split(".").pop().toLowerCase();
        if (ext === "txt") {
          setLoadingStage("Reading file...");
          textToAnalyze = await readTextFile(uploadedFile);
        } else {
          setLoadingStage("Extracting text from document...");
          textToAnalyze = await extractTextFromFile(uploadedFile);
        }
      } else if (activeTab === "paste" && contractText.trim()) {
        textToAnalyze = contractText.trim();
      } else {
        throw new Error(
          activeTab === "upload"
            ? "Please select a file to upload."
            : "Please paste your contract text before analyzing."
        );
      }

      if (textToAnalyze.length < 50) {
        throw new Error("The text is too short. Please provide a complete contract.");
      }

      setLoadingStage("AI is analyzing your contract...");
      const result = await analyzeContractText(textToAnalyze);
      setAnalysis(result);

    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }, [activeTab, contractText, uploadedFile]);

  const loadSample = useCallback(async () => {
    setError("");
    setAnalysis(null);
    setActiveTab("paste");
    try {
      const res = await fetch("/sample-contract.txt");
      const text = await res.text();
      setContractText(text);
    } catch {
      setError("Failed to load sample contract.");
    }
  }, []);

  const reset = useCallback(() => {
    setContractText("");
    setUploadedFile(null);
    setAnalysis(null);
    setError("");
    setLoading(false);
    setLoadingStage("");
  }, []);

  return {
    contractText, setContractText,
    uploadedFile, analysis,
    loading, loadingStage,
    error, activeTab, setActiveTab,
    handleFileSelect, analyze, loadSample, reset,
  };
}
