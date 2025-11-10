# Gmail API 凭据配置指南

## 快速开始

### 第一步：创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目选择器，然后点击"新建项目"
3. 输入项目名称（例如：`Gmail Client`），点击"创建"
4. 等待项目创建完成

### 第二步：启用 Gmail API

1. 在左侧菜单中，选择 **"API 和服务"** → **"库"**
2. 在搜索框中输入 `Gmail API`
3. 点击 **Gmail API** 卡片
4. 点击 **"启用"** 按钮
5. 等待 API 启用完成

### 第三步：配置 OAuth 同意屏幕

1. 在左侧菜单中，选择 **"API 和服务"** → **"OAuth 同意屏幕"**
2. 选择 **"外部"** 用户类型，点击"创建"
3. 填写必填信息：
   - **应用名称**：`Gmail Electron Client`（或任意名称）
   - **用户支持电子邮件**：选择你的 Gmail 邮箱
   - **开发者联系信息**：输入你的 Gmail 邮箱
4. 点击 **"保存并继续"**

5. 在 **"作用域"** 页面：
   - 点击 **"添加或移除作用域"**
   - 在筛选框中输入 `gmail`
   - 勾选 `https://www.googleapis.com/auth/gmail.modify`
   - 点击 **"更新"**
   - 点击 **"保存并继续"**

6. 在 **"测试用户"** 页面：
   - 点击 **"+ 添加用户"**
   - 输入你的 Gmail 邮箱地址
   - 点击 **"添加"**
   - 点击 **"保存并继续"**

7. 在摘要页面，点击 **"返回信息中心"**

### 第四步：创建 OAuth 2.0 凭据

1. 在左侧菜单中，选择 **"API 和服务"** → **"凭据"**
2. 点击顶部的 **"+ 创建凭据"** 按钮
3. 选择 **"OAuth 客户端 ID"**
4. 在"应用类型"下拉框中选择 **"桌面应用"**
5. 输入名称：`Gmail Desktop Client`（或任意名称）
6. 点击 **"创建"**
7. **重要**：创建后，点击刚创建的凭据进行编辑
8. 在"已获授权的重定向 URI"部分，点击 **"+ 添加 URI"**
9. 输入：`http://localhost:3001/callback`
10. 点击 **"保存"**

### 第五步：下载凭据文件

1. 创建成功后，会弹出对话框显示客户端 ID 和客户端密钥
2. 点击 **"下载 JSON"** 按钮
3. 将下载的文件重命名为 `credentials.json`
4. 将文件复制到项目的 `config/` 目录下

**文件路径应该是：**
```
gmail_client/
└── config/
    └── credentials.json
```

### 第六步：验证配置

你的 `credentials.json` 文件内容应该类似于：

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:3001/callback"]
  }
}
```

## ✅ 完成后

配置完成后，运行：

```bash
npm start
```

应用应该能够正常启动，显示授权界面。

## 🔒 安全提示

- **不要将 `credentials.json` 文件提交到 Git 仓库**（已在 `.gitignore` 中配置）
- **不要分享你的客户端密钥**
- 这些凭据仅用于你的应用访问你自己的 Gmail 账号

## ❓ 常见问题

### Q: 为什么需要这么复杂的配置？

A: Google 要求所有访问 Gmail 的应用都必须通过 OAuth 2.0 认证，这是为了保护用户数据安全。

### Q: 我的应用可以给其他人使用吗？

A: 在测试阶段，只有添加到"测试用户"列表的邮箱才能使用。如果要公开发布，需要提交应用审核。

### Q: 凭据会过期吗？

A: OAuth 客户端凭据不会过期，但访问令牌（用户授权后获得的）会过期并需要刷新。应用会自动处理令牌刷新。

### Q: 出错了怎么办？

A:
1. 确认文件路径正确：`config/credentials.json`
2. 确认 JSON 格式正确（可以用 JSON 验证工具检查）
3. 确认 Gmail API 已启用
4. 确认你的邮箱已添加到测试用户列表

## 📞 需要帮助？

如果遇到问题，请检查：
1. Google Cloud Console 中 Gmail API 是否已启用
2. OAuth 同意屏幕是否已配置
3. 测试用户是否已添加
4. 凭据文件是否放在正确的位置

---

配置完成后，你就可以开始使用 Gmail Electron 客户端了！🎉
