# Gmail Client - 部署指南

本应用支持两种运行模式：**Electron 桌面模式**和 **Web 服务器模式**。

---

## 🎯 运行模式对比

| 特性 | Electron 模式 | Web 模式 |
|------|---------------|----------|
| **适用系统** | Windows, macOS, Linux | Linux (服务器) |
| **界面形式** | 原生桌面窗口 | 浏览器访问 |
| **远程访问** | ❌ 本地使用 | ✅ 支持远程 |
| **GUI要求** | 需要图形界面 | 无需GUI |
| **OAuth授权** | 自动打开浏览器 | 手动打开链接 |
| **推荐场景** | 个人桌面使用 | 服务器部署 |
| **数据存储** | 用户数据目录 | ./data 目录 |

---

## 📦 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd gmail_client

# 安装依赖
npm install
```

---

## 🚀 快速启动

### 方式1：交互式启动（推荐）

```bash
npm start
```

启动后会显示菜单，根据系统自动推荐运行模式：
- **Windows系统**：推荐Electron模式
- **Linux系统**：推荐Web模式

### 方式2：直接指定模式

```bash
# Electron 模式
npm run start:electron

# Web 模式
npm run start:web
```

---

## 🖥️ Electron 模式部署

### 适用场景
- Windows/macOS 桌面用户
- 需要原生应用体验
- 本地个人使用

### 启动方式

```bash
npm run start:electron
```

### 系统要求
- 操作系统：Windows 10+, macOS 10.13+, Linux (需GUI)
- 需要图形界面环境
- Chrome/Chromium 浏览器（用于OAuth授权）

### 数据存储位置

- **Windows**: `%APPDATA%\gmail_client_electron\`
- **macOS**: `~/Library/Application Support/gmail_client_electron/`
- **Linux**: `~/.config/gmail_client_electron/`

### 特点
- ✅ 自动打开Puppeteer浏览器进行OAuth授权
- ✅ 原生窗口，系统托盘集成
- ✅ 离线缓存，快速启动

---

## 🌐 Web 模式部署

### 适用场景
- Linux 服务器部署
- 需要远程访问
- 无图形界面环境
- 多用户访问（需要配置）

### 启动方式

```bash
npm run start:web
```

### 端口配置

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| Web 界面 | 3000 | 主应用界面 |
| REST API | 3100 | 外部API接口 |
| OAuth 回调 | 3001 | Google OAuth 回调 |

可通过环境变量自定义：

```bash
WEB_PORT=8080 API_PORT=8081 npm run start:web
```

### 访问方式

启动后在浏览器访问：
```
http://localhost:3000
```

远程访问：
```
http://your-server-ip:3000
```

### 数据存储位置

```
./data/gmail_client.db
```

### 后台运行（推荐）

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/web.js --name gmail-client

# 查看状态
pm2 status

# 查看日志
pm2 logs gmail-client

# 停止服务
pm2 stop gmail-client

# 开机自启
pm2 startup
pm2 save
```

#### 使用 systemd (Linux)

创建服务文件 `/etc/systemd/system/gmail-client.service`:

```ini
[Unit]
Description=Gmail Client Web Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/gmail_client
ExecStart=/usr/bin/node /path/to/gmail_client/src/web.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=WEB_PORT=3000
Environment=API_PORT=3100

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start gmail-client
sudo systemctl enable gmail-client
sudo systemctl status gmail-client
```

### Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web 界面
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # REST API
    location /api/ {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # OAuth 回调
    location /callback {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

配置HTTPS（推荐使用 Let's Encrypt）：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 配置 Gmail API 凭据

两种模式都需要配置 Gmail API 凭据。

### 1. 创建 Google Cloud 项目

详细步骤请参考：[SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md)

### 2. 配置 OAuth 重定向 URI

**重要**：根据运行模式配置不同的重定向URI：

#### Electron 模式
```
http://localhost:3001/callback
```

#### Web 模式（本地）
```
http://localhost:3001/callback
```

#### Web 模式（远程部署）
```
https://your-domain.com/callback
```

或直接使用IP：
```
http://your-server-ip:3001/callback
```

### 3. 放置凭据文件

将下载的凭据文件重命名为 `credentials.json`，放置在：
```
config/credentials.json
```

---

## 🔧 环境变量配置

### Electron 模式

无需额外配置，使用默认设置。

### Web 模式

可通过环境变量自定义配置：

```bash
# 端口配置
export WEB_PORT=3000          # Web界面端口
export API_PORT=3100          # REST API端口

# 会话密钥（生产环境必须修改）
export SESSION_SECRET=your-random-secret-key-here

# 启动服务
npm run start:web
```

或创建 `.env` 文件（需要安装dotenv）：

```env
WEB_PORT=3000
API_PORT=3100
SESSION_SECRET=your-random-secret-key-here
```

---

## 🛡️ 安全建议

### Web 模式生产部署

1. **使用 HTTPS**
   - 配置SSL证书（Let's Encrypt）
   - 强制HTTPS重定向

2. **配置防火墙**
   ```bash
   # 只允许必要的端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **修改默认密钥**
   - 更改 `SESSION_SECRET` 为随机字符串
   - 使用环境变量，不要硬编码

4. **限制访问**
   - 配置IP白名单
   - 使用VPN或SSH隧道

5. **定期备份**
   ```bash
   # 备份数据库
   cp data/gmail_client.db backup/gmail_client_$(date +%Y%m%d).db
   ```

---

## 📊 监控和日志

### Web 模式

#### 查看日志
```bash
# PM2
pm2 logs gmail-client

# systemd
sudo journalctl -u gmail-client -f
```

#### 性能监控
```bash
# PM2
pm2 monit

# 系统资源
htop
```

---

## 🔄 更新和维护

### 更新代码

```bash
git pull origin main
npm install
```

### 重启服务

#### Electron 模式
直接重新启动应用

#### Web 模式 (PM2)
```bash
pm2 restart gmail-client
```

#### Web 模式 (systemd)
```bash
sudo systemctl restart gmail-client
```

---

## ❓ 常见问题

### 1. Electron模式：端口被占用

```bash
# 检查端口占用
lsof -i :3001
lsof -i :3100

# 杀死占用进程
kill -9 <PID>
```

### 2. Web模式：无法远程访问

检查防火墙和端口：
```bash
# 开放端口
sudo ufw allow 3000/tcp
sudo ufw allow 3100/tcp
sudo ufw allow 3001/tcp
```

检查服务器监听地址，确保绑定到 `0.0.0.0` 而不是 `localhost`。

### 3. OAuth授权失败

- 检查重定向URI配置是否正确
- 确保 Google Cloud 项目中的测试用户已添加
- 检查端口3001是否可访问

### 4. 数据库错误

```bash
# 删除数据库重新初始化
rm data/gmail_client.db  # Web模式
# 或重新安装应用 (Electron模式)
```

---

## 📞 技术支持

如遇到问题，请：
1. 查看日志文件
2. 检查 [README.md](README.md) 和 [SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md)
3. 提交 Issue 到 GitHub

---

## 📝 版本信息

- **v3.0.0**: 支持 Electron 和 Web 双模式运行
- **v2.1.0**: 迁移到 sql.js
- **v2.0.0**: 添加多账号支持
- **v1.0.0**: 初始版本
