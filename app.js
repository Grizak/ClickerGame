const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path as necessary
const app = express();
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const mongoURI = process.env.DBURI

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure you have 'views' directory
app.use(expressLayouts);
app.set('layout', 'layouts/layout');

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to mongoDB: ' + err));

// Session setup
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI }),
    cookie: { maxAge: 180 * 60 * 1000 }
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized access' });
    }
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if username is already taken
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    const user = req.session.userId ? req.session.userId : null;
    return res.render('error', { title: "Error", user, error: "Username already taken" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({
      username: username,
      password: hashedPassword,
      points: 0
  });

  // Save user to the database
  await newUser.save();

  // Set session user ID
  req.session.userId = newUser._id;

  const user = req.session.userId ? req.session.userId : null;
  res.render('success', { title: "Success", message: "Registration successfull", user });
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username });
  if (!user) {
    return res.render('error', { title: "Error", user, error: "Invalid username" });
  }

  // Compare the password with the hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  // Set session user ID
  req.session.userId = user._id;

  res.render('success', { title: "Success", message: "Login succesfull", user })
});


app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return res.redirect('/')
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      const user = req.session.userId ? req.session.userId : null;
      res.render('success', { title: "Success", message: "Logout successfull", user });
  });
});

app.post('/update-points', isAuthenticated, async (req, res) => {
  const { points } = req.body;

  // Update user's points in the database
  await User.findByIdAndUpdate(req.session.userId, { points });

  res.json({ message: 'Points updated' });
});

app.post('/purchase-item', isAuthenticated, async (req, res) => {
  const { itemEffect, itemCost } = req.body;

  try {
      // Find the user
      const user = await User.findById(req.session.userId);

      // Check if they have enough points
      if (user.points < itemCost) {
          return res.json({ success: false, message: 'Not enough points.' });
      }

      // Check if they already bought the item
      if (user.purchasedItems && user.purchasedItems.includes(itemEffect)) {
          return res.json({ success: false, message: 'Item already purchased.' });
      }

      // Deduct points and store the purchased item
      user.points -= itemCost;
      user.purchasedItems = user.purchasedItems || [];
      user.purchasedItems.push(itemEffect);

      await user.save();

      res.json({ success: true, newPoints: user.points });
  } catch (error) {
      console.error('Error purchasing item:', error);
      res.status(500).json({ success: false, message: 'Failed to purchase item.' });
  }
});

app.get('/', (req, res) => {
  const user = req.session.userId ? req.session.userId : null;
  res.render('index', { title: "Home", user });
});

app.get('/register', (req, res) => {
  const user = req.session.userId ? req.session.userId : null;
  res.render('register', { title: "Register", user });
});

app.get('/login', (req, res) => {
  const user = req.session.userId ? req.session.userId : null;
  res.render('login', { title: "Login", user });
});

app.get('/game', isAuthenticated, async (req, res) => {
  try {
      // Find the user in the database using the session's userId
      const user = await User.findById(req.session.userId);

      if (!user) {
          return res.status(404).send('User not found');
      }

      const purchasedItems = user.purchasedItems || [];

      // Pass the user's points to the EJS template
      res.render('game', { title: "Home", user, points: user.points || 0, purchasedItems });  // Default to 0 if points is undefined
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Internal Server Error');
  }
});


// Shop Route
app.get('/shop', isAuthenticated, async (req, res) => {
  const shopItems = [
      { name: 'Double Click Power', cost: 50, effect: 'double-click-power' },
      { name: 'Auto Clicker', cost: 100, effect: 'auto-clicker' },
      { name: 'Triple Click Power', cost: 150, effect: 'triple-click-power' },
      { name: 'Mega Click', cost: 250, effect: 'mega-click' },
  ];

  try {
      // Find the user and pass their points and items to the shop
      const user = await User.findById(req.session.userId);
      res.render('shop', { title: "Shop", user, points: user.points, purchasedItems: user.purchasedItems || [], shopItems });
  } catch (error) {
      console.error('Error fetching shop data:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.get('/leaderboard', isAuthenticated, async (req, res) => {
  // Fetch leaderboard logic...
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
