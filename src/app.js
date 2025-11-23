const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const User = require('./models/User');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/user'));
app.use('/payment', require('./routes/payment'));
app.use('/admin', require('./routes/admin'));

// Home route - Landing page
app.get('/', (req, res) => {
  res.render('index');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const initApp = async () => {
  try {
    await initDatabase();
    
    const adminExists = await User.findByEmail(process.env.ADMIN_EMAIL);
    if (!adminExists) {
      await User.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        full_name: 'Admin',
        phone: '0000000000',
        is_admin: true
      });
      console.log('✅ Admin user created');
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HarshPay server running on port ${PORT}`);
      console.log(`📱 Open http://localhost:${PORT} in your browser`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
};

initApp();

module.exports = app;