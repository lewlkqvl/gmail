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
const ACCOUNTS_FILE = './accounts.json'; // 账号文件路径

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
 * 批量自动登录
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
    // 批量登录模式
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      console.error('❌ 错误: 未找到账号文件:', ACCOUNTS_FILE);
      console.log('\n请创建账号文件，格式参考 accounts_autologin.example.json');
      console.log('\n示例：');
      console.log('[\n  {\n    "email": "user1@gmail.com",\n    "password": "your_password"\n  },\n  {\n    "email": "user2@gmail.com",\n    "password": "your_password"\n  }\n]');
      process.exit(1);
    }

    try {
      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));

      if (!Array.isArray(accounts) || accounts.length === 0) {
        console.error('❌ 错误: 账号文件格式错误或为空');
        process.exit(1);
      }

      await batchAutoLogin(accounts);

    } catch (error) {
      console.error('❌ 读取账号文件失败:', error.message);
      process.exit(1);
    }

  } else if (args.length === 2) {
    // 单个账号登录模式
    const [email, password] = args;
    await singleAutoLogin(email, password);

  } else {
    console.log('使用方法：');
    console.log('\n1. 批量登录（从文件读取）：');
    console.log('   node test_autologin.js');
    console.log('\n2. 单个账号登录：');
    console.log('   node test_autologin.js user@gmail.com password');
    console.log('\n注意：批量登录需要先创建 accounts.json 文件');
  }
}

main().catch(console.error);
