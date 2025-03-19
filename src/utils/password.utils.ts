import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();


if (!process.env.PASSWORD_SALT_ROUNDS) {
  throw new Error("Missing environment variable: PASSWORD_SALT_ROUNDS");
}
if (!process.env.PASSWORD_MIN_LENGTH) {
  throw new Error("Missing environment variable: PASSWORD_MIN_LENGTH");
}

const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS, 10);
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH, 10);


export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};


export const validatePasswordComplexity = (
  password: string
): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  // Check for uppercase, lowercase, number, and special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const missingRequirements = [];
  if (!hasUppercase) missingRequirements.push("uppercase letter");
  if (!hasLowercase) missingRequirements.push("lowercase letter");
  if (!hasNumber) missingRequirements.push("number");
  if (!hasSpecialChar) missingRequirements.push("special character");

  if (missingRequirements.length > 0) {
    return {
      isValid: false,
      message: `Password must include at least one ${missingRequirements.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
};
