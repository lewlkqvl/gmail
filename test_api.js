/**
 * Gmail Client REST API 测试脚本
 *
 * 使用方法:
 * 1. 先启动 Gmail Client: npm start
 * 2. 在另一个终端运行此脚本: node test_api.js
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3100';

// HTTP GET 请求封装
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// 测试健康检查
async function testHealth() {
  console.log('\n=== 测试 1: 健康检查 ===');
  try {
    const result = await httpGet(`${API_BASE_URL}/health`);
    console.log('✅ 状态码:', result.status);
    console.log('✅ 响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('提示: 请先启动 Gmail Client (npm start)');
  }
}

// 测试获取账号列表
async function testGetAccounts() {
  console.log('\n=== 测试 2: 获取账号列表 ===');
  try {
    const result = await httpGet(`${API_BASE_URL}/api/accounts`);
    console.log('✅ 状态码:', result.status);
    console.log('✅ 响应:', JSON.stringify(result.data, null, 2));

    if (result.data.success && result.data.data.accounts.length > 0) {
      console.log('\n📧 已找到账号:');
      result.data.data.accounts.forEach(account => {
        console.log(`  - ${account.email} (ID: ${account.id}, 活跃: ${account.isActive}, 已授权: ${account.isAuthorized})`);
      });
      return result.data.data.accounts;
    } else {
      console.log('\n⚠️  暂无账号，请先在 Gmail Client 中添加账号');
      return [];
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    return [];
  }
}

// 测试获取最后一封邮件
async function testGetLastEmail(email) {
  console.log(`\n=== 测试 3: 获取最后一封邮件 (${email}) ===`);
  try {
    const encodedEmail = encodeURIComponent(email);
    const result = await httpGet(`${API_BASE_URL}/api/email/last?email=${encodedEmail}`);
    console.log('✅ 状态码:', result.status);

    if (result.data.success) {
      const message = result.data.data.message;
      console.log('✅ 邮件信息:');
      console.log(`  主题: ${message.subject}`);
      console.log(`  发件人: ${message.from}`);
      console.log(`  收件人: ${message.to}`);
      console.log(`  日期: ${message.date}`);
      console.log(`  摘要: ${message.snippet.substring(0, 100)}...`);
      console.log(`  正文长度: ${message.body ? message.body.length : 0} 字符`);
      console.log(`  标签: ${message.labelIds.join(', ')}`);
    } else {
      console.log('❌ 失败:', result.data.error);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

// 测试错误处理 - 不存在的邮箱
async function testErrorHandling() {
  console.log('\n=== 测试 4: 错误处理 (不存在的邮箱) ===');
  try {
    const result = await httpGet(`${API_BASE_URL}/api/email/last?email=nonexistent@gmail.com`);
    console.log('✅ 状态码:', result.status);
    console.log('✅ 错误响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

// 测试缺少参数
async function testMissingParameter() {
  console.log('\n=== 测试 5: 缺少email参数 ===');
  try {
    const result = await httpGet(`${API_BASE_URL}/api/email/last`);
    console.log('✅ 状态码:', result.status);
    console.log('✅ 错误响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始测试 Gmail Client REST API...');
  console.log('⏰', new Date().toLocaleString());

  // 1. 健康检查
  await testHealth();

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. 获取账号列表
  const accounts = await testGetAccounts();

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. 如果有账号，测试获取最后一封邮件
  if (accounts.length > 0) {
    const firstAccount = accounts.find(acc => acc.isAuthorized);
    if (firstAccount) {
      await testGetLastEmail(firstAccount.email);
    } else {
      console.log('\n⚠️  没有已授权的账号，跳过邮件查询测试');
    }
  }

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. 测试错误处理
  await testErrorHandling();

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 500));

  // 5. 测试缺少参数
  await testMissingParameter();

  console.log('\n✅ 所有测试完成！');
  console.log('\n📖 更多API使用方法请查看 API.md 文档');
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试过程中出错:', error);
  process.exit(1);
});
