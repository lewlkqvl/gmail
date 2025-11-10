# 快速安装指南

## 简单安装步骤

本项目使用 **sql.js**（纯 JavaScript 实现的 SQLite），无需原生模块编译，安装过程非常简单！

### 1. 安装 Node.js

- 下载并安装 Node.js LTS 版本：https://nodejs.org/
- 推荐版本：16.x 或 18.x

### 2. 克隆项目

```bash
git clone <repository-url>
cd gmail_client
```

### 3. 安装依赖

```bash
npm install
```

就这么简单！无需任何额外的构建工具或编译步骤。

### 4. 配置 Gmail API

参考 [README.md](README.md) 中的详细配置说明。

### 5. 运行应用

```bash
npm start
```

## 为什么选择 sql.js？

与之前使用的 `better-sqlite3` 相比，`sql.js` 有以下优势：

✅ **零编译**：纯 JavaScript 实现，无需原生模块编译
✅ **跨平台**：在所有平台上安装体验一致
✅ **无依赖**：不需要 Python、C++ 编译器等构建工具
✅ **即装即用**：`npm install` 后立即可用
✅ **完全兼容**：完整的 SQLite 功能支持

## 常见问题

### Q: 数据会保存在哪里？

A: 数据库文件保存在用户数据目录：
- Windows: `%APPDATA%\gmail-electron-client\gmail_client.db`
- macOS: `~/Library/Application Support/gmail-electron-client/gmail_client.db`
- Linux: `~/.config/gmail-electron-client/gmail_client.db`

### Q: 性能如何？

A: sql.js 虽然是纯 JavaScript 实现，但对于桌面邮件客户端的使用场景（数千封邮件），性能完全足够。

### Q: 数据库文件可以在不同平台间迁移吗？

A: 可以！SQLite 数据库文件是跨平台的，可以直接复制使用。

### Q: 如果遇到问题怎么办？

A:
1. 确认 Node.js 版本正确：`node --version`
2. 清除缓存重新安装：`rm -rf node_modules && npm install`
3. 查看控制台错误信息
4. 在 GitHub Issues 中报告问题

## 验证安装

运行以下命令验证安装成功：

```bash
npm start
```

如果应用成功启动并显示授权界面，说明安装完成！🎉
