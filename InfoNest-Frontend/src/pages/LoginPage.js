// src/pages/LoginPage.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_BASE } from "../config";

const infoNestLogo = "/logo.png";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_SCRIPT_ID = "google-identity-script";

const LoginPage = () => {
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState(""); // 'success' | 'error' | ''
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const googleInitRef = useRef(false);

  const setStatusMessage = (text, type = "error") => {
    setMessage(text);
    setMsgType(type);
  };

  // Username / password login
  const handleLogin = async (event) => {
    event.preventDefault();
    setStatusMessage("", "");
    setLoginLoading(true);

    try {
      const response = await axios.post(`${BACKEND_API_BASE}/login`, {
        username,
        password,
      });

      if (response.status === 200 && response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", username);
        setStatusMessage("Login successful! Redirecting...", "success");
        navigate("/home");
      } else {
        setStatusMessage(
          response.data.error || "Login failed. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        setStatusMessage(
          error.response.data.error || "Login failed: Invalid credentials.",
          "error"
        );
      } else if (error.request) {
        setStatusMessage(
          "Network error. Server might be down or unreachable.",
          "error"
        );
      } else {
        setStatusMessage("An unexpected error occurred. Please try again.", "error");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  // Handle Google credential (idToken) -> backend
  const handleGoogleCredential = useCallback(
  async (idToken) => {
    if (!idToken) {
      setStatusMessage("Google did not return a credential.", "error");
      return;
    }
    setGoogleLoading(true);
    setStatusMessage("", "");
    console.log("[GoogleAuth] idToken length:", idToken.length);

    try {
      const res = await axios.post(`${BACKEND_API_BASE}/auth/google`, { idToken });

      console.log("[GoogleAuth] backend response:", res.status, res.data);

      if (res.data?.success) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user?.username) {
          localStorage.setItem("username", res.data.user.username);
        }
        setStatusMessage("Google sign-in successful! Redirecting...", "success");
        navigate("/home");
      } else {
        setStatusMessage(
          res.data?.error || "Google authentication failed.",
          "error"
        );
      }
    } catch (e) {
      console.error("[GoogleAuth] error object:", e);

      if (e.response) {
        // Server responded with a status outside 2xx
        const { status, data } = e.response;
        setStatusMessage(
          `Google auth failed (${status}): ${data?.error || "Server returned an error."}`,
          "error"
        );
      } else if (e.request) {
        // Request made, no response (timeout / CORS / server down)
        setStatusMessage(
          "No response from server. Check server running and CORS settings.",
          "error"
        );
      } else {
        // Something else configuring the request
        setStatusMessage(`Request setup error: ${e.message}`, "error");
      }
    } finally {
      setGoogleLoading(false);
    }
  },
  [navigate]
);

  // Google Identity one-time init
  useEffect(() => {
    if (googleInitRef.current) return;
    googleInitRef.current = true;

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatusMessage(
        "Google Client ID missing. Set REACT_APP_GOOGLE_CLIENT_ID in .env and restart.",
        "error"
      );
      return;
    }

    function initializeGoogle(id) {
      try {
        window.google.accounts.id.initialize({
          client_id: id,
          callback: (resp) => {
            if (resp?.credential) {
              handleGoogleCredential(resp.credential);
            } else {
              setStatusMessage("No Google credential received.", "error");
            }
          },
        });
        const slot = document.getElementById("gsi-btn-slot");
        if (slot) {
          window.google.accounts.id.renderButton(slot, {
            theme: "outline",
            size: "large",
            width: 260,
            type: "standard",
          });
        }
      } catch (err) {
        console.error("Google initialize error:", err);
        setStatusMessage("Failed to initialize Google sign-in.", "error");
      }
    }

    if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.google?.accounts?.id) {
          setStatusMessage("Google script loaded but API unavailable.", "error");
          return;
        }
        initializeGoogle(clientId);
      };
      script.onerror = () =>
        setStatusMessage("Failed to load Google identity script.", "error");
      document.head.appendChild(script);
    } else {
      if (window.google?.accounts?.id) {
        initializeGoogle(clientId);
      }
    }
  }, [handleGoogleCredential]);

  const isBusy = loginLoading || googleLoading;

  return (
    <div
      className="login-page-container"
      style={{
        fontFamily: "Arial, sans-serif",
        margin: 0,
        backgroundColor: "#e6f4ea",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "20px",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <img
          src={infoNestLogo}
          alt="InfoNest Logo"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1a202c" }}>
          InfoNest Login
        </h1>
      </header>

      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#d4f5d3",
            padding: "30px",
            borderRadius: "20px",
            width: "300px",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
            Welcome Back
          </h2>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxSizing: "border-box",
                background: isBusy ? "#f3f3f3" : "#fff",
              }}
            />

            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isBusy}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  background: isBusy ? "#f3f3f3" : "#fff",
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isBusy}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-90%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.1em",
                  color: "#2f855a",
                }}
                aria-label="Toggle password visibility"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "🤫"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: loginLoading ? "#3f9968" : "#2f855a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loginLoading ? "default" : "pointer",
                fontWeight: "bold",
                transition: "background 0.2s",
              }}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "18px 0 10px",
              fontSize: "12px",
              color: "#2f4f2f",
            }}
          >
            <div style={{ flexGrow: 1, height: 1, background: "#b6d8b6" }} />
            <span>OR</span>
            <div style={{ flexGrow: 1, height: 1, background: "#b6d8b6" }} />
          </div>

          {/* Single Google Sign-In Button (rendered by GIS) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <div id="gsi-btn-slot" />
            {googleLoading && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#2f4f2f",
                  textAlign: "center",
                }}
              >
                Authorizing with Google...
              </div>
            )}
          </div>

          {message && (
            <p
              style={{
                color: msgType === "success" ? "green" : "red",
                textAlign: "center",
                marginTop: "10px",
                fontSize: "14px",
                whiteSpace: "pre-line",
              }}
            >
              {message}
            </p>
          )}

          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#2f855a", textDecoration: "none" }}
            >
              Register
            </Link>
          </p>
        </div>
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "10px 15px",
          fontSize: "12px",
          color: "#2f4f2f",
          marginTop: "auto",
        }}
      >
        InfoNest by Thit Lwin Win Thant, VMES © 2025
      </footer>
    </div>
  );
};

export default LoginPage;