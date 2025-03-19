import {
  comparePassword,
  hashPassword,
  validatePasswordComplexity,
} from "@/utils/password.utils";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        parseInt(process.env.PASSWORD_MINLENGTH || "8"),
        "Password must be at least 8 characters",
      ],
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for user's full name
UserSchema.virtual("fullName").get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Password validation middleware
UserSchema.pre("validate", async function (this: IUserDocument, next) {
  // Only validate password if it's modified
  if (this.isModified("password")) {
    const { isValid, message } = validatePasswordComplexity(this.password);
    if (!isValid) {
      this.invalidate("password", message || "Invalid password");
    }
  }
  next();
});

// Hash password before saving
UserSchema.pre("save", async function (this: IUserDocument, next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // Get the password field since it's not included in queries by default
  const user = await this.model("User").findById(this._id).select("+password");
  if (!user) return false;

  return comparePassword(candidatePassword, user.password);
};

const User = mongoose.model<IUserDocument>("User", UserSchema);
export default User;
