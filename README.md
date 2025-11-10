# Gmail 客户端

一个支持 **Electron 桌面模式**和 **Web 服务器模式**的 Gmail 客户端，提供邮件的接收、发送和删除功能，具备多账号管理、本地数据存储和 REST API 能力。

## 🎯 双模式运行

本应用支持两种运行模式，满足不同场景需求：

| 模式 | 适用场景 | 推荐系统 |
|------|----------|----------|
| **Electron 模式** | 桌面应用，原生窗口体验 | Windows, macOS |
| **Web 模式** | Web 服务器，支持远程访问 | Linux 服务器 |

**快速启动**：
```bash
npm start  # 交互式选择模式（推荐）
```

📖 **详细部署指南**：查看 [DEPLOYMENT.md](DEPLOYMENT.md)

## 功能特性

### 核心功能
- ✅ Gmail 账号 OAuth 2.0 授权登录
- ✅ 接收和查看邮件
- ✅ 发送新邮件
- ✅ 回复邮件
- ✅ 删除邮件
- ✅ 标记邮件为已读
- ✅ 邮件本地缓存（离线查看）

### 多账号管理
- ✅ 支持多个 Gmail 账号
- ✅ 快速切换账号
- ✅ 账号批量导入/导出
- ✅ 账号信息加密存储
- ✅ **批量自动登录授权**（使用 Puppeteer 自动填写账号密码）

### 数据存储
- ✅ SQLite 本地数据库
- ✅ 邮件本地持久化存储
- ✅ 账号密码加密存储
- ✅ 离线访问已同步邮件

### REST API
- ✅ 内置 REST API 服务（端口 3100）
- ✅ 通过邮箱查询最后一封邮件
- ✅ 获取账号列表
- ✅ 支持跨域请求（CORS）
- ✅ 完整的错误处理

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Node.js** - JavaScript 运行时
- **Google APIs** - Gmail API 集成
- **sql.js** - SQLite 纯 JavaScript 实现（无需原生模块编译）
- **electron-store** - 配置存储
- **Express** - REST API 服务框架
- **Puppeteer** - 浏览器自动化（用于 OAuth 授权）

## ⚠️ 重要：首次使用前的准备

在安装和运行应用之前，你需要先配置 Gmail API 凭据。这是一次性配置，之后就可以一直使用。

**📖 详细配置指南：[SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md)**

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd gmail_client
```

### 2. 安装依赖

```bash
npm install
```

**注意**：本项目使用 `sql.js`（纯 JavaScript 实现的 SQLite），无需原生模块编译，安装即可使用。

### 3. 配置 Gmail API（必需！）

**⚡ 快速链接：完整配置指南请查看 [SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md)**

#### 3.1 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Gmail API：
   - 在左侧菜单中选择 "API 和服务" > "库"
   - 搜索 "Gmail API"
   - 点击 "启用"

#### 3.2 创建 OAuth 2.0 凭据

1. 在左侧菜单中选择 "API 和服务" > "凭据"
2. 点击 "创建凭据" > "OAuth 客户端 ID"
3. 如果是首次创建，需要先配置 OAuth 同意屏幕：
   - 选择 "外部" 用户类型
   - 填写应用名称、用户支持电子邮件等必填信息
   - 在作用域部分，添加 `https://mail.google.com/`（Gmail 完整访问权限）
   - 添加测试用户（你的 Gmail 地址）
4. 返回创建 OAuth 客户端 ID：
   - 应用类型选择 "桌面应用"
   - 输入名称
   - 点击 "创建"
5. 下载 JSON 文件

#### 3.3 配置凭据文件

1. 将下载的 JSON 文件重命名为 `credentials.json`
2. 将文件放置在 `config/` 目录下
3. 文件结构应类似于 `config/credentials.example.json`

## 运行应用

### 方式1：交互式启动（推荐）

```bash
npm start
```

程序会根据您的操作系统推荐运行模式，并让您选择：
- **选项 1**：Electron 模式（桌面应用）
- **选项 2**：Web 模式（Web 服务器）

### 方式2：直接启动指定模式

```bash
# Electron 桌面模式（Windows/macOS 推荐）
npm run start:electron

# Web 服务器模式（Linux 服务器推荐）
npm run start:web
```

### 访问方式

**Electron 模式**：
- 自动打开桌面窗口

**Web 模式**：
- 本地访问：http://localhost:3000
- 远程访问：http://your-server-ip:3000
- REST API：http://localhost:3100

## 使用说明

### 首次使用

