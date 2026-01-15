#!/usr/bin/env node

/**
 * 项目代码统计工具
 * 统计各类文件的行数
 */

const fs = require('fs');
const path = require('path');

const stats = {
  vue: { count: 0, lines: 0 },
  ts: { count: 0, lines: 0 },
  js: { count: 0, lines: 0 },
  css: { count: 0, lines: 0 },
  json: { count: 0, lines: 0 },
  md: { count: 0, lines: 0 },
  total: { count: 0, lines: 0 },
};

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules and dist
    if (file === 'node_modules' || file === 'dist' || file === '.git') {
      return;
    }

    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else {
      const ext = path.extname(file).toLowerCase();
      const lines = countLines(filePath);

      stats.total.count++;
      stats.total.lines += lines;

      switch (ext) {
        case '.vue':
          stats.vue.count++;
          stats.vue.lines += lines;
          break;
        case '.ts':
          stats.ts.count++;
          stats.ts.lines += lines;
          break;
        case '.js':
          stats.js.count++;
          stats.js.lines += lines;
          break;
        case '.css':
          stats.css.count++;
          stats.css.lines += lines;
          break;
        case '.json':
        case '.jsonc':
          stats.json.count++;
          stats.json.lines += lines;
          break;
        case '.md':
          stats.md.count++;
          stats.md.lines += lines;
          break;
      }
    }
  });
}

console.log('\n📊 项目代码统计\n');
console.log('=' + '='.repeat(50));

scanDirectory(process.cwd());

console.log(`
Vue 组件:      ${stats.vue.count} 个文件,   ${stats.vue.lines.toLocaleString()} 行
TypeScript:    ${stats.ts.count} 个文件,  ${stats.ts.lines.toLocaleString()} 行
JavaScript:    ${stats.js.count} 个文件,   ${stats.js.lines.toLocaleString()} 行
CSS:           ${stats.css.count} 个文件,   ${stats.css.lines.toLocaleString()} 行
JSON:          ${stats.json.count} 个文件,   ${stats.json.lines.toLocaleString()} 行
Markdown:      ${stats.md.count} 个文件,   ${stats.md.lines.toLocaleString()} 行
`);

console.log('=' + '='.repeat(50));
console.log(`总计:          ${stats.total.count} 个文件,  ${stats.total.lines.toLocaleString()} 行`);
console.log('=' + '='.repeat(50) + '\n');

const codeLines = stats.vue.lines + stats.ts.lines + stats.js.lines;
console.log(`✅ 有效代码行数: ${codeLines.toLocaleString()} 行`);
console.log(`📝 文档行数:     ${stats.md.lines.toLocaleString()} 行\n`);
