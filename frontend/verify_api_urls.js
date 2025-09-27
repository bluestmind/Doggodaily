#!/usr/bin/env node
/**
 * Verification script to check all API URLs are using server IP
 */

const fs = require('fs');
const path = require('path');

const searchDir = './src';
const serverIP = '46.101.244.203';
const localhostPattern = /localhost:5000|127\.0\.0\.1:5000/g;

function searchFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      searchFiles(filePath, results);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(localhostPattern);
      
      if (matches) {
        results.push({
          file: filePath,
          matches: matches,
          lines: content.split('\n')
            .map((line, idx) => ({ line: line, num: idx + 1 }))
            .filter(({line}) => localhostPattern.test(line))
        });
      }
    }
  });
  
  return results;
}

console.log('🔍 Checking for localhost references in frontend...\n');

const results = searchFiles(searchDir);

if (results.length === 0) {
  console.log('✅ No localhost references found!');
  console.log('✅ All API calls should now use:', `http://${serverIP}:5000`);
  console.log('\n🚀 Frontend is ready for production!');
} else {
  console.log('❌ Found localhost references in:');
  results.forEach(({file, lines}) => {
    console.log(`\n📁 ${file}:`);
    lines.forEach(({line, num}) => {
      console.log(`   Line ${num}: ${line.trim()}`);
    });
  });
  console.log('\n⚠️  Please fix these localhost references before deployment.');
}

console.log('\n📋 Current API Configuration:');
console.log(`   Server IP: ${serverIP}`);
console.log(`   Backend URL: http://${serverIP}:5000`);
console.log(`   Frontend URL: http://${serverIP}:3000`);
console.log(`   Admin Login: http://${serverIP}:5000/api/auth/admin/login`);