**Electron 模式**：
1. 启动应用后，点击 "授权 Gmail 访问" 按钮
2. Puppeteer会在隐私模式下自动打开浏览器
3. 登录你的 Google 账号并授予权限
4. 授权成功后浏览器会显示成功页面，应用自动完成登录

**Web 模式**：
1. 在浏览器中打开应用地址（http://localhost:3000）
2. 点击 "授权 Gmail 访问" 按钮
3. 在新标签页中登录 Google 账号并授权
4. 授权成功后自动跳转回应用
5. 首次授权后会自动同步最近 50 封邮件

### 邮件操作

#### 同步邮件

- 点击顶部 "同步邮件" 按钮从 Gmail 服务器获取最新邮件
- 同步的邮件会保存到本地数据库，可离线查看

#### 查看邮件

- 左侧显示邮件列表
- 点击任意邮件查看详情
- 未读邮件会以粗体显示
- 查看邮件后会自动标记为已读

#### 发送邮件

1. 点击顶部 "写邮件" 按钮
2. 填写收件人、主题和内容
3. 点击 "发送"

#### 回复邮件

1. 在邮件详情页面点击 "回复" 按钮
2. 系统会自动填充收件人和主题
3. 编写回复内容后发送

#### 删除邮件

1. 在邮件详情页面点击 "删除" 按钮
2. 确认删除操作
3. 邮件将从 Gmail 服务器和本地数据库中删除

### 账号管理

#### 查看所有账号

1. 点击顶部 "账号管理" 按钮
2. 查看所有已添加的账号列表
3. 当前激活的账号会显示 "当前" 标签

#### 添加新账号

1. 在账号管理界面点击 "添加授权账号"
2. 浏览器会打开 Google 授权页面
3. 完成授权并输入授权码
4. 新账号会自动添加到账号列表

#### 切换账号

1. 在账号管理界面找到要切换的账号
2. 点击 "切换" 按钮
3. 系统会自动加载该账号的邮件

#### 删除账号

1. 在账号管理界面找到要删除的账号
2. 点击 "删除" 按钮
3. 确认删除操作

### 导入导出账号

#### 导出账号

1. 点击 "账号管理"
2. 点击 "导出账号" 按钮
3. 选择保存位置
4. 账号信息会以 JSON 格式导出（**包含所有验证凭证，可在其他设备上直接使用**）

#### 导入账号

1. 点击 "账号管理"
2. 点击 "导入账号" 按钮
3. 选择之前导出的 JSON 文件
4. 系统会自动添加或更新账号信息（**包括验证凭证，无需重新授权**）

**导出的 JSON 格式示例：**

```json
[
  {
    "email": "user@gmail.com",
    "password": "encrypted_password",
    "access_token": "ya29.a0...",
    "refresh_token": "1//0g...",
    "token_expiry": 1234567890,
    "created_at": 1234567890
  }
]
```

**💡 提示**：导出的文件包含完整的授权凭证，可以在新设备上导入后立即使用，无需重新授权！

### 批量自动登录（新功能）

系统支持使用 Puppeteer 自动控制浏览器完成多个账号的 OAuth 授权，无需手动操作。

#### 准备账号文件

支持两种格式：

**格式 1: 文本格式（推荐，更简单）**

创建 `accounts.txt` 文件，每行一个账号，使用竖线 `|` 分隔：

```text
user1@gmail.com|your_password_or_app_password
user2@gmail.com|your_password_or_app_password
user3@gmail.com|your_password_or_app_password
```

**参考文件**: `accounts.example.txt`

**格式 2: JSON 格式**

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

#### 使用方法

**Electron 模式**：
- 在账号管理界面点击"批量自动登录"按钮
- 选择账号文件（支持 .txt 或 .json 格式）
- 系统会自动打开浏览器依次完成各账号登录

**Web 模式**：
```bash
# 使用测试脚本（自动检测文件格式）
node test_autologin.js

# 或使用 API（文本格式）
curl -X POST http://localhost:3000/api/account/importTextAndAutoLogin \
  -H "Content-Type: application/json" \
  -d '{"content": "user1@gmail.com|password1\nuser2@gmail.com|password2"}'

# 或使用 API（JSON格式）
curl -X POST http://localhost:3000/api/account/batchAutoLogin \
  -H "Content-Type: application/json" \
  -d @accounts.json
```

#### 工作流程

1. 系统自动启动浏览器（隐私模式）
2. 自动填写邮箱地址并点击"下一步"
3. 自动填写密码并提交
4. 如果启用了双因素验证，会暂停等待手动完成
5. 自动点击"允许"完成授权
6. 授权成功后关闭浏览器，继续下一个账号

