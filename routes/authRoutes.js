const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as needed
const router = express.Router(); // Initialize the router
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret';
// Create JWT token function
const createToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '5s' });
};
//
const generateRefreshToken = (payload) => {
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '10s' });
  refreshTokens.add(refreshToken);
  return refreshToken;
};
// Signup route
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = new User({ username, email, password, role: 'admin' });
    await newUser.save();

    const token = createToken(newUser._id, newUser.role);

    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user._id, user.role);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
//admin
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("authHeader:",authHeader);
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the secret key
    req.user = decoded; // Attach decoded token payload to the request
    return res.status(200).json({message:"Admin Data"})
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};
//
router.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token' });
  }

  try {
      const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      const newAccessToken = generateAccessToken({ username: payload.username });
      return res.json({ accessToken: newAccessToken });
  } catch (error) {
      return res.status(403).json({ message: 'Invalid refresh token' });
  }
});
router.post("/admin",verifyToken);

module.exports = verifyToken;

// Export the router
module.exports = router;
