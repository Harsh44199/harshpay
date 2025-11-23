const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.registerPage = (req, res) => {
  res.render('auth/register', { error: null, user: null });
};

exports.loginPage = (req, res) => {
  res.render('auth/login', { error: null, user: null });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/register', {
        error: errors.array()[0].msg,
        user: null
      });
    }

    const { email, password, full_name, phone } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', {
        error: 'Email already registered',
        user: null
      });
    }

    const user = await User.create({ email, password, full_name, phone });
    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      error: 'Registration failed. Please try again.',
      user: null
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
        user: null
      });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
        user: null
      });
    }

    if (!user.is_active) {
      return res.render('auth/login', {
        error: 'Account is deactivated',
        user: null
      });
    }

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    if (user.is_admin) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      error: 'Login failed. Please try again.',
      user: null
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};