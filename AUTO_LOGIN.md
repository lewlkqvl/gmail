# Gmail 批量自动登录功能

## 📋 功能说明

本项目支持使用 Puppeteer 自动控制浏览器完成 Gmail 账号的 OAuth 授权，可以批量导入多个账号并自动完成登录授权。

## ⚠️ 重要提示

1. **安全性**：自动登录功能需要在 JSON 文件中存储明文密码，请确保文件安全
2. **双因素验证**：如果账号启用了 2FA，需要手动完成验证步骤
3. **账号安全**：建议使用应用专用密码而非主密码
4. **Google 检测**：频繁自动登录可能触发 Google 的安全检测

## 🚀 使用方法

### 方式1: Electron 模式（推荐）

#### 1. 准备账号文件

支持两种格式，选择其一：

**格式 A: 文本格式（推荐，更简单）**

创建 `accounts.txt` 文件，每行一个账号，使用竖线 `|` 分隔：

```text
user1@gmail.com|your_password_or_app_password
user2@gmail.com|your_password_or_app_password
user3@gmail.com|your_password_or_app_password

# 以 # 或 // 开头的行为注释，会被忽略
# 空行也会被忽略
```

**参考文件**: `accounts.example.txt`

**格式 B: JSON 格式**

创建 `accounts.json` 文件：

```json
[
  {
    "email": "user1@gmail.com",
    "password": "your_password_or_app_password"
  },
  {
    "email": "user2@gmail.com",
    "password": "your_password_or_app_password"
  }
]
```

**参考文件**: `accounts_autologin.example.json`

#### 2. 使用命令行批量导入

创建一个测试脚本 `batch_login.js`：

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// 读取账号文件
const accounts = JSON.parse(
  fs.readFileSync('./my_accounts.json', 'utf-8')
);

// 启动应用
app.whenReady().then(async () => {
  // 等待主窗口加载
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 调用批量自动登录
  const result = await ipcMain.invoke('account:batchAutoLogin', accounts);

  console.log('批量登录结果:', result);

  if (result.success) {
    console.log(`成功登录 ${result.results.filter(r => r.success).length} 个账号`);
  }
});
```

#### 3. 通过前端界面使用

在账号管理界面中：
1. 点击"批量自动登录"按钮
2. 选择包含账号信息的 JSON 文件
3. 系统会自动打开浏览器并依次完成各账号的登录
4. 登录过程中会显示进度信息

### 方式2: Web 模式

#### 使用 REST API

```bash
# 批量自动登录
curl -X POST http://localhost:3000/api/account/batchAutoLogin \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [
      {
        "email": "user1@gmail.com",
        "password": "your_password"
      },
      {
        "email": "user2@gmail.com",
        "password": "your_password"
      }
    ]
  }'

# 单个账号自动登录
curl -X POST http://localhost:3000/api/account/autoLogin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "password": "your_password"
  }'
```

#### 使用 JavaScript

```javascript
// 批量自动登录
async function batchAutoLogin(accounts) {
  const response = await fetch('http://localhost:3000/api/account/batchAutoLogin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accounts })
  });

  const result = await response.json();

  if (result.success) {
    console.log('登录结果:', result.results);
    result.results.forEach(r => {
      if (r.success) {
        console.log(`✅ ${r.email} 登录成功`);
      } else {
        console.log(`❌ ${r.email} 登录失败: ${r.error}`);
      }
    });
  }
}

// 读取账号文件并批量登录
fetch('my_accounts.json')
  .then(res => res.json())
  .then(accounts => batchAutoLogin(accounts));
```

#### 使用 Python

```python
import requests
import json

# 读取账号文件
with open('my_accounts.json', 'r') as f:
    accounts = json.load(f)

# 批量自动登录
response = requests.post(
    'http://localhost:3000/api/account/batchAutoLogin',
    json={'accounts': accounts}
)

result = response.json()

if result['success']:
    for r in result['results']:
        if r['success']:
            print(f"✅ {r['email']} 登录成功")
        else:
            print(f"❌ {r['email']} 登录失败: {r['error']}")
