/**
 * 批量自动登录测试脚本
 *
 * 使用方法：
 * 1. 创建账号文件 accounts.json（参考 accounts_autologin.example.json）
 * 2. 启动应用：npm start
 * 3. 在另一个终端运行：node test_autologin.js
 */

const http = require('http');
const fs = require('fs');

// 配置
const WEB_PORT = 3000; // Web 服务器端口
const ACCOUNTS_JSON_FILE = './accounts.json'; // JSON 账号文件路径
const ACCOUNTS_TEXT_FILE = './accounts.txt'; // 文本账号文件路径

/**
 * 发送 HTTP POST 请求
 */
function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: WEB_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 解析文本文件 (email|password 格式)
 */
function parseTextFile(content) {
  const accounts = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过空行和注释行
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    const parts = line.split('|');
    if (parts.length !== 2) {
      console.warn(`第 ${i + 1} 行格式错误，已跳过: ${line}`);
      continue;
    }

    const email = parts[0].trim();
    const password = parts[1].trim();

    if (!email || !password) {
      console.warn(`第 ${i + 1} 行邮箱或密码为空，已跳过`);
      continue;
    }

    accounts.push({ email, password });
  }

  return accounts;
}

/**
 * 从文本内容批量自动登录
 */
async function batchAutoLoginFromText(content) {
  console.log('=====================================');
  console.log('文本格式批量自动登录测试');
  console.log('=====================================\n');

  try {
    const result = await postRequest('/api/account/importTextAndAutoLogin', { content });

    if (result.success) {
      console.log('\n✅ 批量登录完成！\n');
      console.log('登录结果汇总：');
      console.log('-------------------------------------');

      let successCount = 0;
      let failCount = 0;

      result.results.forEach((r, index) => {
        if (r.success) {
          console.log(`✅ [${index + 1}] ${r.email} - 登录成功`);
          successCount++;
        } else {
          console.log(`❌ [${index + 1}] ${r.email} - 登录失败: ${r.error}`);
          failCount++;
        }
      });

      console.log('-------------------------------------');
      console.log(`总计: ${result.totalAccounts} 个账号`);
      console.log(`成功: ${successCount} 个`);
      console.log(`失败: ${failCount} 个`);
      console.log('=====================================\n');
    } else {
      console.error('❌ 批量登录失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.error('\n请确保：');
    console.error('1. Gmail Client 应用已启动（npm start）');
    console.error('2. Web 服务器运行在端口', WEB_PORT);
  }
}

/**
 * 批量自动登录 (JSON格式)
 */
async function batchAutoLogin(accounts) {
  console.log('=====================================');
  console.log('Gmail 批量自动登录测试');
  console.log('=====================================\n');

  console.log(`准备登录 ${accounts.length} 个账号...\n`);

  try {
    const result = await postRequest('/api/account/batchAutoLogin', { accounts });

    if (result.success) {
      console.log('\n✅ 批量登录完成！\n');
      console.log('登录结果汇总：');
      console.log('-------------------------------------');

      let successCount = 0;
      let failCount = 0;

      result.results.forEach((r, index) => {
        if (r.success) {
          console.log(`✅ [${index + 1}] ${r.email} - 登录成功`);
          successCount++;
        } else {
          console.log(`❌ [${index + 1}] ${r.email} - 登录失败: ${r.error}`);
          failCount++;
        }
      });

      console.log('-------------------------------------');
      console.log(`总计: ${accounts.length} 个账号`);
      console.log(`成功: ${successCount} 个`);
      console.log(`失败: ${failCount} 个`);
      console.log('=====================================\n');

    } else {
      console.error('❌ 批量登录失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.error('\n请确保：');
    console.error('1. Gmail Client 应用已启动（npm start）');
    console.error('2. Web 服务器运行在端口', WEB_PORT);
  }
}

/**
 * 单个账号自动登录测试
 */
async function singleAutoLogin(email, password) {
  console.log('=====================================');
  console.log('单个账号自动登录测试');
  console.log('=====================================\n');

  console.log(`正在登录: ${email}\n`);

  try {
    const result = await postRequest('/api/account/autoLogin', { email, password });

    if (result.success) {
      console.log(`\n✅ 登录成功: ${result.email}`);
    } else {
      console.error(`\n❌ 登录失败: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }

  console.log('=====================================\n');
}

// 主程序
async function main() {
  // 检查命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 批量登录模式 - 自动检测文件类型
    let fileToUse = null;
    let fileType = null;

    // 优先使用文本文件
    if (fs.existsSync(ACCOUNTS_TEXT_FILE)) {
      fileToUse = ACCOUNTS_TEXT_FILE;
      fileType = 'text';
    } else if (fs.existsSync(ACCOUNTS_JSON_FILE)) {
      fileToUse = ACCOUNTS_JSON_FILE;
      fileType = 'json';
    }

    if (!fileToUse) {
      console.error('❌ 错误: 未找到账号文件');
      console.log('\n请创建以下任一格式的账号文件：');
      console.log('\n1. 文本格式 (accounts.txt):');
      console.log('   user1@gmail.com|password1');
      console.log('   user2@gmail.com|password2');
      console.log('   参考: accounts.example.txt');
      console.log('\n2. JSON 格式 (accounts.json):');
      console.log('   [{"email":"user1@gmail.com","password":"password1"}]');
      console.log('   参考: accounts_autologin.example.json');
      process.exit(1);
    }

    try {
      const fileContent = fs.readFileSync(fileToUse, 'utf-8');

      if (fileType === 'text') {
        console.log(`使用文本文件: ${fileToUse}\n`);
        await batchAutoLoginFromText(fileContent);
      } else {
        console.log(`使用JSON文件: ${fileToUse}\n`);
        const accounts = JSON.parse(fileContent);

        if (!Array.isArray(accounts) || accounts.length === 0) {
          console.error('❌ 错误: JSON文件格式错误或为空');
          process.exit(1);
        }

        await batchAutoLogin(accounts);
      }

    } catch (error) {
      console.error('❌ 读取账号文件失败:', error.message);
      process.exit(1);
    }

  } else if (args.length === 1 && args[0] === '--help') {
    // 帮助信息
    console.log('Gmail 批量自动登录测试工具\n');
    console.log('使用方法：');
    console.log('\n1. 批量登录（从文件读取）：');
    console.log('   node test_autologin.js');
    console.log('   - 优先读取 accounts.txt（文本格式）');
    console.log('   - 其次读取 accounts.json（JSON格式）');
    console.log('\n2. 单个账号登录：');
    console.log('   node test_autologin.js user@gmail.com password');
    console.log('\n文件格式：');
    console.log('\n文本格式 (accounts.txt):');
    console.log('   email1@gmail.com|password1');
    console.log('   email2@gmail.com|password2');
    console.log('   # 注释行');
    console.log('\nJSON格式 (accounts.json):');
    console.log('   [');
    console.log('     {"email": "email1@gmail.com", "password": "password1"},');
    console.log('     {"email": "email2@gmail.com", "password": "password2"}');
    console.log('   ]');

  } else if (args.length === 2) {
    // 单个账号登录模式
    const [email, password] = args;
    await singleAutoLogin(email, password);

  } else {
    console.log('使用方法：node test_autologin.js [--help]');
    console.log('详细帮助: node test_autologin.js --help');
  }
}

main().catch(console.error);
