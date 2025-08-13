const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Initialize with empty array
let faqs = [];
let isDataLoaded = false;

// Async data loading with retry
const loadFAQData = () => new Promise((resolve, reject) => {
  const csvPath = path.join(__dirname, 'faq.csv');
  
  console.log(`Loading FAQ data from: ${csvPath}`); // Debug log
  
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => faqs.push(row))
    .on('end', () => {
      console.log(`Successfully loaded ${faqs.length} FAQs`);
      isDataLoaded = true;
      resolve();
    })
    .on('error', (err) => {
      console.error('Failed to load FAQ data:', err);
      reject(err);
    });
});

// Preload data when Lambda starts
loadFAQData().catch(err => {
  console.error('Initial data load failed:', err);
});

// Vercel Serverless Function handler
module.exports = async (req, res) => {
  // Enhanced CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Method validation
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST requests are accepted' 
      });
    }

    // Body validation
    if (!req.body || !req.body.question) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Missing question in request body' 
      });
    }

    // Ensure data is loaded
    if (!isDataLoaded) {
      console.log('Data not loaded yet, loading now...');
      await loadFAQData();
    }

    // Process question
    const { question } = req.body;
    const bestMatch = faqs.reduce((best, faq) => {
      const score = calculateSimilarity(question, faq.question);
      return score > best.score ? { answer: faq.answer, score } : best;
    }, { answer: "I don't have an answer for that. Please contact support.", score: 0 });

    // Response
    return res.status(200).json({
      answer: bestMatch.score >= 0.3 
        ? bestMatch.answer 
        : "I'm not sure about that. Could you try rephrasing?",
      confidence: bestMatch.score
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Please try again later' 
    });
  }
};

// Improved similarity calculation
function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const bWords = b.toLowerCase().split(/\s+/).filter(Boolean);
  
  if (aWords.size === 0 || bWords.length === 0) return 0;
  
  const matches = bWords.filter(word => aWords.has(word)).length;
  return matches / Math.max(aWords.size, bWords.length);
}
