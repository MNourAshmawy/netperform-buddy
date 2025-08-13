const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

let faqs = [];
const csvPath = path.join(__dirname, 'faq.csv'); // CSV in same directory

// Load data once on startup
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => faqs.push(row))
  .on('end', () => console.log(`Loaded ${faqs.length} FAQs`))
  .on('error', (err) => console.error('CSV load error:', err));

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Handle preflight
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  try {
    const bestMatch = faqs.reduce((best, faq) => {
      const score = calculateSimilarity(question, faq.question);
      return score > best.score ? { answer: faq.answer, score } : best;
    }, { answer: "I don't know. Can you rephrase?", score: 0 });

    res.status(200).json({ 
      answer: bestMatch.score >= 0.3 ? bestMatch.answer : "I'm not sure about that." 
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

function calculateSimilarity(a, b) {
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = b.toLowerCase().split(/\s+/);
  let matches = 0;
  bWords.forEach(word => aWords.has(word) && matches++);
  return matches / Math.max(aWords.size, bWords.length, 1);
}
