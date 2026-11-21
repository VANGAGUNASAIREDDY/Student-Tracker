
import { getStudents } from "../utils/storage";
import { getFaculty } from "../utils/facultyUtils";

const PENDING_OTP_KEY = "studentTracker_pendingOTP";
const AUTH_SESSION_KEY = "studentTracker_session";

const generateOTP = () => {
  const randomArray = new Uint32Array(1);
  window.crypto.getRandomValues(randomArray);

  return String(randomArray[0] % 1000000).padStart(6, "0");
};

const createOTP = (user) => {
  const otp = generateOTP();

  const pendingData = {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      assignedClass: user.assignedClass || user.class || null,
      primarySubject: user.primarySubject || null
    },
    otp,
    expiresAt: Date.now() + 2 * 60 * 1000
  };

  sessionStorage.setItem(
    PENDING_OTP_KEY,
    JSON.stringify(pendingData)
  );

  return {
    success: true,
    otp,
    expiresAt: pendingData.expiresAt
  };
};

export const startLogin = (id, password, role) => {
  const cleanId = id.trim().toUpperCase();

  let account = null;

  if (role === "student") {
    account = getStudents().find(
      (student) =>
        student.id.toUpperCase() === cleanId &&
        student.password === password
    );
  } else if (role === "faculty") {
    account = getFaculty().find(
      (member) =>
        member.id.toUpperCase() === cleanId &&
        member.password === password
    );
  }

  if (!account) {
    return {
      success: false,
      message: "Invalid ID or password. Please try again."
    };
  }

  const user = {
    id: account.id,
    name: account.name,
    role,
    assignedClass: account.assignedClass || account.class || null,
    primarySubject: account.primarySubject || null
  };

  return createOTP(user);
};

export const getPendingOTP = () => {
  try {
    const savedData = sessionStorage.getItem(PENDING_OTP_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch {
    return null;
  }
};

export const verifyOTP = (enteredOTP) => {
  const pending = getPendingOTP();

  if (!pending) {
    return {
      success: false,
      message: "No pending OTP found. Please log in again."
    };
  }

  if (Date.now() > pending.expiresAt) {
    sessionStorage.removeItem(PENDING_OTP_KEY);

    return {
      success: false,
      message: "OTP has expired. Please log in again."
    };
  }

  if (String(enteredOTP).trim() !== pending.otp) {
    return {
      success: false,
      message: "Incorrect OTP. Please try again."
    };
  }

  const session = {
    ...pending.user,
    authenticatedAt: Date.now()
  };

  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session)
  );

  sessionStorage.removeItem(PENDING_OTP_KEY);

  return {
    success: true,
    user: session
  };
};

export const resendOTP = () => {
  const pending = getPendingOTP();

  if (!pending) {
    return {
      success: false,
      message: "Please log in again to request an OTP."
    };
  }

  return createOTP(pending.user);
};

export const getCurrentSession = () => {
  try {
    const savedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  } catch {
    return null;
  }
};

export const logout = () => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(PENDING_OTP_KEY);
};

export const isAuthenticated = () => {
  return getCurrentSession() !== null;
};
