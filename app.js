const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Leaderboard = require('./models/Leaderboard');
const app = express();
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const mongoURI = process.env.DBURI

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.set(express.static(path.join(__dirname, 'public')));

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to mongoDB: ' + err));


// Add the shop items
const shopItems = [
  { name: "Double Click Power", cost: 100, effect: "Doubles your clicks per second." },
  { name: "Auto Clicker", cost: 200, effect: "Automatically clicks for you." },
  { name: "Triple Click Power", cost: 300, effect: "Triples your clicks per second." },
  { name: "Mega Click", cost: 500, effect: "Gives you 50 clicks instantly." },
];


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

// Middleware to make the user available in all EJS views
app.use((req, res, next) => {
  res.locals.user = req.session.userId ? req.session.userId : null;
  next();
});

// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.render('error', { title: "Error", error: "You have to be loged in to view this page", target: "/login" })
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

// app.js

app.post('/purchase', (req, res) => {
  const user = req.session.userId ? req.session.userId : null;
  const itemName = req.body.itemName;
  let points = user.points;

  if (!req.session.purchasedItems) {
    req.session.purchasedItems = [];
  }

  let purchasedItems = req.session.purchasedItems;
  if (purchasedItems.includes(itemName)) {
    return res.json({ message: "Item already purchased!" });
  }

  // Example effect handling based on item purchased
  switch (itemName) {
      case "Double Click Power":
          // Implement your effect logic here
          // For example, increase the player's click power
          break;
      case "Auto Clicker":
          // Start an auto-clicker
          break;
      case "Triple Click Power":
          // Increase click power
          break;
      case "Mega Click":
          points += 50; // Example effect
          break;
  }

  user.points = points; // Update session points
  res.json({ message: `${itemName} purchased!`, newPoints: points, purchasedItems: purchasedItems });
});


app.get('/shop', (req, res) => {
  const user = req.session.userId ? req.session.userId : null;
  res.render('shop', { points: user.points, shopItems: shopItems });
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
      res.render('game', { title: "Home", points: user.points || 0, purchasedItems, user });  // Default to 0 if points is undefined
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/submit', async (req, res) => {
  const { playerName, score } = req.body;
  
  try {
    const newScore = new Leaderboard({ playerName, score });
    await newScore.save();
    res.status(200).send('Score submitted successfully!');
  } catch (error) {
    res.status(500).send('Error saving score');
  }
});

// GET route to fetch leaderboard (top 10 scores)
app.get('/top', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    res.status(200).json(leaderboard)
  } catch (error) {
    res.status(500).send('Error fetching leaderboard');
  }
});

app.get('/leaderboard', async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('leaderboard', { title: "Leaderboard", score: user.points, user })
})

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
