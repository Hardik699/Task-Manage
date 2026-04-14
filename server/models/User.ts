import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

interface IUser {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'superadmin';
  telegramChatId?: string;
  telegramLinkCode?: string;
  telegramLinked: boolean;
  notificationPrefs: {
    tasks: boolean;
    payments: boolean;
    policies: boolean;
    monthlyReport: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'superadmin'],
      default: 'user',
    },
    telegramChatId: {
      type: String,
      unique: true,
      sparse: true,
    },
    telegramLinkCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    telegramLinked: {
      type: Boolean,
      default: false,
    },
    notificationPrefs: {
      tasks: {
        type: Boolean,
        default: true,
      },
      payments: {
        type: Boolean,
        default: true,
      },
      policies: {
        type: Boolean,
        default: true,
      },
      monthlyReport: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.passwordHash);
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const { passwordHash, ...user } = this.toObject();
  return user;
};

type UserDocument = IUser & { comparePassword: (password: string) => Promise<boolean>; toJSON: () => any };

export const User = (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ?? mongoose.model<UserDocument>('User', userSchema);
