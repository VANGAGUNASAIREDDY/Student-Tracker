
// src/pages/Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  GraduationCap,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

import { startLogin } from "../auth/auth";

import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();

    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("Please enter your ID and password.");
      return;
    }

    setLoading(true);

    const result = startLogin(userId, password, role);

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Save demonstration OTP temporarily for display.
    sessionStorage.setItem(
      "studentTracker_demoOTP",
      result.otp
    );

    navigate("/otp", {
      state: { role }
    });
  };

  return (
    <div className="login-page">

      <div className="login-left">

        <div className="login-brand">
          <div className="brand-icon">
            <GraduationCap size={30} />
          </div>

          <span>Student Tracker</span>
        </div>

        <div className="login-hero">
          <span className="hero-label">
            ATTENDANCE MANAGEMENT SYSTEM
          </span>

          <h1>
            Smart Attendance
            <br />
            <span>Management</span>
          </h1>

          <p>
            A simple and efficient platform to manage
            student attendance, track academic progress,
            and stay connected with your classroom.
          </p>

          <div className="hero-features">

            <div>
              <ShieldCheck size={20} />
              <span>Secure role-based access</span>
            </div>

            <div>
              <GraduationCap size={20} />
              <span>Student and faculty dashboards</span>
            </div>

          </div>
        </div>

        <div className="login-footer">
          © 2026 Student Attendance Tracker
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <div className="mobile-brand">
            <GraduationCap size={28} />
            Student Tracker
          </div>

          <div className="login-heading">
            <h2>Welcome Back!</h2>

            <p>
              Please enter your credentials to continue.
            </p>
          </div>

          <div className="role-selection">

            <button
              type="button"
              className={
                role === "student"
                  ? "role-button active"
                  : "role-button"
              }
              onClick={() => {
                setRole("student");
                setError("");
              }}
            >
              <GraduationCap size={19} />
              Student
            </button>

            <button
              type="button"
              className={
                role === "faculty"
                  ? "role-button active"
                  : "role-button"
              }
              onClick={() => {
                setRole("faculty");
                setError("");
              }}
            >
              <User size={19} />
              Faculty
            </button>

          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">

              <label htmlFor="userId">
                {role === "student" ? "Student ID" : "Faculty ID"}
              </label>

              <div className="input-wrapper">

                <User size={19} />

                <input
                  id="userId"
                  type="text"
                  placeholder={
                    role === "student"
                      ? "Enter Student ID"
                      : "Enter Faculty ID"
                  }
                  value={userId}
                  onChange={(event) =>
                    setUserId(event.target.value)
                  }
                />

              </div>

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <Lock size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />
                  }
                </button>

              </div>

            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Sign In"}

              {!loading && <ArrowRight size={19} />}
            </button>

          </form>

          <div className="login-security">
            <ShieldCheck size={17} />
            OTP verification required after login
          </div>

          <div className="demo-credentials">

            <strong>Demo Login Credentials</strong>

            <p>
              Student: STU001 / Student@1
            </p>

            <p>
              Faculty: FAC001 / Faculty@123
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