**预计时间**: 每个账号约 15-30 秒（无 2FA）

#### 安全建议

1. **使用应用专用密码**：访问 [Google 账号安全设置](https://myaccount.google.com/security) 生成应用专用密码
2. **保护账号文件**：设置文件权限，防止未授权访问
3. **使用后删除**：完成登录后删除包含密码的 JSON 文件

📖 **详细文档**: 查看 [AUTO_LOGIN.md](AUTO_LOGIN.md) 获取完整的使用指南和故障排除

### REST API 使用

应用启动时会自动在端口 3100 启动 REST API 服务，供外部程序调用。

#### 快速开始

```bash
# 健康检查
curl http://localhost:3100/health

# 获取账号列表
curl http://localhost:3100/api/accounts

# 获取指定邮箱的最后一封邮件
curl "http://localhost:3100/api/email/last?email=your_email@gmail.com"
```

#### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查，返回服务状态 |
| `/api/accounts` | GET | 获取所有已添加的账号列表 |
| `/api/email/last?email=xxx` | GET | 获取指定邮箱的最后一封邮件（含完整内容） |

#### 使用示例

**JavaScript (Fetch)**

```javascript
// 获取最后一封邮件
const response = await fetch(
  'http://localhost:3100/api/email/last?email=your_email@gmail.com'
);
const data = await response.json();

if (data.success) {
  console.log('主题:', data.data.message.subject);
  console.log('发件人:', data.data.message.from);
  console.log('正文:', data.data.message.body);
}
```

**Python (requests)**

```python
import requests

# 获取最后一封邮件
response = requests.get(
    'http://localhost:3100/api/email/last',
    params={'email': 'your_email@gmail.com'}
)
data = response.json()

if data['success']:
    print('主题:', data['data']['message']['subject'])
    print('发件人:', data['data']['message']['from'])
```

**测试脚本**

项目提供了完整的测试脚本：

```bash
# 先启动应用
npm start

# 在另一个终端运行测试
node test_api.js
```

📖 **完整 API 文档**：查看 [API.md](API.md) 获取详细的 API 文档和更多示例

## 项目结构

```
gmail_client/
├── config/
│   ├── credentials.json           # Gmail API 凭据（需自行配置）
│   └── credentials.example.json   # 凭据示例文件
├── src/
│   ├── main.js                     # Electron 主进程
│   ├── preload.js                  # Preload 脚本（IPC 通信）
│   ├── services/
│   │   ├── databaseService.js      # SQLite 数据库服务
│   │   ├── gmailService.js         # Gmail API 服务层
│   │   └── apiService.js           # REST API 服务
│   └── renderer/
│       ├── index.html              # 主界面 HTML
│       ├── styles.css              # 样式文件
│       └── renderer.js             # 渲染进程 JavaScript
├── package.json                    # 项目配置
├── .gitignore                      # Git 忽略文件
├── README.md                       # 项目文档
├── API.md                          # REST API 文档
└── test_api.js                     # API 测试脚本
```

## 数据存储

### 数据库架构

应用使用 SQLite 数据库存储数据，位置：`{userData}/gmail_client.db`

#### 账号表 (accounts)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| email | TEXT | 邮箱地址 |
| password | TEXT | 加密后的密码 |
| access_token | TEXT | OAuth 访问令牌 |
| refresh_token | TEXT | OAuth 刷新令牌 |
| token_expiry | INTEGER | 令牌过期时间 |
| is_active | INTEGER | 是否为活动账号 |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

#### 邮件表 (messages)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| account_id | INTEGER | 关联账号 ID |
| message_id | TEXT | Gmail 邮件 ID |
| thread_id | TEXT | 邮件线程 ID |
| from_email | TEXT | 发件人 |
| to_email | TEXT | 收件人 |
| subject | TEXT | 主题 |
| snippet | TEXT | 摘要 |
| body | TEXT | 邮件正文 |
| date | TEXT | 日期 |
| labels | TEXT | 标签（逗号分隔） |
| is_read | INTEGER | 是否已读 |
| is_deleted | INTEGER | 是否已删除 |
| created_at | INTEGER | 创建时间 |

### 数据加密

- 账号密码使用 AES-256-CBC 加密
- 加密密钥派生自固定的密钥和盐值
- OAuth 令牌以明文存储在数据库中（仅本地访问）

## 安全说明

- 应用使用 OAuth 2.0 进行安全认证，不会存储你的 Gmail 密码
- 授权令牌和账号信息存储在本地数据库中
- 账号密码使用 AES-256 加密算法加密
- 使用 Electron 的上下文隔离和预加载脚本确保安全性
- 数据库文件存储在操作系统的用户数据目录中

## 常见问题

### 1. 授权失败

- 确保 `credentials.json` 文件配置正确
- 检查 Google Cloud Console 中是否正确启用了 Gmail API
- 确认你的 Gmail 地址已添加到测试用户列表

### 2. 无法接收邮件

- 点击 "同步邮件" 按钮手动同步
- 检查网络连接
- 确认授权令牌未过期（过期后需要重新授权）
- 查看控制台错误信息

### 3. 删除邮件失败（权限不足）

如果删除邮件时提示 "Insufficient Permission" 或 "权限不足"：

**原因**：旧版本使用的权限范围较小，不支持删除操作。

**解决方法**：
1. 打开 "账号管理"
2. 删除当前账号
3. 重新添加账号（新授权会获得完整权限）
4. 重新授权后即可正常删除邮件

**技术说明**：新版本使用 `https://mail.google.com/` 完整访问权限，支持所有邮件操作。

### 4. 发送邮件失败

- 检查收件人邮箱格式是否正确
- 确认 Gmail API 权限是否包含发送邮件权限
- 如果是旧账号，尝试删除并重新添加以获得完整权限

### 5. 账号导入失败

- 确保 JSON 文件格式正确
- 检查文件编码为 UTF-8
- 验证邮箱地址格式是否有效

### 5. 数据库错误

- 检查应用是否有权限访问用户数据目录
- 尝试删除数据库文件并重新启动应用
- 数据库文件位置：`{userData}/gmail_client.db`

## 开发模式

要启用开发者工具，取消 `src/main.js` 中以下代码的注释：

```javascript
mainWindow.webContents.openDevTools();
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v4.1.0

- 🚀 **新功能**：批量自动登录支持
- ✨ 使用 Puppeteer 自动填写账号密码完成 OAuth 授权
- ✨ 支持批量导入多个账号并自动完成登录
- ✨ 新增 REST API 端点：`/api/account/autoLogin` 和 `/api/account/batchAutoLogin`
- ✨ 支持双因素验证（2FA）手动处理
- 📝 新增详细文档：AUTO_LOGIN.md
- 🔧 优化自动登录流程，支持隐私模式
- ⚡ 账号间自动间隔，避免触发安全检测

### v4.0.0

- 🚀 **重大更新**：支持 Electron 和 Web 双模式运行
- ✨ 新增 Web 服务器模式，适合 Linux 服务器部署
- ✨ 智能启动脚本，自动推荐运行模式
- ✨ 前端 API 适配器，透明支持两种模式
- 🔧 重构核心服务，统一路径和数据管理
- 📂 Electron 模式使用 userData，Web 模式使用 ./data 目录
- 🌐 Web 模式支持远程访问和会话管理
- 📖 新增详细的部署指南（DEPLOYMENT.md）
- ⚡ 两种模式共享数据库和核心服务逻辑

### v3.0.0

- 🚀 **重大更新**：新增 REST API 服务
- ✨ 内置 HTTP 服务器（端口 3100），提供外部 API 访问
- ✨ 支持通过邮箱查询最后一封邮件（含完整内容）
- ✨ 提供账号列表查询接口
- ✨ 完整的 API 文档和测试脚本
- 🔒 支持 CORS 跨域请求
- 🎨 优化 UI 设计，提升用户体验
- 🐛 修复多账号切换和同步问题
- 🐛 修复授权成功后仍提示验证失败的问题
- ⚡ 使用 Puppeteer 改进浏览器授权流程

### v2.1.0

- 🔧 **重要更新**：迁移到 sql.js（纯 JavaScript SQLite 实现）
- ✅ 移除原生模块依赖，解决编译问题
- ✅ 跨平台安装体验一致，无需构建工具
- ✅ 即装即用，大幅简化安装流程
- 🚀 保持所有功能完整性

### v2.0.0

- ✨ 新增 SQLite 数据库存储
- ✨ 新增多账号管理功能
- ✨ 新增账号批量导入导出
- ✨ 新增邮件本地缓存
- ✨ 新增账号密码加密存储
- 🎨 改进用户界面布局
- ⚡ 优化邮件加载性能

### v1.0.0

- 🎉 初始版本发布
- ✨ 基础邮件收发功能
- ✨ Gmail OAuth 2.0 授权
