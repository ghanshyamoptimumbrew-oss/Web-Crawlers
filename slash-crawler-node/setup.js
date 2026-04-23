const fs = require('fs');
const path = require('path');

console.log('⚙️  Setting up Slash Crawler...\n');

// Initialize data files
const dataFiles = [
  { file: 'queue.json', data: [] },
  { file: 'visited.json', data: [] },
  { file: 'results.json', data: [] }
];

for (const { file, data } of dataFiles) {
  const filePath = path.join(__dirname, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`   ✓ Created ${file}`);
}

console.log('\n✅ Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. npm install');
console.log('   2. npm start');
console.log('');