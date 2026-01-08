// Quick test script to check fortune distribution
const FORTUNE_TYPES = [
  { id: 'daikichi', name: '大吉', probability: 0.03 },
  { id: 'chukichi', name: '中吉', probability: 0.15 },
  { id: 'kichi', name: '吉', probability: 0.25 },
  { id: 'shokichi', name: '小吉', probability: 0.30 },
  { id: 'suekichi', name: '末吉', probability: 0.15 },
  { id: 'kyo', name: '凶', probability: 0.10 },
  { id: 'daikyo', name: '大凶', probability: 0.02 }
];

function getRandomFortune() {
  const random = Math.random();
  
  // 確率重み付き抽選
  const weights = [0.03, 0.15, 0.25, 0.30, 0.15, 0.10, 0.02];
  let accumulator = 0;
  
  for (let i = 0; i < weights.length; i++) {
    accumulator += weights[i];
    if (random <= accumulator) {
      return FORTUNE_TYPES[i];
    }
  }
  
  return FORTUNE_TYPES[3]; // fallback
}

// Test distribution
const results = [];
for (let i = 0; i < 1000; i++) {
  results.push(getRandomFortune().id);
}

const counts = {};
results.forEach(id => counts[id] = (counts[id] || 0) + 1);

console.log('Fortune distribution (1000 draws):');
FORTUNE_TYPES.forEach(fortune => {
  const count = counts[fortune.id] || 0;
  const expectedCount = Math.round(1000 * fortune.probability);
  console.log(`${fortune.id}: ${count} (expected: ~${expectedCount})`);
});