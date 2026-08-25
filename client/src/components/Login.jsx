import React, { useState, useEffect } from "react";

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Register fields
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Google Mock Auth states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState("Atleta Google");
  const [googleEmail, setGoogleEmail] = useState("atleta.google@gmail.com");
  const [googleBirthdate, setGoogleBirthdate] = useState("1998-06-15");
  const [googleCountry, setGoogleCountry] = useState("Colombia");
  const [googlePhone, setGooglePhone] = useState("+57 300 123 4567");
  const [googleGender, setGoogleGender] = useState("male");
  const [googleSport, setGoogleSport] = useState("General");

  // FAQ State
  const [activeFaq, setActiveFaq] = useState(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("zerofit_theme") || "dark";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("zerofit_theme", next);
  };

  // Interactive Showcase states
  const [showcaseTab, setShowcaseTab] = useState("somatochart");
  const [mesoVal, setMesoVal] = useState(4);
  const [endoVal, setEndoVal] = useState(3);
  const [ectoVal, setEctoVal] = useState(3);
  const [suppStock, setSuppStock] = useState(80);
  const [postureAngle, setPostureAngle] = useState(135);
  const [isSquattingUp, setIsSquattingUp] = useState(true);

  // Simulated live posture tracking effect
  useEffect(() => {
    if (showcaseTab !== "posture") return;
    const interval = setInterval(() => {
      setPostureAngle((prev) => {
        if (isSquattingUp) {
          if (prev >= 170) {
            setIsSquattingUp(false);
            return prev - 2;
          }
          return prev + 2;
        } else {
          if (prev <= 95) {
            setIsSquattingUp(true);
            return prev + 2;
          }
          return prev - 2;
        }
      });
    }, 40);
    return () => clearInterval(interval);
  }, [showcaseTab, isSquattingUp]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = (email || "").trim();
    const cleanPassword = (password || "").trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.user, rememberMe, data.token);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Usuario o contraseña incorrectos");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          country,
          phone
        })
      });

      if (res.ok) {
        setSuccess("¡Registro exitoso! Iniciando sesión...");
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        
        if (loginRes.ok) {
          const data = await loginRes.json();
          onLogin(data.user, rememberMe, data.token);
        } else {
          setIsLogin(true);
          setError("Registro completado. Por favor inicia sesión.");
          setLoading(false);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error en el registro");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error de red al registrarse");
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.user, rememberMe, data.token);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error de autenticación con Google");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al autenticar con Google");
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1085823985818-6m0krg209lkisffu6vol2ioft8vp0vre.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        const container = document.getElementById("google-signin-btn-container");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            text: isLogin ? "signin_with" : "signup_with",
            width: "320"
          });
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLogin]);

  const scrollToLogin = () => {
    const loginSection = document.getElementById("login-section");
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="login-landing-container">
      {/* Styles Autocontenidos - Premium Aesthetics */}
      <style>{`
        .login-landing-container {
          --sano-cream: #0d1117;
          --sano-dark: #e2e8f0;
          --sano-card-bg: #161b22;
          --sano-input-bg: #0d1117;
          --sano-teal: #22c55e;
          --sano-teal-hover: #16a34a;
          --sano-lime: #22c55e;
          --sano-lime-glow: rgba(34, 197, 94, 0.15);
          --sano-glass-border: rgba(255, 255, 255, 0.08);
          --sano-card-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: var(--sano-cream);
          color: var(--sano-dark);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }

        [data-theme="light"] .login-landing-container {
          --sano-cream: #FAF9F6;
          --sano-dark: #121A1A;
          --sano-card-bg: #ffffff;
          --sano-input-bg: #f8faf9;
          --sano-teal: #008080;
          --sano-teal-hover: #006666;
          --sano-lime: #32CD32;
          --sano-lime-glow: rgba(50, 205, 50, 0.15);
          --sano-glass-border: rgba(18, 26, 26, 0.06);
          --sano-card-shadow: 0 10px 40px rgba(47, 79, 79, 0.04);
        }

        /* Ambient Background Glows */
        .ambient-glows {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }
        .glow-1 {
          position: absolute;
          top: -20vh;
          right: -10vw;
          width: 50vw;
          height: 60vh;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, rgba(13, 17, 23, 0) 70%);
          filter: blur(80px);
        }
        .glow-2 {
          position: absolute;
          top: 40vh;
          left: -15vw;
          width: 60vw;
          height: 70vh;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, rgba(13, 17, 23, 0) 70%);
          filter: blur(100px);
        }

        /* Sticky Header */
        .landing-header {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          background: var(--sano-card-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--sano-glass-border);
          z-index: 1000;
          padding: 16px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .logo-dot {
          width: 12px;
          height: 12px;
          background: var(--sano-teal);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--sano-teal);
          animation: pulse 2s infinite;
        }
        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--sano-dark);
        }
        .logo-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--sano-teal);
          background: rgba(0, 128, 128, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-btn {
          background: var(--sano-teal);
          color: white;
          border: none;
          padding: 10px 24px;
          font-weight: 700;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .header-btn:hover {
          background: var(--sano-teal-hover);
          transform: translateY(-1px);
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 60px 24px;
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 60px;
          align-items: center;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .hero-tag {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--sano-teal);
          margin-bottom: 16px;
          background: rgba(0, 128, 128, 0.08);
          padding: 6px 14px;
          border-radius: 30px;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          color: var(--sano-dark);
          margin-bottom: 20px;
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, var(--sano-teal) 0%, var(--sano-lime) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-style: italic;
        }
        .hero-subtitle {
          font-size: 1.15rem;
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 32px;
          max-width: 600px;
        }
        
        /* Stats Row */
        .stats-row {
          display: flex;
          justify-content: flex-start;
          gap: 16px;
          margin-bottom: 30px;
          width: 100%;
          max-width: 600px;
        }
        .stat-card {
          flex: 1;
          background: var(--sano-card-bg);
          border: 1px solid var(--sano-glass-border);
          border-radius: 20px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--sano-card-shadow);
        }
        .stat-val {
          font-size: 2rem;
          font-weight: 900;
          color: var(--sano-teal);
          line-height: 1;
        }
        .stat-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .stars-container {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        
        .hero-cta-btn {
          width: 100%;
          max-width: 320px;
          background: var(--sano-teal);
          color: white;
          border: none;
          padding: 18px 24px;
          font-size: 1.1rem;
          font-weight: 800;
          border-radius: 24px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0, 128, 128, 0.25);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: inherit;
        }
        .hero-cta-btn:hover {
          background: var(--sano-teal-hover);
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0, 128, 128, 0.35);
        }
        .hero-cta-btn:active {
          transform: scale(0.97);
        }
        .arrow-icon {
          transition: transform 0.25s ease;
        }
        .hero-cta-btn:hover .arrow-icon {
          transform: translateX(4px);
        }

        /* Auto Scrolling Marquee */
        .marquee-container {
          width: 100%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.4);
          border-top: 1.5px solid rgba(0,0,0,0.03);
          border-bottom: 1.5px solid rgba(0,0,0,0.03);
          padding: 24px 0;
          margin-top: 40px;
          position: relative;
        }
        .marquee-title {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-muted);
          margin-bottom: 15px;
          text-align: center;
          opacity: 0.6;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .marquee-content {
          display: flex;
          align-items: center;
          gap: 80px;
          padding-right: 80px;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--sano-dark);
          white-space: nowrap;
        }
        .marquee-content span {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .marquee-tick {
          color: var(--sano-teal);
          font-size: 1.3rem;
          font-weight: bold;
        }
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        /* Mockup iPhone Container */
        .mockup-container {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .iphone-frame {
          width: 310px;
          height: 620px;
          background: #000;
          border-radius: 46px;
          padding: 11px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 4px #2a2a2a;
          position: relative;
          z-index: 5;
          animation: float 6s ease-in-out infinite;
        }
        .iphone-screen {
          width: 100%;
          height: 100%;
          background: #f4f7f6;
          border-radius: 36px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          font-family: 'Outfit', sans-serif;
          user-select: none;
        }
        .iphone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 110px;
          height: 25px;
          background: #000;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          z-index: 100;
        }
        
        /* Simulated App Content */
        .app-header {
          background: white;
          padding: 30px 16px 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .app-user-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #2F4F4F;
        }
        .app-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sano-lime);
          box-shadow: 0 0 6px var(--sano-lime);
        }
        .app-body {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .app-card {
          background: white;
          border-radius: 16px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.04);
          box-shadow: 0 4px 12px rgba(0,0,0,0.015);
        }
        .app-card-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #708090;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        /* Circular Calorie Ring */
        .mini-calorie-summary {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mini-circle-container {
          position: relative;
          width: 54px;
          height: 54px;
        }
        .circle-svg {
          transform: rotate(-90deg);
        }
        .mini-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: #2F4F4F;
        }
        .mini-label {
          font-size: 0.7rem;
          color: #708090;
        }
        
        /* Somatocarta mockup grid */
        .mini-somatochart {
          width: 100%;
          aspect-ratio: 1.5;
          border: 1px dashed rgba(0,0,0,0.1);
          border-radius: 8px;
          position: relative;
          background: rgba(0,0,0,0.01);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .somatochart-grid-line-x {
          position: absolute;
          top: 50%;
          left: 5%;
          right: 5%;
          height: 1px;
          background: rgba(0,0,0,0.05);
        }
        .somatochart-grid-line-y {
          position: absolute;
          left: 50%;
          top: 5%;
          bottom: 5%;
          width: 1px;
          background: rgba(0,0,0,0.05);
        }
        .somatochart-point {
          position: absolute;
          top: 35%;
          left: 58%;
          width: 8px;
          height: 8px;
          background: var(--sano-teal);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--sano-teal);
        }
        .somatochart-label-meso {
          position: absolute;
          top: 4px;
          font-size: 0.6rem;
          font-weight: 600;
          color: #708090;
        }
        
        /* Supplement stock */
        .mini-stock-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mini-stock-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .mini-progress-bar-bg {
          height: 6px;
          width: 100%;
          background: rgba(0,0,0,0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .mini-progress-bar-fill {
          height: 100%;
          width: 82%;
          background: var(--sano-teal);
          border-radius: 3px;
        }

        /* Features Section */
        .features-section {
          background: var(--sano-cream);
          padding: 80px 24px 60px 24px;
          border-top: 1px solid var(--sano-glass-border);
          border-bottom: 1px solid var(--sano-glass-border);
          position: relative;
          z-index: 10;
        }
        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .features-header {
          text-align: center;
          margin-bottom: 50px;
        }
        .features-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--sano-dark);
          line-height: 1.2;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feature-card {
          border-radius: 28px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 16px;
          height: 100%;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.08);
        }
        .card-blue {
          background: rgba(79, 70, 229, 0.05);
        }
        .card-green {
          background: rgba(16, 185, 129, 0.05);
        }
        .card-amber {
          background: rgba(245, 158, 11, 0.05);
        }
        .card-rose {
          background: rgba(244, 63, 94, 0.05);
        }
        .card-violet {
          background: rgba(139, 92, 246, 0.05);
        }
        
        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }
        .feature-card:hover .feature-icon-wrapper {
          transform: scale(1.1);
        }
        
        .icon-blue { background: rgba(79, 70, 229, 0.1); color: rgb(79, 70, 229); }
        .icon-green { background: rgba(16, 185, 129, 0.1); color: rgb(16, 185, 129); }
        .icon-amber { background: rgba(245, 158, 11, 0.1); color: rgb(245, 158, 11); }
        .icon-rose { background: rgba(244, 63, 94, 0.1); color: rgb(244, 63, 94); }
        .icon-violet { background: rgba(139, 92, 246, 0.1); color: rgb(139, 92, 246); }

        .feature-card-title {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .title-blue { color: rgb(67, 56, 202); }
        .title-green { color: rgb(15, 118, 110); }
        .title-amber { color: rgb(180, 83, 9); }
        .title-rose { color: rgb(190, 24, 74); }
        .title-violet { color: rgb(109, 40, 217); }

        .feature-card-desc {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #708090;
          font-weight: 500;
        }

        /* Login Form Section */
        .login-section {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-card {
          width: 100%;
          max-width: 460px;
          background: var(--sano-card-bg);
          border: 1px solid var(--sano-glass-border);
          border-radius: 32px;
          padding: 40px;
          box-shadow: var(--sano-card-shadow);
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .login-title {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--sano-dark);
          margin-bottom: 8px;
        }
        .login-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 28px;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--sano-dark);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-field-wrapper {
          position: relative;
          width: 100%;
        }
        .input-field {
          width: 100%;
          padding: 14px 16px;
          background: var(--sano-input-bg);
          border: 1px solid var(--sano-glass-border);
          border-radius: 14px;
          font-family: inherit;
          font-size: 0.95rem;
          color: var(--sano-dark);
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field:focus {
          background: var(--sano-card-bg);
          border-color: var(--sano-teal);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
        }
        
        /* Checkbox option */
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -4px;
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
          cursor: pointer;
        }
        .checkbox-input {
          width: 16px;
          height: 16px;
          accent-color: var(--sano-teal);
          cursor: pointer;
        }
        
        .error-message {
          background: rgba(255, 69, 0, 0.08);
          border: 1px solid rgba(255, 69, 0, 0.2);
          color: var(--error);
          padding: 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%;
          background: var(--sano-teal);
          color: white;
          border: none;
          padding: 16px;
          font-size: 1rem;
          font-weight: 800;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 6px 15px rgba(0, 128, 128, 0.15);
          font-family: inherit;
        }
        .submit-btn:hover {
          background: var(--sano-teal-hover);
          transform: translateY(-1px);
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          background: #a3c2c2;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Spinner */
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .login-tabs {
          display: flex;
          border-bottom: 1px solid var(--sano-glass-border);
          margin-bottom: 24px;
        }
        .login-tab {
          flex: 1;
          padding: 12px;
          text-align: center;
          font-weight: 700;
          cursor: pointer;
          color: #708090;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s ease;
        }
        .login-tab.active {
          color: var(--sano-teal);
          border-bottom-color: var(--sano-teal);
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: var(--sano-card-bg);
          color: var(--sano-dark);
          border: 1px solid var(--sano-glass-border);
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .google-btn:hover {
          background: var(--sano-input-bg);
          border-color: var(--sano-glass-border);
        }
        /* Google Account Selector Mock Modal */
        .google-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 15, 30, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .google-modal-card {
          background: rgba(20, 25, 40, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          color: #ffffff;
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }
        .google-modal-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4285F4 0%, #34A853 25%, #FBBC05 50%, #EA4335 100%);
        }
        .google-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .google-modal-title {
          font-size: 1.4rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
          color: #ffffff;
        }
        .google-modal-subtitle {
          font-size: 0.9rem;
          color: #8892b0;
          text-align: center;
          margin-bottom: 24px;
        }
        .google-modal-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .google-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .google-input-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #8892b0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .google-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.9rem;
          color: #ffffff;
          outline: none;
          transition: all 0.2s;
        }
        .google-input:focus {
          border-color: #4285F4;
          background: rgba(66, 133, 244, 0.05);
        }
        .google-modal-actions {
          display: flex;
          gap: 12px;
        }
        .google-btn-cancel {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #8892b0;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .google-btn-cancel:hover {
          background: rgba(255,255,255,0.05);
          color: #ffffff;
        }
        .google-btn-submit {
          flex: 2;
          background: #4285F4;
          border: none;
          color: white;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .google-btn-submit:hover {
          background: #357ae8;
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
        }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: #708090;
          font-size: 0.8rem;
          margin: 16px 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--sano-glass-border);
        }
        .divider:not(:empty)::before {
          margin-right: .5em;
        }
        .divider:not(:empty)::after {
          margin-left: .5em;
        }

        /* Footer */
        .landing-footer {
          padding: 40px 24px;
          border-top: 1px solid var(--sano-glass-border);
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          position: relative;
          z-index: 10;
        }

        /* Keyframes */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 128, 128, 0.5); }
          50% { transform: scale(1.15); box-shadow: 0 0 18px rgba(0, 128, 128, 0.8); }
          100% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 128, 128, 0.5); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .hero-section {
            display: flex;
            flex-direction: column;
            padding-top: 50px;
            gap: 50px;
            text-align: center;
          }
          .hero-content {
            align-items: center;
            text-align: center;
            order: 1;
          }
          .mockup-container {
            order: 2;
          }
          .hero-title {
            font-size: 2.8rem;
          }
          .hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
          .stats-row {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-cta-btn {
            margin-left: auto;
            margin-right: auto;
          }
          .features-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 640px) {
          /* Global overflow guard */
          * {
            box-sizing: border-box;
          }
          body, html {
            overflow-x: hidden;
          }

          /* Hero */
          .hero-section {
            display: flex;
            flex-direction: column;
            padding: 40px 16px 30px 16px;
            gap: 36px;
          }
          .hero-content {
            align-items: center;
            text-align: center;
            order: 1;
          }
          .mockup-container {
            order: 2;
          }
          .hero-title {
            font-size: 2rem;
            letter-spacing: -1px;
          }
          .hero-subtitle {
            font-size: 1rem;
            max-width: 100%;
          }
          .stats-row {
            justify-content: center;
            max-width: 100%;
          }

          /* Challenge (Problema / Solución) */
          .challenge-section {
            padding: 0 16px;
          }
          .challenge-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .challenge-card {
            padding: 24px 20px;
          }

          /* Science */
          .science-section {
            padding: 60px 16px;
          }
          .science-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .science-badge-card {
            padding: 24px 20px;
          }

          /* Testimonials */
          .testimonials-section {
            padding: 0 16px;
          }
          .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .testimonial-card {
            padding: 24px 20px;
          }

          /* Pricing */
          .pricing-section {
            padding: 0 16px;
          }
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 100%;
          }
          .pricing-card {
            padding: 28px 20px;
          }
          .pricing-title {
            font-size: 2rem;
          }

          /* Features */
          .features-grid {
            grid-template-columns: 1fr;
          }
          .features-section {
            padding: 40px 16px;
          }

          /* Header / Login card */
          .landing-header {
            padding: 16px 20px;
          }
          .login-card {
            padding: 30px 20px;
          }
        }

        /* Pricing Section */
        .pricing-section {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          text-align: center;
        }
        .pricing-header {
          margin-bottom: 50px;
        }
        .pricing-title {
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -1.5px;
          color: var(--sano-dark);
          margin-bottom: 12px;
        }
        .pricing-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 30px;
          align-items: stretch;
        }
        .pricing-card {
          background: white;
          border: 1px solid var(--sano-glass-border);
          border-radius: 24px;
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: var(--sano-card-shadow);
          transition: all 0.3s ease;
          position: relative;
        }
        .pricing-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 128, 128, 0.08);
          border-color: rgba(0, 128, 128, 0.2);
        }
        .pricing-card.popular {
          border: 2.5px solid var(--sano-teal);
          box-shadow: 0 20px 45px rgba(0, 128, 128, 0.12);
        }
        .popular-badge {
          position: absolute;
          top: -14px;
          right: 30px;
          background: var(--sano-teal);
          color: white;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .plan-name {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--sano-dark);
          text-transform: capitalize;
          margin: 0;
          text-align: left;
        }
        .plan-price {
          font-size: 3rem;
          font-weight: 900;
          color: var(--sano-dark);
          text-align: left;
          line-height: 1;
        }
        .plan-price span {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .plan-feature-item {
          font-size: 0.9rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .feature-check {
          color: var(--sano-teal);
          font-weight: bold;
          font-size: 1.1rem;
        }
        .plan-btn {
          width: 100%;
          background: var(--sano-cream);
          color: var(--sano-dark);
          border: 1px solid var(--sano-glass-border);
          padding: 14px 20px;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: auto;
          font-family: inherit;
        }
        .plan-btn:hover {
          background: var(--sano-dark);
          color: white;
        }
        .plan-btn.primary-btn {
          background: var(--sano-teal);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(0, 128, 128, 0.2);
        }
        .plan-btn.primary-btn:hover {
          background: var(--sano-teal-hover);
          box-shadow: 0 12px 25px rgba(0, 128, 128, 0.3);
        }

        @media (max-width: 1024px) {
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 450px;
            margin-left: auto;
            margin-right: auto;
          }
          .challenge-grid, .science-grid, .testimonials-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        @media (max-width: 768px) {
          .pricing-title, .features-title, .challenge-section h2, .science-section h2, .testimonials-section h2 {
            font-size: 2rem;
            letter-spacing: -0.5px;
          }
          .challenge-card {
            padding: 28px 20px;
          }
          .science-section {
            padding: 60px 20px;
          }
          .science-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
          .challenge-grid {
            grid-template-columns: 1fr;
          }
          .features-section {
            padding: 60px 20px;
          }
          .challenge-section, .testimonials-section {
            padding: 0 20px;
          }
        }

        /* Challenge Section */
        .challenge-section {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
        }
        .challenge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }
        .challenge-card {
          background: white;
          border: 1px solid var(--sano-glass-border);
          border-radius: 24px;
          padding: 40px;
          box-shadow: var(--sano-card-shadow);
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }
        .challenge-card.problem {
          border-left: 5px solid #f43f5e;
        }
        .challenge-card.solution {
          border-left: 5px solid var(--sano-teal);
        }
        .challenge-card-title {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--sano-dark);
        }
        .challenge-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .challenge-list-item {
          font-size: 0.95rem;
          color: var(--text-muted);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          line-height: 1.5;
        }
        .challenge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }
        .challenge-card.problem .challenge-dot {
          background: #f43f5e;
        }
        .challenge-card.solution .challenge-dot {
          background: var(--sano-teal);
        }

        /* Science Section */
        .science-section {
          background: rgba(0, 128, 128, 0.01);
          border-top: 1px solid var(--sano-glass-border);
          border-bottom: 1px solid var(--sano-glass-border);
          padding: 80px 24px;
          position: relative;
          z-index: 10;
        }
        .science-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .science-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 50px;
          align-items: center;
          margin-top: 40px;
        }
        .science-content {
          text-align: left;
        }
        .science-item {
          margin-bottom: 24px;
        }
        .science-item-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--sano-dark);
          margin-bottom: 8px;
        }
        .science-item-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .science-badge-card {
          background: white;
          border: 1px solid var(--sano-glass-border);
          border-radius: 24px;
          padding: 40px;
          box-shadow: var(--sano-card-shadow);
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        /* Testimonials Section */
        .testimonials-section {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          text-align: center;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 40px;
        }
        .testimonial-card {
          background: white;
          border: 1px solid var(--sano-glass-border);
          border-radius: 24px;
          padding: 30px;
          box-shadow: var(--sano-card-shadow);
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .testimonial-text {
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--text-muted);
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
          border-top: 1px solid rgba(18, 26, 26, 0.05);
          padding-top: 12px;
          margin-top: auto;
        }
        .author-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--sano-teal);
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .author-info {
          display: flex;
          flex-direction: column;
        }
        .author-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--sano-dark);
        }
        .author-title {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Showcase Playground Styles */
        .showcase-section {
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          text-align: center;
        }
        .showcase-container {
          background: white;
          border: 1px solid var(--sano-glass-border);
          border-radius: 30px;
          padding: 40px;
          box-shadow: var(--sano-card-shadow);
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .showcase-tabs {
          display: flex;
          justify-content: center;
          gap: 15px;
          border-bottom: 1px solid rgba(18, 26, 26, 0.05);
          padding-bottom: 20px;
          flex-wrap: wrap;
        }
        .showcase-tab-btn {
          background: transparent;
          border: 1px solid var(--sano-glass-border);
          padding: 10px 20px;
          border-radius: 30px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }
        .showcase-tab-btn:hover {
          border-color: var(--sano-teal);
          color: var(--sano-teal);
        }
        .showcase-tab-btn.active {
          background: var(--sano-teal);
          color: white;
          border-color: var(--sano-teal);
          box-shadow: 0 5px 15px rgba(0, 128, 128, 0.2);
        }
        .showcase-content {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          text-align: left;
          align-items: center;
          min-height: 400px;
        }
        .playground-card {
          background: #f8fafc;
          border: 1px solid var(--sano-glass-border);
          border-radius: 20px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          position: relative;
          overflow: hidden;
        }
        
        /* Interactive Somatochart widget */
        .interactive-somatocarta {
          width: 100%;
          height: 220px;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .somato-grid-x {
          position: absolute;
          left: 0; right: 0; top: 50%;
          height: 1px;
          background: #cbd5e1;
          border-style: dashed;
        }
        .somato-grid-y {
          position: absolute;
          top: 0; bottom: 0; left: 50%;
          width: 1px;
          background: #cbd5e1;
          border-style: dashed;
        }
        .somato-interactive-point {
          position: absolute;
          width: 14px;
          height: 14px;
          background: var(--sano-teal);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px var(--sano-teal);
          transition: left 0.2s ease, top 0.2s ease;
          transform: translate(-50%, -50%);
        }

        /* Posture IA Animation */
        .scanner-line {
          position: absolute;
          left: 0; right: 0; height: 3px;
          background: rgba(244, 63, 94, 0.5);
          box-shadow: 0 0 8px #f43f5e;
          animation: scan 3s linear infinite;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        /* Value range slider styles */
        .showcase-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 5px;
          outline: none;
        }
        .showcase-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--sano-teal);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        @media (max-width: 1024px) {
          .showcase-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        /* ============================================
           MOBILE RESPONSIVE — DEFINITIVE BLOCK
           (Must be LAST to override base styles)
        ============================================ */
        @media (max-width: 768px) {
          .challenge-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .science-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .testimonials-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 100% !important;
          }
          .challenge-section, .testimonials-section, .pricing-section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .science-section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .challenge-card {
            padding: 24px 20px !important;
          }
          .pricing-card {
            padding: 28px 20px !important;
          }
          .science-badge-card {
            padding: 24px 20px !important;
          }
          .testimonial-card {
            padding: 24px 20px !important;
          }
          .pricing-title {
            font-size: 2rem !important;
          }
        }

        @media (max-width: 640px) {
          .login-landing-container {
            overflow-x: hidden !important;
            width: 100% !important;
          }
          .hero-section {
            display: flex !important;
            flex-direction: column !important;
            padding: 40px 16px 30px 16px !important;
            gap: 36px !important;
          }
          .hero-content {
            align-items: center !important;
            text-align: center !important;
            order: 1 !important;
          }
          .mockup-container {
            order: 2 !important;
            width: 100% !important;
          }
          .hero-title {
            font-size: 2rem !important;
            letter-spacing: -1px !important;
          }
          .hero-subtitle {
            font-size: 1rem !important;
            max-width: 100% !important;
          }
          .stats-row {
            justify-content: center !important;
            max-width: 100% !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .features-section {
            padding: 40px 16px !important;
          }
          .landing-header {
            padding: 16px 20px !important;
          }
          .login-card {
            padding: 30px 20px !important;
          }
          .challenge-section,
          .testimonials-section,
          .pricing-section {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>

      {/* Ambient decorative glow elements */}
      <div className="ambient-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="logo-container" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img 
            src="/logo-full.png" 
            alt="ZEROFIT" 
            style={{ 
              height: "64px", 
              width: "auto", 
              objectFit: "contain"
            }} 
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--sano-glass-border)",
              color: "var(--sano-dark)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
            title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
          </button>
          <button type="button" className="header-btn" onClick={scrollToLogin}>
            Acceder
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Mockup iPhone Container on Left */}
        <div className="mockup-container">
          <div className="iphone-frame">
            <div className="iphone-screen">
              <div className="iphone-notch"></div>
              
              {/* Simulated App Header */}
              <div className="app-header">
                <span className="app-user-name">Atleta: Carlos Mendoza</span>
                <div className="app-status-indicator"></div>
              </div>
              
              {/* Simulated App Body */}
              <div className="app-body">
                {/* 1. Nutrition Summary */}
                <div className="app-card">
                  <div className="app-card-title">Balance Calórico</div>
                  <div className="mini-calorie-summary">
                    <div className="mini-circle-container">
                      <svg className="circle-svg" width="54" height="54">
                        <circle cx="27" cy="27" r="23" stroke="#e6e6e6" strokeWidth="3" fill="transparent" />
                        <circle cx="27" cy="27" r="23" stroke="var(--sano-teal)" strokeWidth="4" fill="transparent" 
                                strokeDasharray="144" strokeDashoffset="40" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="mini-val">1,840 Kcal</div>
                      <div className="mini-label">Consumidas de 2,500</div>
                    </div>
                  </div>
                </div>

                {/* 2. Somatochart */}
                <div className="app-card">
                  <div className="app-card-title">Somatocarta</div>
                  <div className="mini-somatochart">
                    <div className="somatochart-grid-line-x"></div>
                    <div className="somatochart-grid-line-y"></div>
                    <div className="somatochart-point"></div>
                    <span className="somatochart-label-meso">Mesomorfo</span>
                  </div>
                </div>

                {/* 3. Supplement Inventory */}
                <div className="app-card">
                  <div className="app-card-title">Stock de Suplemento</div>
                  <div className="mini-stock-item">
                    <div className="mini-stock-header">
                      <span>Creatina Creapure</span>
                      <span style={{ color: "var(--sano-teal)", fontWeight: 700 }}>82%</span>
                    </div>
                    <div className="mini-progress-bar-bg">
                      <div className="mini-progress-bar-fill"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Content Text on Right */}
        <div className="hero-content">
          <div className="hero-tag">Consola de Logística Deportiva</div>
          <h1 className="hero-title">
            CRM Deportivo para Entrenadores: <br />
            <span className="hero-gradient-text">Gestión, Ciencia y Tecnología</span>
          </h1>
          <p className="hero-subtitle">
            La plataforma definitiva para preparadores físicos profesionales. Gestiona tus atletas, 
            diseña somatocartas ISAK, monitorea su stock de suplementación y analiza su postura con IA en un solo lugar.
          </p>

          {/* Social Proof Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-val">1k+</span>
              <span className="stat-label">atletas activos de alto rendimiento</span>
            </div>
            <div className="stat-card">
              <div className="stars-container">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#F3C80A" stroke="#F3C80A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ))}
              </div>
              <span className="stat-label">Valorado con 4.9/5 estrellas</span>
            </div>
          </div>

          <button type="button" className="hero-cta-btn" onClick={scrollToLogin}>
            Ingresar al Portal
            <span className="arrow-icon">→</span>
          </button>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">
              Todo lo que necesitas para optimizar tu <br />
              <span style={{fontWeight: 900}}>preparación deportiva.</span>
            </h2>
          </div>

          <div className="features-grid">
            {/* Card 1 */}
            <div className="feature-card card-blue">
              <div className="feature-icon-wrapper icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <h3 className="feature-card-title title-blue">Somatocarta & Historial</h3>
              <p className="feature-card-desc">
                Visualización instantánea del somatotipo y la evolución antropométrica. Gráficas precisas de porcentaje de grasa y peso.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card card-green">
              <div className="feature-icon-wrapper icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="feature-card-title title-green">Suplementación Logística</h3>
              <p className="feature-card-desc">
                Planificación exacta de dosis de suplementos por ciclo. Sistema integrado de alerta de reposición por volumen de stock.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card card-amber">
              <div className="feature-icon-wrapper icon-amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M18 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M4 9h16"/><path d="M4 12h16"/><path d="M10 3h4v12h-4z"/></svg>
              </div>
              <h3 className="feature-card-title title-amber">Entrenamientos Adaptados</h3>
              <p className="feature-card-desc">
                Diseño a medida de planes de fuerza y acondicionamiento. Periodización inteligente de repeticiones y cargas de peso.
              </p>
            </div>

            {/* Card 4 */}
            <div className="feature-card card-rose">
              <div className="feature-icon-wrapper icon-rose">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2 H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
              </div>
              <h3 className="feature-card-title title-rose">Biomecánica & Postura</h3>
              <p className="feature-card-desc">
                Análisis técnico automatizado mediante visión artificial. Evaluación del rango de movimiento y corrección en tiempo real.
              </p>
            </div>

            {/* Card 5 */}
            <div className="feature-card card-violet">
              <div className="feature-icon-wrapper icon-violet">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3 className="feature-card-title title-violet">Balance Nutricional</h3>
              <p className="feature-card-desc">
                Contador logístico de calorías diarias ingeridas y quemadas. Reportes de macronutrientes personalizados según la disciplina.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auto Scrolling Marquee (Ticker tape) */}
      <div className="marquee-container">
        <div className="marquee-title">LA COMUNIDAD DE ENTRENADORES Y PREPARADORES DE ALTO RENDIMIENTO</div>
        <div className="marquee-track">
          <div className="marquee-content">
            <span><strong className="marquee-tick">✓</strong> Trustpilot 4.9/5</span>
            <span><strong className="marquee-tick">✓</strong> +1,000 Entrenadores</span>
            <span><strong className="marquee-tick">✓</strong> Respaldo Antropométrico ISAK</span>
            <span><strong className="marquee-tick">✓</strong> Seguridad Supabase (Postgres)</span>
            <span><strong className="marquee-tick">✓</strong> IA Gemini Core Partner</span>
          </div>
          <div className="marquee-content">
            <span><strong className="marquee-tick">✓</strong> Trustpilot 4.9/5</span>
            <span><strong className="marquee-tick">✓</strong> +1,000 Entrenadores</span>
            <span><strong className="marquee-tick">✓</strong> Respaldo Antropométrico ISAK</span>
            <span><strong className="marquee-tick">✓</strong> Seguridad Supabase (Postgres)</span>
            <span><strong className="marquee-tick">✓</strong> IA Gemini Core Partner</span>
          </div>
        </div>
      </div>

      {/* Challenge Section: El Problema vs La Plataforma */}
      <section className="challenge-section">
        <div className="pricing-header" style={{ marginBottom: "50px" }}>
          <span className="hero-tag">El Desafío del Preparador Físico</span>
          <h2 className="pricing-title" style={{ fontSize: "2.8rem", lineHeight: "1.1", letterSpacing: "-1.5px" }}>
            Llevar el control de tus atletas se volvió <br />
            <span style={{ fontWeight: 900 }}>un caos operativo.</span>
          </h2>
          <p className="pricing-subtitle" style={{ fontSize: "1.2rem", maxWidth: "680px", margin: "20px auto 0 auto", color: "var(--text-muted)", fontWeight: 500 }}>
            No es tu falta de profesionalismo. Es la ausencia de herramientas integradas diseñadas para conectar la ciencia antropométrica, la biomecánica y la suplementación en un solo lugar.
          </p>
        </div>

        <div className="challenge-grid">
          {/* El Problema */}
          <div className="challenge-card problem">
            <h3 className="challenge-card-title">
              <span style={{ fontSize: "1.5rem" }}>⚠️</span> El Problema
            </h3>
            <ul className="challenge-list">
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Desconexión en suplementación:</strong> El 73% de los atletas interrumpe su ingesta diaria de nutrientes clave (como la creatina) por olvido o falta de alertas de stock.</span>
              </li>
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Falta de precisión biomecánica:</strong> Las lesiones por mala postura en ejercicios de fuerza (como sentadillas) ocurren por no tener un análisis objetivo de ángulos en tiempo real.</span>
              </li>
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Pérdida de adherencia:</strong> Los atletas que no visualizan gráficamente sus cambios antropométricos tienen un 40% más de probabilidad de abandonar sus objetivos.</span>
              </li>
            </ul>
          </div>

          {/* La Solución ZEROFIT */}
          <div className="challenge-card solution">
            <h3 className="challenge-card-title">
              <span style={{ fontSize: "1.5rem" }}>✨</span> La Solución ZEROFIT
            </h3>
            <ul className="challenge-list">
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Control logístico inteligente:</strong> Alertas dinámicas de stock y periodización de dosis por ciclos garantizan consistencia metabólica total.</span>
              </li>
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Visión por Computadora (IA):</strong> Análisis angular inmediato de la columna y rodillas para corregir posturas antes de que ocurran sobrecargas o lesiones.</span>
              </li>
              <li className="challenge-list-item">
                <span className="challenge-dot"></span>
                <span><strong>Somatocarta Interactiva:</strong> Mapeo científico del somatotipo (Endo, Meso, Ectomorfia) en tiempo real para motivar a tus atletas mostrando su evolución real.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Showcase Playground */}
      <section className="showcase-section">
        <div className="pricing-header">
          <span className="hero-tag">Demostración Interactiva</span>
          <h2 className="pricing-title">Experimenta la Tecnología de ZEROFIT</h2>
          <p className="pricing-subtitle">
            Prueba en tiempo real los motores de análisis y control que tus atletas verán en sus perfiles web.
          </p>
        </div>

        <div className="showcase-container">
          <div className="showcase-tabs">
            <button
              type="button"
              className={`showcase-tab-btn ${showcaseTab === "somatochart" ? "active" : ""}`}
              onClick={() => setShowcaseTab("somatochart")}
            >
              📊 Somatocarta Dinámica
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${showcaseTab === "posture" ? "active" : ""}`}
              onClick={() => setShowcaseTab("posture")}
            >
              🎥 Biomecánica IA (Squat)
            </button>
            <button
              type="button"
              className={`showcase-tab-btn ${showcaseTab === "supplements" ? "active" : ""}`}
              onClick={() => setShowcaseTab("supplements")}
            >
              💊 Control de Stock
            </button>
          </div>

          <div className="showcase-content">
            {/* Left Column: Interactive Playground Panel */}
            {showcaseTab === "somatochart" && (
              <>
                <div className="playground-card animate-fade-in">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Simulador de Somatotipo</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Ajusta los sliders de desarrollo físico para calcular el somatotipo Heath-Carter y ver el punto en el gráfico.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                        <span>Mesomorfia (Muscularidad)</span>
                        <strong>{mesoVal}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="showcase-slider"
                        value={mesoVal}
                        onChange={(e) => setMesoVal(parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                        <span>Endomorfia (Adiposidad)</span>
                        <strong>{endoVal}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="showcase-slider"
                        value={endoVal}
                        onChange={(e) => setEndoVal(parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                        <span>Ectomorfia (Delgadez/Longitud)</span>
                        <strong>{ectoVal}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="showcase-slider"
                        value={ectoVal}
                        onChange={(e) => setEctoVal(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,128,128,0.05)", border: "1px solid rgba(0,128,128,0.15)", borderRadius: "10px", padding: "12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clasificación del Somatotipo:</span>
                    <h5 style={{ margin: "4px 0 0 0", fontSize: "1.1rem", fontWeight: 800, color: "var(--sano-teal)" }}>
                      {mesoVal > endoVal && mesoVal > ectoVal ? "Mesomorfo Dominante (Alta masa muscular)" :
                       endoVal > mesoVal && endoVal > ectoVal ? "Endomorfo Dominante (Mayor retención lipídica)" :
                       ectoVal > mesoVal && ectoVal > endoVal ? "Ectomorfo Dominante (Estructura ósea delgada/magra)" :
                       "Somatotipo Balanceado"}
                    </h5>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                  <div className="interactive-somatocarta">
                    <div className="somato-grid-x"></div>
                    <div className="somato-grid-y"></div>
                    
                    {/* Dynamic Point on Somatochart */}
                    <div 
                      className="somato-interactive-point"
                      style={{
                        left: `${50 + (ectoVal - endoVal) * 4.5}%`,
                        top: `${50 - (2 * mesoVal - (endoVal + ectoVal)) * 2.5}%`
                      }}
                    ></div>
                    
                    <span style={{ position: "absolute", top: "10px", fontSize: "0.7rem", color: "#64748b", fontWeight: "bold" }}>Mesomorfo (Fuerza)</span>
                    <span style={{ position: "absolute", bottom: "10px", left: "10px", fontSize: "0.7rem", color: "#64748b", fontWeight: "bold" }}>Endomorfo (Grasa)</span>
                    <span style={{ position: "absolute", bottom: "10px", right: "10px", fontSize: "0.7rem", color: "#64748b", fontWeight: "bold" }}>Ectomorfo (Magra)</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Gráfico de Somatocarta interactivo tridimensional</span>
                </div>
              </>
            )}

            {showcaseTab === "posture" && (
              <>
                <div className="playground-card animate-fade-in">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Evaluación Biomecánica por Visión Artificial</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Monitoreo angular del fémur y la columna lumbar durante la sentadilla para prevenir sobrecargas.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Ángulo de Flexión de Rodilla:</span>
                      <strong style={{ color: "var(--sano-teal)", fontSize: "1.1rem" }}>{Math.round(postureAngle)}°</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Estado del Ejercicio:</span>
                      <strong style={{ color: postureAngle < 120 ? "#f43f5e" : "#10b981" }}>
                        {postureAngle < 120 ? "🚨 Rango Crítico de Butt Wink" : "✓ Rango Seguro"}
                      </strong>
                    </div>
                  </div>

                  {postureAngle < 120 ? (
                    <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "10px", padding: "12px", fontSize: "0.85rem", color: "#f43f5e", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🚨</span> <span><strong>Retroversión Pélvica Detectada:</strong> El fémur desciende por debajo de la horizontal y hay flexión lumbar.</span>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "12px", fontSize: "0.85rem", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✓</span> <span>Alineación óptima de la columna lumbar. Rango articular seguro.</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                  <div className="interactive-somatocarta" style={{ background: "#0f172a", border: "1px solid #334155" }}>
                    <div className="scanner-line"></div>
                    
                    {/* Simulated stick-figure posture skeleton */}
                    <svg width="200" height="200" viewBox="0 0 100 100">
                      <line x1="50" y1="20" x2="50" y2="50" stroke="white" strokeWidth="3" />
                      <line 
                        x1="50" 
                        y1="50" 
                        x2={50 - (180 - postureAngle) * 0.15} 
                        y2={50 + (180 - postureAngle) * 0.25} 
                        stroke={postureAngle < 120 ? "#f43f5e" : "#00f2fe"} 
                        strokeWidth="3.5" 
                      />
                      <line 
                        x1={50 - (180 - postureAngle) * 0.15} 
                        y1={50 + (180 - postureAngle) * 0.25} 
                        x2="45" 
                        y2="85" 
                        stroke="white" 
                        strokeWidth="3" 
                      />
                      <circle cx="50" cy="12" r="5" fill="white" />
                      <circle cx="50" cy="50" r="3" fill="#fbbf24" />
                      <circle 
                        cx={50 - (180 - postureAngle) * 0.15} 
                        cy={50 + (180 - postureAngle) * 0.25} 
                        r="3" 
                        fill={postureAngle < 120 ? "#f43f5e" : "#00f2fe"} 
                      />
                    </svg>

                    <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "0.65rem", color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                      IA TELEMETRY ACTIVE
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Simulación del modelo biomecánico en sentadilla profunda</span>
                </div>
              </>
            )}

            {showcaseTab === "supplements" && (
              <>
                <div className="playground-card animate-fade-in">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, fontWeight: 800 }}>Monitoreo de Suplementación y Control de Stock</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Simula el consumo diario de un deportista para ver cómo se desgasta el stock y se activa la alerta inteligente de reposición.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Suplemento:</span>
                      <strong>Creatina Creapure (300g)</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Dosis Diaria:</span>
                      <strong>5 gramos / día</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Stock Restante:</span>
                      <strong style={{ color: suppStock <= 20 ? "#f43f5e" : "#10b981", fontSize: "1.1rem" }}>{suppStock}%</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "8px 12px", fontSize: "0.85rem", flex: 1 }}
                      onClick={() => setSuppStock(prev => Math.max(0, prev - 10))}
                    >
                      Consumo Diario (-10%)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      onClick={() => setSuppStock(100)}
                    >
                      Recargar Tarro
                    </button>
                  </div>

                  {suppStock <= 20 ? (
                    <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "10px", padding: "12px", fontSize: "0.85rem", color: "#f43f5e", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🚨</span> <span><strong>Alerta de Stock Crítico:</strong> Notificación enviada al panel del entrenador. Reposición requerida de inmediato.</span>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "12px", fontSize: "0.85rem", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>✓</span> <span>Niveles de stock estables. Quedan ${(suppStock * 300) / 100} gramos en despensa.</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", justifyContent: "center" }}>
                  <div className="interactive-somatocarta">
                    <svg width="150" height="150">
                      <circle cx="75" cy="75" r="55" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                      <circle 
                        cx="75" 
                        cy="75" 
                        r="55" 
                        stroke={suppStock <= 20 ? "#f43f5e" : "#00f2fe"} 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray="345" 
                        strokeDashoffset={345 - (345 * suppStock) / 100} 
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.4s ease" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", fontSize: "1.8rem", fontWeight: "900", color: "var(--sano-dark)" }}>
                      {suppStock}%
                    </div>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Anillo logístico de stock restante del atleta</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Science Section: Respaldo Científico */}
      <section className="science-section">
        <div className="science-container">
          <div className="science-grid">
            <div className="science-content">
              <span className="hero-tag">Ciencia del Deporte</span>
              <h2 className="pricing-title" style={{ textAlign: "left", marginTop: "10px" }}>
                Metodología y Respaldo Fisiológico
              </h2>
              <p className="science-subtitle" style={{ margin: "0 0 30px 0", textAlign: "left" }}>
                ZEROFIT no es solo software; está construido bajo estándares y metodologías validadas internacionalmente para la preparación física.
              </p>

              <div className="science-item">
                <h4 className="science-item-title">🔬 Protocolo ISAK y Somatocarta de Heath-Carter</h4>
                <p className="science-item-desc">
                  Utilizamos la correlación antropométrica oficial de Heath-Carter para posicionar a los atletas en la somatocarta tridimensional. Esto permite ajustar las cargas de carbohidratos y el volumen de entrenamiento según la dominancia muscular y metabólica de cada individuo.
                </p>
              </div>

              <div className="science-item">
                <h4 className="science-item-title">⚡ Farmacocinética de Suplementos (Saturación y Dosis)</h4>
                <p className="science-item-desc">
                  La consistencia temporal es vital. Nuestro sistema de alertas calcula la tasa de agotamiento de stock en función de la dosis diaria prescrita (por ejemplo, 5g diarios de creatina para mantener los niveles óptimos de fosfocreatina muscular), asegurando que el atleta reponga su suplementación a tiempo.
                </p>
              </div>
            </div>

            <div className="science-badge-card">
              <span style={{ fontSize: "2.5rem" }}>🧬</span>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Efecto Fisiológico</h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Estudios científicos indican que el seguimiento visual del progreso somatotípico y la consistencia en planes nutricionales estructurados incrementan la tasa de retención de atletas en un 85% y aceleran los resultados de ganancia de masa magra en un 18%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="pricing-header">
          <span className="hero-tag">Historias de Éxito</span>
          <h2 className="pricing-title">Preparadores que confían en nosotros</h2>
          <p className="pricing-subtitle">
            Descubre cómo otros entrenadores y deportistas profesionales están optimizando su metodología de trabajo con ZEROFIT.
          </p>
        </div>

        <div className="testimonials-grid">
          {/* Testimonial 1 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              "El análisis de postura por IA me permitió detectar un valgo de rodilla severo en uno de mis levantadores antes de que hiciera una lesión grave. Además, mis atletas adoran ver su punto desplazarse en la somatocarta."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">AM</div>
              <div className="author-info">
                <span className="author-name">Andrés Mendoza</span>
                <span className="author-title">Preparador Físico, Certificado ISAK II</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              "Centralizar la suplementación y las alertas de stock con ZEROFIT me ahorró horas de responder mensajes sobre dosis. La retención de mis atletas subió drásticamente al ofrecerles un portal web con su QR."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">LG</div>
              <div className="author-info">
                <span className="author-name">Laura Gómez</span>
                <span className="author-title">Nutricionista Deportiva</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="testimonial-card">
            <p className="testimonial-text">
              "Como entrenador, poder ocultar suplementos del catálogo general y agregar mis propias marcas recomendadas con enlace directo a mi WhatsApp cambió las reglas del juego. Mis clientes adoran la sencillez."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">CR</div>
              <div className="author-info">
                <span className="author-name">Carlos Rodríguez</span>
                <span className="author-title">Coach de Fuerza y Acondicionamiento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="pricing-section" id="plans-section">
        <div className="pricing-header">
          <span className="hero-tag">Membresías ZEROFIT</span>
          <h2 className="pricing-title">Planes para Entrenadores y Preparadores</h2>
          <p className="pricing-subtitle">
            Elige el plan ideal para llevar el control de tus atletas y brindarles una experiencia premium.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Plan Seed */}
          <div className="pricing-card">
            <h3 className="plan-name">Semilla (Gratuito)</h3>
            <div className="plan-price">$0 <span>/ mes</span></div>
            <ul className="plan-features">
              <li className="plan-feature-item"><span className="feature-check">✓</span> 1 Atleta activo</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Somatocarta básica</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Registro manual de datos</li>
              <li className="plan-feature-item" style={{textDecoration: "line-through", opacity: 0.5}}><span className="feature-check">✕</span> Planes de ejercicio ilimitados</li>
              <li className="plan-feature-item" style={{textDecoration: "line-through", opacity: 0.5}}><span className="feature-check">✕</span> IA de Postura avanzada</li>
            </ul>
            <button className="plan-btn" onClick={scrollToLogin}>Comenzar Gratis</button>
          </div>

          {/* Plan Pro */}
          <div className="pricing-card popular">
            <span className="popular-badge">Más Popular</span>
            <h3 className="plan-name">Profesional (Pro)</h3>
            <div className="plan-price">$19.99 <span>/ mes</span></div>
            <ul className="plan-features">
              <li className="plan-feature-item"><span className="feature-check">✓</span> Hasta 30 Atletas activos</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Inteligencia Artificial de Postura</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Catálogo de Suplementos a medida</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Biblioteca de Ejercicios personalizada</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Generación con Gemini AI</li>
            </ul>
            <button className="plan-btn primary-btn" onClick={scrollToLogin}>Adquirir Plan Pro</button>
          </div>

          {/* Plan Gym */}
          <div className="pricing-card">
            <h3 className="plan-name">Elite (Gimnasio)</h3>
            <div className="plan-price">$49.99 <span>/ mes</span></div>
            <ul className="plan-features">
              <li className="plan-feature-item"><span className="feature-check">✓</span> Atletas ilimitados</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Reportes Estéticos PDF</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Soporte Prioritario 24/7</li>
              <li className="plan-feature-item"><span className="feature-check">✓</span> Todas las funciones de la IA</li>
            </ul>
            <button className="plan-btn" onClick={scrollToLogin}>Contactar Elite</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" style={{ maxWidth: "800px", margin: "80px auto", padding: "0 24px" }}>
        <div className="pricing-header" style={{ marginBottom: "40px" }}>
          <span className="hero-tag">Preguntas Frecuentes</span>
          <h2 className="pricing-title">Respuestas a tus Dudas</h2>
          <p className="pricing-subtitle">
            Todo lo que necesitas saber sobre cómo ZEROFIT ayuda a potenciar los resultados de tus atletas.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* FAQ 1 */}
          <div 
            className="glass-card faq-item" 
            style={{ 
              background: "white", 
              border: "1px solid var(--sano-glass-border)", 
              borderRadius: "20px", 
              padding: "20px 24px", 
              cursor: "pointer",
              boxShadow: "var(--sano-card-shadow)",
              transition: "all 0.2s ease"
            }}
            onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--sano-dark)" }}>
                ¿Cómo acceden mis atletas a sus módulos?
              </h4>
              <span style={{ fontSize: "1.4rem", color: "var(--sano-teal)", fontWeight: "bold" }}>
                {activeFaq === 0 ? "−" : "+"}
              </span>
            </div>
            {activeFaq === 0 && (
              <p style={{ margin: "12px 0 0 0", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                Cada atleta tiene un código QR único e independiente que puedes generar y compartir desde tu consola de entrenador. Al escanear el QR, tu alumno entra a su portal web personalizado donde puede consultar sus pautas nutricionales, entrenamientos y stock de suplementación, sin necesidad de crear contraseñas.
              </p>
            )}
          </div>

          {/* FAQ 2 */}
          <div 
            className="glass-card faq-item" 
            style={{ 
              background: "white", 
              border: "1px solid var(--sano-glass-border)", 
              borderRadius: "20px", 
              padding: "20px 24px", 
              cursor: "pointer",
              boxShadow: "var(--sano-card-shadow)",
              transition: "all 0.2s ease"
            }}
            onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--sano-dark)" }}>
                ¿Qué es el análisis biomecánico por visión artificial?
              </h4>
              <span style={{ fontSize: "1.4rem", color: "var(--sano-teal)", fontWeight: "bold" }}>
                {activeFaq === 1 ? "−" : "+"}
              </span>
            </div>
            {activeFaq === 1 && (
              <p style={{ margin: "12px 0 0 0", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                Es un software que mide ángulos articulares en tiempo real. Mediante la cámara del teléfono o laptop del atleta, analiza los grados de inclinación en rodillas y columna durante movimientos críticos (como la sentadilla profunda) para alertar sobre riesgos de lesión antes de levantar cargas pesadas.
              </p>
            )}
          </div>

          {/* FAQ 3 */}
          <div 
            className="glass-card faq-item" 
            style={{ 
              background: "white", 
              border: "1px solid var(--sano-glass-border)", 
              borderRadius: "20px", 
              padding: "20px 24px", 
              cursor: "pointer",
              boxShadow: "var(--sano-card-shadow)",
              transition: "all 0.2s ease"
            }}
            onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--sano-dark)" }}>
                ¿Cómo ayuda ZEROFIT a evitar que mis atletas olviden sus suplementos?
              </h4>
              <span style={{ fontSize: "1.4rem", color: "var(--sano-teal)", fontWeight: "bold" }}>
                {activeFaq === 2 ? "−" : "+"}
              </span>
            </div>
            {activeFaq === 2 && (
              <p style={{ margin: "12px 0 0 0", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                Contamos con un sistema inteligente de control de stock. Al prescribir un suplemento con su dosis diaria, la app calcula la vida útil del tarro. Si los niveles bajan del 20%, envía una notificación al panel del entrenador para recordar la reposición, mejorando la consistencia del atleta.
              </p>
            )}
          </div>

          {/* FAQ 4 */}
          <div 
            className="glass-card faq-item" 
            style={{ 
              background: "white", 
              border: "1px solid var(--sano-glass-border)", 
              borderRadius: "20px", 
              padding: "20px 24px", 
              cursor: "pointer",
              boxShadow: "var(--sano-card-shadow)",
              transition: "all 0.2s ease"
            }}
            onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "var(--sano-dark)" }}>
                ¿El plan gratuito tiene algún límite?
              </h4>
              <span style={{ fontSize: "1.4rem", color: "var(--sano-teal)", fontWeight: "bold" }}>
                {activeFaq === 3 ? "−" : "+"}
              </span>
            </div>
            {activeFaq === 3 && (
              <p style={{ margin: "12px 0 0 0", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-muted)" }}>
                El plan Semilla (gratuito) te permite registrar 1 atleta de forma permanente con somatocarta básica y registro manual. Para gestionar grupos mayores de atletas, habilitar el generador de dietas por IA (Gemini), la visión artificial de postura o exportar reportes estéticos PDF, debes actualizar a los planes Pro o Elite.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Login Portal Section */}
      <section className="login-section" id="login-section">
        <div className="login-card">
          <div className="login-tabs">
            <div 
              className={`login-tab ${isLogin ? "active" : ""}`} 
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
            >
              Ingresar
            </div>
            <div 
              className={`login-tab ${!isLogin ? "active" : ""}`} 
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
            >
              Registrarse (Gratis)
            </div>
          </div>

          <h2 className="login-title">
            {isLogin ? "Acceso al Portal ZEROFIT" : "Crea tu Cuenta de Entrenador"}
          </h2>
          <p className="login-desc">
            {isLogin 
              ? "Ingresa tus credenciales de entrenador." 
              : "Accede a tu propio portal de entrenamiento independiente."}
          </p>
          
          {isLogin ? (
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label className="input-label">Correo Electrónico / Usuario</label>
                <div className="input-field-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. entrenador@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="input-field-wrapper">
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="options-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  Mantener mi sesión iniciada
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Iniciando Sesión...
                  </>
                ) : (
                  "Ingresar a la Plataforma"
                )}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegisterSubmit}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <div className="input-field-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <div className="input-field-wrapper">
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Ej. juan@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label className="input-label">País</label>
                  <div className="input-field-wrapper">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej. México"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Celular</label>
                  <div className="input-field-wrapper">
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="Ej. +5212345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label className="input-label">Contraseña</label>
                  <div className="input-field-wrapper">
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirmar</label>
                  <div className="input-field-wrapper">
                    <input
                      type="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message" style={{ background: "rgba(50, 205, 50, 0.08)", border: "1px solid rgba(50, 205, 50, 0.2)", color: "var(--sano-teal)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600" }}>{success}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creando Cuenta...
                  </>
                ) : (
                  "Registrarme como Entrenador"
                )}
              </button>
            </form>
          )}

          <div className="divider">o bien</div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "12px", minHeight: "44px" }}>
            <div id="google-signin-btn-container" style={{ width: "320px" }}></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 ZEROFIT Logistics & Performance. Todos los derechos reservados.</p>
      </footer>

      {/* Google modal removed */}
    </div>
  );
}