```

## 🔐 获取应用专用密码（推荐）

为了提高安全性，建议使用 Google 应用专用密码而非账号主密码：

### 步骤：

1. 访问 [Google 账号设置](https://myaccount.google.com/)
2. 选择"安全性" > "两步验证"
3. 启用两步验证（如果尚未启用）
4. 返回"安全性"页面，选择"应用专用密码"
5. 选择"邮件"和设备类型，点击"生成"
6. 复制生成的 16 位密码
7. 在 JSON 文件中使用该密码替代主密码

**应用专用密码示例**: `abcd efgh ijkl mnop`（去掉空格）

## 📝 自动登录流程

1. **启动浏览器**: Puppeteer 在隐私模式下启动 Chrome
2. **导航到授权页面**: 访问 Google OAuth 授权 URL
3. **填写邮箱**: 自动输入邮箱地址并点击"下一步"
4. **填写密码**: 自动输入密码并提交
5. **处理验证**（如需要）:
   - 如果启用了 2FA，系统会暂停等待手动完成验证
   - 完成验证后自动继续
6. **授权确认**: 自动点击"允许"按钮
7. **完成授权**: 等待跳转到回调地址并保存授权信息
8. **关闭浏览器**: 授权成功后自动关闭浏览器窗口

## ⏱️ 时间参数

- **单个账号登录时间**: 约 15-30 秒（无 2FA）
- **账号间隔时间**: 5 秒（避免触发安全检测）
- **2FA 等待时间**: 最多 120 秒

## 🐛 故障排除

### 1. 找不到 Chrome 浏览器

**错误**: `未找到 Chrome 浏览器`

**解决方法**:
- 确保已安装 Google Chrome 或 Chromium
- Windows: 检查 `C:\Program Files\Google\Chrome\Application\chrome.exe`
- macOS: 检查 `/Applications/Google Chrome.app`
- Linux: 安装 `google-chrome` 或 `chromium-browser`

### 2. 密码错误

**错误**: `密码不正确`

**解决方法**:
- 检查密码是否正确
- 尝试使用应用专用密码
- 确认账号未被锁定

### 3. 需要额外验证

**现象**: 浏览器停在验证页面

**解决方法**:
- 手动完成验证（输入验证码、确认手机等）
- 系统会等待最多 120 秒
- 完成后自动继续

### 4. 授权按钮未找到

**错误**: `未找到授权按钮`

**解决方法**:
- 检查是否已经授权过（可能自动跳过）
- 手动点击"允许"按钮
- 等待页面加载完成

### 5. 被 Google 检测为机器人

**现象**: 频繁出现验证码

**解决方法**:
- 增加账号间隔时间
- 分批次处理账号
- 使用不同的 IP 地址
- 暂停一段时间后再试

## 🔒 安全建议

1. **使用应用专用密码**: 不要在文件中存储主密码
2. **文件权限**: 设置账号文件为只读权限
3. **删除明文密码**: 登录成功后删除包含密码的 JSON 文件
4. **加密存储**: 考虑使用加密工具保护账号文件
5. **定期更换**: 定期更换应用专用密码

## 📊 批量登录示例

假设有 10 个账号需要登录：

```bash
# 1. 创建账号文件
cat > accounts.json << 'EOF'
[
  {"email": "user1@gmail.com", "password": "app_password_1"},
  {"email": "user2@gmail.com", "password": "app_password_2"},
  {"email": "user3@gmail.com", "password": "app_password_3"},
  {"email": "user4@gmail.com", "password": "app_password_4"},
  {"email": "user5@gmail.com", "password": "app_password_5"},
  {"email": "user6@gmail.com", "password": "app_password_6"},
  {"email": "user7@gmail.com", "password": "app_password_7"},
  {"email": "user8@gmail.com", "password": "app_password_8"},
  {"email": "user9@gmail.com", "password": "app_password_9"},
  {"email": "user10@gmail.com", "password": "app_password_10"}
]
EOF

# 2. 启动应用
npm start

# 3. 在应用中点击"批量自动登录"并选择 accounts.json

# 4. 等待自动登录完成（约 3-5 分钟）

# 5. 完成后删除密码文件
rm accounts.json
```

预计总耗时：
- 10 个账号 × 20 秒 = 200 秒
- 9 个间隔 × 5 秒 = 45 秒
- **总计**: 约 245 秒（约 4 分钟）

## 📞 技术支持

如果遇到问题：
1. 查看控制台日志
2. 检查浏览器窗口显示的错误信息
3. 参考 README.md 中的常见问题
4. 提交 Issue 到 GitHub

## 📚 相关文档

- [README.md](README.md) - 项目主文档
- [SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md) - Gmail API 配置指南
- [API.md](API.md) - REST API 文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
