# Gmail Client REST API 文档

## 概述

Gmail Client 提供了REST API接口，允许外部应用程序通过HTTP请求查询邮件数据。

- **基础URL**: `http://localhost:3100`
- **端口**: `3100`
- **响应格式**: JSON

## API 端点

### 1. 健康检查

检查API服务是否正常运行。

**请求**
```http
GET /health
```

**响应示例**
```json
{
  "status": "ok",
  "message": "Gmail API Service is running"
}
```

---

### 2. 获取最后一封邮件

通过邮箱地址查询该账号的最后一封邮件。

**请求**
```http
GET /api/email/last?email=YOUR_EMAIL@gmail.com
```

**查询参数**
- `email` (必需): Gmail邮箱地址

**成功响应 (200)**
```json
{
  "success": true,
  "data": {
    "email": "your_email@gmail.com",
    "message": {
      "id": "18xxxxxxxxxxxxxxx",
      "threadId": "18xxxxxxxxxxxxxxx",
      "from": "sender@example.com",
      "to": "your_email@gmail.com",
      "subject": "邮件主题",
      "date": "Mon, 1 Jan 2024 12:00:00 +0800",
      "snippet": "邮件摘要...",
      "body": "完整的邮件内容...",
      "labelIds": ["INBOX", "UNREAD"]
    }
  }
}
```

**错误响应**

| 状态码 | 描述 | 响应示例 |
|--------|------|----------|
| 400 | 缺少email参数 | `{"success": false, "error": "Email parameter is required"}` |
| 401 | 账号未授权 | `{"success": false, "error": "Account xxx is not authorized"}` |
| 404 | 账号不存在或无邮件 | `{"success": false, "error": "Account not found for email: xxx"}` |
| 500 | 服务器内部错误 | `{"success": false, "error": "Internal server error"}` |

---

### 3. 获取所有账号列表

获取系统中已添加的所有Gmail账号。

**请求**
```http
GET /api/accounts
```

**成功响应 (200)**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 1,
        "email": "account1@gmail.com",
        "isActive": true,
        "isAuthorized": true
      },
      {
        "id": 2,
        "email": "account2@gmail.com",
        "isActive": false,
        "isAuthorized": true
      }
    ]
  }
}
```

---

## 使用示例

### cURL

```bash
# 健康检查
curl http://localhost:3100/health

# 获取最后一封邮件
curl "http://localhost:3100/api/email/last?email=your_email@gmail.com"

# 获取账号列表
curl http://localhost:3100/api/accounts
```

### JavaScript (Fetch API)

```javascript
// 获取最后一封邮件
async function getLastEmail(email) {
  const response = await fetch(
    `http://localhost:3100/api/email/last?email=${encodeURIComponent(email)}`
  );
  const data = await response.json();

  if (data.success) {
    console.log('最后一封邮件:', data.data.message);
  } else {
    console.error('错误:', data.error);
  }
}

// 获取账号列表
async function getAccounts() {
  const response = await fetch('http://localhost:3100/api/accounts');
  const data = await response.json();

  if (data.success) {
    console.log('账号列表:', data.data.accounts);
  }
}
```

### Python (requests)

```python
import requests

# 获取最后一封邮件
def get_last_email(email):
    response = requests.get(
        'http://localhost:3100/api/email/last',
        params={'email': email}
    )
    data = response.json()

    if data['success']:
        print('最后一封邮件:', data['data']['message'])
    else:
        print('错误:', data['error'])

# 获取账号列表
def get_accounts():
    response = requests.get('http://localhost:3100/api/accounts')
    data = response.json()

    if data['success']:
        print('账号列表:', data['data']['accounts'])

# 使用示例
get_last_email('your_email@gmail.com')
get_accounts()
```

---

## 注意事项

1. **账号授权**: 使用API之前，必须先在Gmail Client中完成账号的OAuth授权
2. **端口占用**: 确保3100端口未被其他应用占用
3. **CORS**: API已启用CORS，支持跨域请求
4. **账号切换**: 查询不同账号的邮件时，API会自动临时切换账号并在查询后恢复
5. **数据同步**: 如果数据库中没有邮件，API会自动从Gmail服务器同步最新数据

---

## 启动 API 服务

API服务会在启动Gmail Client应用时自动启动：

```bash
npm start
```

启动成功后，控制台会显示：

```
📡 REST API server running on http://localhost:3100
   - Health check: http://localhost:3100/health
   - Get last email: http://localhost:3100/api/email/last?email=YOUR_EMAIL
   - List accounts: http://localhost:3100/api/accounts
```

---

## 错误处理

所有错误响应都遵循以下格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见错误：
- 端口已被占用
- 账号未授权
- 账号不存在
- 网络连接问题
- Gmail API限制
