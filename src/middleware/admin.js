const admin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).send(`
      <html>
        <head><title>Access Denied</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🚫 Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
          <a href="/dashboard" style="color: #6366f1;">Go to Dashboard</a>
        </body>
      </html>
    `);
  }
  next();
};

module.exports = admin;