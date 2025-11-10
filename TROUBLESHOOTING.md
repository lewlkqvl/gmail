# 批量自动登录故障排除指南

## 常见错误及解决方案

### 1. prompt() is and will not be supported

**错误信息**: `prompt() is and will not be supported`

**原因**: Google 登录页面尝试调用 `window.prompt()` 弹窗，但在 Puppeteer 环境中不被支持。

**已解决**: 最新版本已自动覆盖 `prompt()`、`alert()`、`confirm()` 函数，此错误应该不会再出现。

**如果仍然出现**:
- 确保已更新到最新代码
- 检查浏览器控制台输出，可能还有其他问题

---

### 2. 密码错误

**错误信息**: `密码错误: xxx@gmail.com`

**原因**: 输入的密码不正确

**解决方案**:
1. 检查密码是否正确
2. **推荐**: 使用 Google 应用专用密码而非主密码
3. 生成应用专用密码:
   - 访问 https://myaccount.google.com/security
   - 启用"两步验证"
   - 选择"应用专用密码"
   - 生成新密码并使用

---

### 3. 邮箱验证失败

**错误信息**: `未找到密码输入框，可能是邮箱验证失败或页面加载问题`

**原因**:
- 邮箱地址不存在
- 邮箱格式错误
- 网络延迟导致页面未加载完成

**解决方案**:
1. 检查邮箱地址拼写
2. 确认邮箱确实是 Gmail 账号
3. 检查网络连接
4. 查看错误截图（保存在 `/tmp/autologin_xxx.png`）

---

### 4. 需要额外验证 (2FA/验证码)

**提示信息**: `⚠️ 需要额外验证（2FA/验证码），请手动完成...`

**原因**: 账号启用了双因素验证或 Google 要求额外验证

**解决方案**:
1. **手动操作**: 在自动打开的浏览器窗口中完成验证
2. 系统会等待最多 2 分钟
3. 完成验证后，系统会自动继续
4. 如果超时，需要重新运行

**常见验证类型**:
- 短信验证码
- 手机提示确认
- 邮件验证
- 安全问题

---

### 5. 等待验证超时

**错误信息**: `等待验证超时（2分钟），请确保及时完成验证`

**原因**: 在 2 分钟内没有完成验证

**解决方案**:
1. 确保在浏览器窗口中及时完成操作
2. 如果网络慢，可以修改超时时间:
   ```javascript
   // 在 autoLoginService.js 中找到并修改
   timeout: 120000  // 改为更长时间（毫秒）
   ```

---

### 6. Chrome 浏览器未找到

**错误信息**: `未找到 Chrome 浏览器`

**原因**: 系统中没有安装 Google Chrome 或 Chromium

**解决方案**:

**Windows**:
```
下载并安装: https://www.google.com/chrome/
```

**macOS**:
```bash
brew install --cask google-chrome
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install google-chrome-stable

# 或使用 Chromium
sudo apt install chromium-browser
```

---

### 7. 授权回调失败

**错误信息**: `未能成功跳转到回调地址`

**原因**:
- OAuth 回调服务器未启动
- 防火墙阻止了 localhost:3001
- Google 授权过程中断

**解决方案**:
1. 确保端口 3001 未被占用
2. 检查防火墙设置
3. 重新运行并重试

---

### 8. Google 安全检测

**现象**:
- 频繁要求验证
- 登录速度变慢
- 出现验证码

**原因**: Google 检测到自动化行为

**解决方案**:
1. **增加间隔时间**: 账号之间间隔更长时间
   ```javascript
   // 在批量登录时增加间隔
   await this.delay(10000); // 改为 10 秒或更长
   ```

2. **分批次处理**: 不要一次性处理太多账号
   ```
   # 每次处理 5 个账号
   第一批: accounts 1-5
   第二批: accounts 6-10 (间隔 10 分钟)
   ```

3. **使用应用专用密码**: 减少被检测的风险

4. **不同时间段**: 分散在不同时间段登录

---

## 调试技巧

### 1. 查看错误截图

系统会自动保存失败时的截图：

```bash
# 查看截图
ls -lt /tmp/autologin_*.png | head -5

# 打开最新的截图
# Linux
xdg-open /tmp/autologin_*.png

# macOS
open /tmp/autologin_*.png
```

截图可以帮助您看到：
- 是否停在验证页面
- 是否有错误提示
- 页面加载情况

### 2. 查看浏览器日志

浏览器控制台的错误会输出到终端：

```
[Browser Error] ...
[Page Error] ...
```

### 3. 手动测试

如果自动登录失败，可以手动测试：

```bash
# 单个账号测试
node test_autologin.js your@gmail.com your_password
```

### 4. 减少并发

一次只登录一个账号：

```javascript
// 修改账号文件，只保留一个账号进行测试
user1@gmail.com|password1
```

---

## 最佳实践

### 1. 使用应用专用密码

**强烈推荐** 使用 Google 应用专用密码：

✅ 更安全
✅ 不会暴露主密码
✅ 减少被检测风险
✅ 可以随时撤销

生成步骤：
1. https://myaccount.google.com/security
2. 两步验证 → 应用专用密码
3. 选择"邮件"和设备
4. 生成 16 位密码
5. 复制并使用（去掉空格）

### 2. 账号分批处理

```bash
# 第一批 (5 个账号)
cat accounts_batch1.txt
user1@gmail.com|pass1
user2@gmail.com|pass2
...

# 第二批 (5 个账号) - 10 分钟后
cat accounts_batch2.txt
user6@gmail.com|pass6
user7@gmail.com|pass7
...
```

### 3. 合理设置间隔

```javascript
// 修改 autoLoginService.js 中的间隔时间
// 账号之间间隔几秒，避免被检测为机器人
if (i < accounts.length - 1) {
  console.log('等待 10 秒后处理下一个账号...');
  await this.delay(10000); // 改为 10 秒
}
```

### 4. 监控登录成功率

```bash
# 运行测试并查看结果
node test_autologin.js 2>&1 | tee login_results.log

# 统计成功率
grep "登录成功" login_results.log | wc -l
grep "登录失败" login_results.log | wc -l
```

---

## 技术支持

如果以上方法都无法解决您的问题：

1. 查看错误截图（`/tmp/autologin_*.png`）
2. 收集完整的错误日志
3. 提供账号信息（隐去密码）：
   - 是否启用 2FA
   - 是否使用应用专用密码
   - Google 账号注册时间
4. 在 GitHub 提交 Issue

---

## 常见问题 FAQ

**Q: 为什么有些账号成功，有些失败？**
A: 可能是：
- 个别账号密码错误
- 个别账号需要额外验证
- Google 随机检测

**Q: 可以跳过失败的账号继续吗？**
A: 可以，批量登录会继续处理下一个账号。

**Q: 多久可以登录一次？**
A: 建议至少间隔 5 秒，最好 10 秒以上。

**Q: 可以同时运行多个批量登录吗？**
A: 不建议，可能导致端口冲突和资源争用。

**Q: 失败后可以重试吗？**
A: 可以，但建议先检查错误原因。

**Q: 会被 Google 封号吗？**
A: 正常使用不会，但频繁自动登录可能触发安全检测。建议使用应用专用密码。

---

## 更新日志

### v1.1.0 (最新)
- ✅ 修复 `prompt()` 错误
- ✅ 添加错误截图功能
- ✅ 增强密码错误检测
- ✅ 改进邮箱验证检测
- ✅ 更详细的错误提示

### v1.0.0
- 初始版本
- 基础自动登录功能
