import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    // Validate input
    if (!fullName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    // Create new user
    const newUser = await User.create({
      name: fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'user',
      telegramLinked: false,
      notificationPrefs: {
        tasks: true,
        payments: true,
        policies: true,
        monthlyReport: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(newUser._id.toString(), newUser.username);
    const refreshToken = generateRefreshToken(newUser._id.toString(), newUser.username);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log activity
    await logActivity(req, {
      action: 'CREATE',
      entity: 'user',
      entityId: newUser._id.toString(),
      details: { username: newUser.username },
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser.toJSON(),
      accessToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.username);
    const refreshToken = generateRefreshToken(user._id.toString(), user.username);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log activity
    await logActivity(req, {
      action: 'LOGIN',
      entity: 'user',
      entityId: user._id.toString(),
    });

    return res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Log activity
    if (req.userId) {
      await logActivity(req, {
        action: 'LOGOUT',
        entity: 'user',
        entityId: req.userId,
      });
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Server error during logout' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id.toString(), user.username);

    // Set new token in cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.json({
      message: 'Token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Server error during token refresh' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const demoLogin = async (req: AuthRequest, res: Response) => {
  try {
    // Find or create demo user
    let user = await User.findOne({ username: 'demo' });

    if (!user) {
      user = await User.create({
        name: 'Demo User',
        username: 'demo',
        email: 'demo@fintask.local',
        passwordHash: 'demo123',
        role: 'user',
        telegramLinked: false,
        notificationPrefs: {
          tasks: true,
          payments: true,
          policies: true,
          monthlyReport: true,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.username);
    const refreshToken = generateRefreshToken(user._id.toString(), user.username);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: 'Demo login successful',
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Server error during demo login' });
  }
};
