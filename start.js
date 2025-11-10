#!/usr/bin/env node

/**
 * Gmail Client 启动脚本
 *
 * 支持两种运行模式：
 * - Electron 模式：桌面应用（Windows/macOS/Linux）
 * - Web 模式：Web服务器（推荐用于Linux服务器）
 */

const { spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

const platform = os.platform();

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n' + '='.repeat(60));
console.log('📬 Gmail Client - 选择运行模式');
console.log('='.repeat(60));
console.log(`\n当前系统: ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'}\n`);

// 自动推荐模式
let recommendedMode = 'web';
let otherMode = 'electron';

if (platform === 'win32') {
  recommendedMode = 'electron';
  otherMode = 'web';
}

console.log('运行模式说明：');
console.log('  1. Electron 模式 - 桌面应用（推荐 Windows/macOS）');
console.log('     ✓ 原生窗口界面');
console.log('     ✓ 系统集成更好');
console.log('     ✓ 自动打开浏览器授权');
console.log('');
console.log('  2. Web 模式 - Web 服务器（推荐 Linux 服务器）');
console.log('     ✓ 通过浏览器访问');
console.log('     ✓ 支持远程访问');
console.log('     ✓ 无需GUI环境');
console.log('     ✓ 包含REST API服务');
console.log('');

// 根据系统推荐模式
if (platform === 'win32') {
  console.log('💡 根据您的系统（Windows），推荐使用 Electron 模式\n');
} else if (platform === 'linux') {
  console.log('💡 根据您的系统（Linux），推荐使用 Web 模式\n');
} else {
  console.log('💡 两种模式都可以正常运行\n');
}

rl.question('请选择运行模式 (1=Electron, 2=Web) [默认: ' + (recommendedMode === 'electron' ? '1' : '2') + ']: ', (answer) => {
  rl.close();

  let mode = recommendedMode;
  if (answer === '1') {
    mode = 'electron';
  } else if (answer === '2') {
    mode = 'web';
  } else if (answer.trim() === '') {
    mode = recommendedMode;
  }

  console.log('\n' + '='.repeat(60));
  if (mode === 'electron') {
    console.log('🚀 启动 Electron 模式...');
    console.log('='.repeat(60) + '\n');
    startElectron();
  } else {
    console.log('🌐 启动 Web 模式...');
    console.log('='.repeat(60) + '\n');
    startWeb();
  }
});

/**
 * 启动 Electron 模式
 */
function startElectron() {
  const electron = spawn('npm', ['run', 'start:electron'], {
    stdio: 'inherit',
    shell: true
  });

  electron.on('error', (error) => {
    console.error('❌ 启动 Electron 失败:', error.message);
    console.log('\n请确保已安装依赖: npm install');
    process.exit(1);
  });

  electron.on('exit', (code) => {
    if (code !== 0) {
      console.log(`\n❌ Electron 进程退出，代码: ${code}`);
    }
    process.exit(code);
  });
}

/**
 * 启动 Web 模式
 */
function startWeb() {
  const web = spawn('npm', ['run', 'start:web'], {
    stdio: 'inherit',
    shell: true
  });

  web.on('error', (error) => {
    console.error('❌ 启动 Web 服务器失败:', error.message);
    console.log('\n请确保已安装依赖: npm install');
    process.exit(1);
  });

  web.on('exit', (code) => {
    if (code !== 0) {
      console.log(`\n❌ Web 服务器退出，代码: ${code}`);
    }
    process.exit(code);
  });
}
