
// src/pages/OTP.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  GraduationCap
} from "lucide-react";

import {
  verifyOTP,
  resendOTP,
  getPendingOTP
} from "../auth/auth";

import "../styles/OTP.css";

function OTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);
  const [demoOTP, setDemoOTP] = useState(
    sessionStorage.getItem("studentTracker_demoOTP") || ""
  );

  const [pending, setPending] = useState(getPendingOTP());

  // Update countdown every second.
  useEffect(() => {
    if (!pending) return;

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((pending.expiresAt - Date.now()) / 1000)
      );

      setRemainingTime(remaining);
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [pending]);

  // Redirect if there is no pending OTP.
  useEffect(() => {
    if (!pending) {
      navigate("/", { replace: true });
    }
  }, [pending, navigate]);

  const handleVerify = (event) => {
    event.preventDefault();

    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the complete six-digit OTP.");
      return;
    }

    const result = verifyOTP(otp);

    if (!result.success) {
      setError(result.message);

      if (result.message.includes("expired")) {
        setRemainingTime(0);
        setPending(null);
        sessionStorage.removeItem("studentTracker_demoOTP");
      }

      if (result.message.includes("log in again")) {
        setPending(null);
      }

      return;
    }

    sessionStorage.removeItem("studentTracker_demoOTP");

    const destination =
      result.user.role === "faculty"
        ? "/faculty"
        : "/student";

    navigate(destination, { replace: true });
  };

  const handleResend = () => {
    setError("");
    setOtp("");

    const result = resendOTP();

    if (!result.success) {
      setError(result.message);
      setPending(null);
      return;
    }

    setDemoOTP(result.otp);

    sessionStorage.setItem(
      "studentTracker_demoOTP",
      result.otp
    );

    setPending(getPendingOTP());
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  if (!pending) return null;

  return (
    <div className="otp-page">

      <div className="otp-card">

        <div className="otp-logo">
          <GraduationCap size={30} />
        </div>

        <div className="otp-heading">

          <h1>OTP Verification</h1>

          <p>
            Hello, <strong>{pending.user.name}</strong>
          </p>

          <p>
            Enter the six-digit OTP generated for your login.
          </p>

        </div>

        <div className="otp-icon">
          <ShieldCheck size={36} />
        </div>

        <div className="demo-otp-box">

          <span>DEMO OTP</span>

          <h2>{demoOTP || "------"}</h2>

          <small>
            For demonstration purposes only
          </small>

        </div>

        <form onSubmit={handleVerify}>

          <label htmlFor="otpInput">
            Enter verification code
          </label>

          <input
            id="otpInput"
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "");

              setOtp(value);
              setError("");
            }}
          />

          <div className="otp-timer">
            {remainingTime > 0 ? (
              <>
                OTP expires in:

                <strong>
                  {formatTime(remainingTime)}
                </strong>
              </>
            ) : (
              <strong className="expired-text">
                OTP expired
              </strong>
            )}
          </div>

          {error && (
            <div className="otp-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="otp-verify-button"
            disabled={remainingTime <= 0}
          >
            Verify OTP
          </button>

        </form>

        <div className="otp-resend">

          <span>Didn't receive the code?</span>

          <button
            type="button"
            onClick={handleResend}
          >
            <RefreshCw size={16} />
            Resend OTP
          </button>

        </div>

        <button
          type="button"
          className="otp-back"
          onClick={() => {
            sessionStorage.removeItem("studentTracker_pendingOTP");
            sessionStorage.removeItem("studentTracker_demoOTP");

            navigate("/");
          }}
        >
          <ArrowLeft size={17} />
          Back to Login
        </button>

      </div>

    </div>
  );
}

export default OTP;
