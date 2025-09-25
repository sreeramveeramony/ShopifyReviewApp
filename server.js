const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use('/admin', express.static('admin'));
app.use('/widget', express.static('widget'));

// In-memory storage for reviews (fallback when MongoDB is not available)
let reviews = [];
let nextId = 1;

// MongoDB connection
let mongoConnected = false;
mongoose.connect('mongodb://localhost:27017/reviewapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => {
  console.error('MongoDB connection error. Please make sure MongoDB is running.');
  console.error(err);
  console.log('Using in-memory storage as fallback');
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  mongoConnected = true;
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  name: String,
  email: String,
  rating: Number,
  title: String,
  review: String,
  product: String,
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Helper functions for in-memory storage
function createReviewInMemory(reviewData) {
  const review = {
    _id: nextId++,
    ...reviewData,
    approved: false,
    createdAt: new Date()
  };
  reviews.push(review);
  return review;
}

function getReviewsInMemory() {
  return reviews;
}

function getApprovedReviewsInMemory() {
  return reviews.filter(review => review.approved);
}

function updateReviewInMemory(id, updateData) {
  const reviewIndex = reviews.findIndex(review => review._id == id);
  if (reviewIndex !== -1) {
    reviews[reviewIndex] = { ...reviews[reviewIndex], ...updateData };
    return reviews[reviewIndex];
  }
  return null;
}

// Routes

// Submit a new review
app.post('/api/reviews', async (req, res) => {
  try {
    let review;
    if (mongoConnected) {
      review = new Review(req.body);
      await review.save();
    } else {
      review = createReviewInMemory(req.body);
    }
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get all approved reviews
app.get('/api/reviews/approved', async (req, res) => {
  try {
    let reviewsData;
    if (mongoConnected) {
      reviewsData = await Review.find({ approved: true });
    } else {
      reviewsData = getApprovedReviewsInMemory();
    }
    res.json(reviewsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Admin routes
// Get all reviews (for admin)
app.get('/api/admin/reviews', async (req, res) => {
  try {
    let reviewsData;
    if (mongoConnected) {
      reviewsData = await Review.find({});
    } else {
      reviewsData = getReviewsInMemory();
    }
    res.json(reviewsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Update review approval status
app.put('/api/admin/reviews/:id', async (req, res) => {
  try {
    const { approved } = req.body;
    let review;
    if (mongoConnected) {
      review = await Review.findByIdAndUpdate(
        req.params.id,
        { approved },
        { new: true }
      );
    } else {
      review = updateReviewInMemory(req.params.id, { approved });
    }
    if (review) {
      res.json({ message: 'Review updated successfully', review });
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Serve widget
app.get('/widget', (req, res) => {
  res.sendFile(path.join(__dirname, 'widget', 'index.html'));
});

// Serve display page
app.get('/widget/display.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'widget', 'display.html'));
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});