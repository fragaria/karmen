#! /usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log(`BACKEND_BASE: ${process.env.BACKEND_BASE}`);

if (process.env.BACKEND_BASE) {
  fs.writeFileSync(path.resolve(__dirname, '../build/env.js'),
`window.env = {
  BACKEND_BASE: "${process.env.BACKEND_BASE}"
};`);
}