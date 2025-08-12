const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
app.use(express.json());

// Load CSV from deployed directory
let faqs = [];
const csvPath = path.join(__dirname, '..', 'faq.csv');

if (fs.existsSync(csvPath)) {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => faqs.push(row))
    .on('end', () => console.log('FAQ data loaded'));
} else {
  console.error('FAQ CSV file not found at', csvPath);
}

// Simple similarity scoring
function getSimilarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  let matches = 0;
  for (let word of aWords) {
    if (bWords.includes(word)) matches++;
  }
  return matches / Math.max(aWords.length, bWords.length);
}

// API endpoint
app.post('/api/chatbot', (req, res) => {
  const question = req.body.question?.toLowerCase();
  if (!question) {
    return res.status(400).json({ answer: 'Please provide a question.' });
  }

  let bestMatch = { answer: "Sorry, I couldn't find an answer to that.", score: 0 };
  for (let faq of faqs) {
    const score = getSimilarity(question, faq.question);
    if (score > bestMatch.score) {
      bestMatch = { answer: faq.answer, score };
    }
  }

  if (bestMatch.score >= 0.3) {
    res.json({ answer: bestMatch.answer });
  } else {
    res.json({ answer: "Sorry, I couldn't find an answer to that." });
  }
});

module.exports = app;
