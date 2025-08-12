const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Initialize FAQ data as empty array
let faqs = [];
let isDataLoaded = false;

// Improved data loading with error handling
function loadFAQData() {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, 'faq.csv'); // Changed path to be in same directory
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => faqs.push(row))
      .on('end', () => {
        console.log(`Loaded ${faqs.length} FAQ entries`);
        isDataLoaded = true;
        resolve();
      })
      .on('error', (err) => {
        console.error('Failed to load FAQ data:', err);
        reject(err);
      });
  });
}

// Preload data when Lambda starts
loadFAQData().catch(err => {
  console.error('Initial data load failed:', err);
});

// Enhanced similarity function
function getSimilarity(a, b) {
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  const intersection = aWords.filter(word => bWords.includes(word));
  return intersection.length / Math.max(aWords.length, bWords.length, 1);
}

// Vercel API handler with better error handling
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ answer: 'Please provide a question' });
    }

    // Wait for data to load if not ready
    if (!isDataLoaded) {
      await loadFAQData();
    }

    let bestMatch = { answer: "I don't have an answer for that. Try rephrasing your question.", score: 0 };

    for (const faq of faqs) {
      const score = getSimilarity(question, faq.question);
      if (score > bestMatch.score) {
        bestMatch = { answer: faq.answer, score };
      }
    }

    const response = bestMatch.score >= 0.3 
      ? { answer: bestMatch.answer }
      : { answer: "I'm not sure about that. Can you ask something else?" };

    return res.status(200).json(response);

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ answer: 'Something went wrong. Please try again later.' });
  }
};
