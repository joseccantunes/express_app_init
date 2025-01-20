import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import { Document, model, Query, Schema } from 'mongoose';
import validator from 'validator';

// Define an interface for the User document
export interface IUser extends Document {
    name: string;
    email: string;
    photo: string;
    role: 'user' | 'guide' | 'lead-guide' | 'admin';
    password: string;
    passwordConfirm?: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    active: boolean;
    correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    createPasswordResetToken(): string;
}

// Define the user schema
const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (this: IUser, el: string): boolean {
                return el === this.password;
            },
            message: 'Passwords are not the same!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

// Middleware to hash the password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

// Middleware to set `passwordChangedAt` for password updates
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = new Date(Date.now() - 1000); // Ensure token is always issued after this field
    next();
});

// Query middleware to exclude inactive users
userSchema.pre<Query<any, IUser>>(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// Instance method to check if passwords match
userSchema.methods.correctPassword = async function (candidatePassword: string, userPassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if the password was changed after token issuance
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number): boolean {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }

    return false; // Password not changed
};

// Instance method to create a password reset token
userSchema.methods.createPasswordResetToken = function (): string {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return resetToken;
};

// Define and export the User model
export const User = model('User', userSchema);
