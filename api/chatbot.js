const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Load CSV data once when the function starts
let faqs = [];
const csvPath = path.join(__dirname, '..', 'faq.csv');

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => faqs.push(row))
  .on('end', () => console.log('FAQ data loaded'));

// Simple similarity function
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

// Vercel API handler
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ answer: 'Missing question' });
  }

  let bestMatch = { answer: "Sorry, I couldn't find an answer.", score: 0 };

  for (let faq of faqs) {
    const score = getSimilarity(question, faq.question);
    if (score > bestMatch.score) {
      bestMatch = { answer: faq.answer, score };
    }
  }

  if (bestMatch.score >= 0.3) {
    res.status(200).json({ answer: bestMatch.answer });
  } else {
    res.status(200).json({ answer: "Sorry, I couldn't find an answer." });
  }
};
