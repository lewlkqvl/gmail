/**
 * 自动登录服务
 * 使用 Puppeteer 自动填写 Google 账号密码完成 OAuth 授权
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

class AutoLoginService {
  constructor(gmailService) {
    this.gmailService = gmailService;
    this.browser = null;
    this.authCallbackServer = null;
  }

  /**
   * 解析文本文件格式的账号列表
   * 格式: email|password (每行一组)
   * @param {string} textContent - 文件内容
   * @returns {Array<{email: string, password: string}>}
   */
  static parseTextFile(textContent) {
    const accounts = [];
    const lines = textContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 跳过空行和注释行
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // 解析 email|password 格式
      const parts = line.split('|');
      if (parts.length !== 2) {
        console.warn(`第 ${i + 1} 行格式错误，已跳过: ${line}`);
        continue;
      }

      const email = parts[0].trim();
      const password = parts[1].trim();

      if (!email || !password) {
        console.warn(`第 ${i + 1} 行邮箱或密码为空，已跳过: ${line}`);
        continue;
      }

      // 简单的邮箱格式验证
      if (!email.includes('@') || !email.includes('.')) {
        console.warn(`第 ${i + 1} 行邮箱格式错误，已跳过: ${email}`);
        continue;
      }

      accounts.push({ email, password });
    }

    return accounts;
  }

  /**
   * 查找系统中的 Chrome 可执行文件路径
   */
  findChromePath() {
    const platform = process.platform;

    if (platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
      const chromePaths = [
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];

      for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    } else {
      // Linux
      const chromeCommands = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
      ];

      for (const chromePath of chromeCommands) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    }

    return null;
  }

  /**
   * 等待指定时间（毫秒）
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 保存错误截图
   */
  async saveErrorScreenshot(page, email) {
    try {
      const timestamp = Date.now();
      const screenshotPath = `/tmp/autologin_${email.replace('@', '_at_')}_${timestamp}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[AutoLogin] 已保存错误截图: ${screenshotPath}`);
      return screenshotPath;
    } catch (e) {
      console.error('[AutoLogin] 保存截图失败:', e.message);
      return null;
    }
  }

  /**
   * 自动登录单个账号
   * @param {string} email - Gmail 邮箱
   * @param {string} password - Gmail 密码
   * @param {Function} onProgress - 进度回调函数
   * @returns {Promise<{success: boolean, email?: string, error?: string}>}
   */
  async autoLogin(email, password, onProgress = null) {
    const log = (message) => {
      console.log(`[AutoLogin] ${message}`);
      if (onProgress) onProgress(message);
    };

    try {
      log(`开始自动登录: ${email}`);

      // 查找 Chrome 路径
      const chromePath = this.findChromePath();
      if (!chromePath) {
        throw new Error('未找到 Chrome 浏览器');
      }

      log('启动浏览器...');

      // 启动浏览器（隐私模式）
      this.browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: false, // 显示浏览器窗口，方便调试
        args: [
          '--incognito',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1280,1024'
        ],
        defaultViewport: {
          width: 1280,
          height: 1024
        }
      });

      const pages = await this.browser.pages();
      const page = pages[0] || await this.browser.newPage();

      // 覆盖 prompt、alert、confirm 函数，防止阻塞
      await page.evaluateOnNewDocument(() => {
        window.alert = () => {};
        window.prompt = () => null;
        window.confirm = () => true;
      });

      // 监听控制台消息和错误
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`[Browser Error] ${msg.text()}`);
        }
      });

      page.on('pageerror', error => {
        console.log(`[Page Error] ${error.message}`);
      });

      // 设置用户代理，使其更像真实浏览器
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // 获取授权 URL
      const authUrl = this.gmailService.getAuthUrl();
      log('导航到授权页面...');

      // 导航到授权页面
      await page.goto(authUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 等待页面稳定
      await this.delay(2000);

      log('填写邮箱地址...');

      // 步骤1: 填写邮箱地址
      const emailInputSelector = 'input[type="email"]';
      await page.waitForSelector(emailInputSelector, { timeout: 10000 });
      await page.type(emailInputSelector, email, { delay: 100 }); // 模拟人类输入速度

      await this.delay(500);

      // 点击"下一步"按钮
      log('点击下一步...');
      const nextButtonSelectors = [
        '#identifierNext button',
        'button[jsname="LgbsSe"]',
        'div[id="identifierNext"]'
      ];

      let clicked = false;
      for (const selector of nextButtonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        throw new Error('未找到"下一步"按钮');
      }

      // 等待密码输入框出现
      await this.delay(3000);

      log('检查是否有错误提示...');

      // 检查邮箱是否有错误
      try {
        const errorElement = await page.$('[jsname="B34EJ"]'); // Google 错误提示的选择器
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          if (errorText) {
            throw new Error(`邮箱验证失败: ${errorText}`);
          }
        }
      } catch (e) {
        // 如果没有错误元素，继续
      }

      log('填写密码...');

      // 步骤2: 填写密码
      const passwordInputSelector = 'input[type="password"]';
      try {
        await page.waitForSelector(passwordInputSelector, { timeout: 10000 });
      } catch (e) {
        // 截图以便调试
        await this.saveErrorScreenshot(page, email);
        throw new Error('未找到密码输入框，可能是邮箱验证失败或页面加载问题');
      }

      await page.type(passwordInputSelector, password, { delay: 100 });

      await this.delay(500);

      // 点击"下一步"按钮
      log('提交密码...');
      const passwordNextSelectors = [
        '#passwordNext button',
        'button[jsname="LgbsSe"]',
        'div[id="passwordNext"]'
      ];

      clicked = false;
      for (const selector of passwordNextSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        throw new Error('未找到密码提交按钮');
      }

      // 等待验证和授权页面
      await this.delay(5000);

      log('检查密码验证结果...');

      // 检查密码是否错误
      const currentUrl = page.url();

      // 检查是否还在密码页面（可能密码错误）
      if (currentUrl.includes('/signin/v2/challenge/pwd')) {
        try {
          const errorElement = await page.$('[jsname="B34EJ"], [aria-live="assertive"]');
          if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            if (errorText && (errorText.includes('Wrong password') || errorText.includes('密码错误') || errorText.includes('Incorrect password'))) {
              throw new Error(`密码错误: ${email}`);
            }
          }
        } catch (e) {
          if (e.message.includes('密码错误')) {
            throw e;
          }
        }
      }

      log('等待授权页面...');

      // 检查是否需要双因素验证
      if (currentUrl.includes('challenge') || currentUrl.includes('verify')) {
        log('⚠️ 需要额外验证（2FA/验证码），请手动完成...');
        log('提示: 在浏览器中完成验证后，系统会自动继续');

        // 等待用户手动完成验证（最多2分钟）
        try {
          await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 120000
          });
          await this.delay(2000);
          log('验证完成，继续授权流程...');
        } catch (e) {
          throw new Error('等待验证超时（2分钟），请确保及时完成验证');
        }
      }

      // 步骤3: 点击"继续"或"允许"授权
      log('查找授权按钮...');

      // 等待授权页面加载
      await page.waitForSelector('button, input[type="submit"]', { timeout: 15000 });

      // 尝试多种可能的授权按钮选择器
      const approveSelectors = [
        'button[id="submit_approve_access"]',
        'button:has-text("继续")',
        'button:has-text("允许")',
        'button:has-text("Continue")',
        'button:has-text("Allow")',
        '#submit_approve_access',
        'input[type="submit"][value="Allow"]',
        'button[type="submit"]'
      ];

      clicked = false;
      for (const selector of approveSelectors) {
        try {
          const buttons = await page.$$(selector.startsWith('button:has-text') ? 'button' : selector);

          if (selector.startsWith('button:has-text')) {
            const searchText = selector.match(/"([^"]+)"/)[1];
            for (const button of buttons) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text && text.includes(searchText)) {
                log(`找到授权按钮: ${searchText}`);
                await button.click();
                clicked = true;
                break;
              }
            }
          } else if (buttons.length > 0) {
            log(`找到授权按钮: ${selector}`);
            await buttons[0].click();
            clicked = true;
          }

          if (clicked) break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        log('未找到授权按钮，尝试等待跳转...');
      }

      // 等待重定向到回调地址
      log('等待授权回调...');

      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 30000
      }).catch(() => {
        // 可能已经跳转完成
        console.log('Navigation timeout, checking URL...');
      });

      const finalUrl = page.url();
      log(`最终URL: ${finalUrl}`);

      // 检查是否成功跳转到回调地址
      if (finalUrl.includes('localhost:3001/callback')) {
        log('✅ 授权成功！');

        // 等待几秒让回调服务器处理
        await this.delay(5000);

        // 关闭浏览器
        await this.closeBrowser();

        return {
          success: true,
          email: email
        };
      } else {
        throw new Error('未能成功跳转到回调地址');
      }

    } catch (error) {
      log(`❌ 自动登录失败: ${error.message}`);

      // 尝试保存错误截图
      if (this.browser) {
        try {
          const pages = await this.browser.pages();
          if (pages.length > 0) {
            await this.saveErrorScreenshot(pages[0], email);
          }
        } catch (e) {
          console.error('[AutoLogin] 无法保存错误截图:', e.message);
        }
      }

      // 发生错误时关闭浏览器
      await this.closeBrowser();

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量自动登录多个账号
   * @param {Array<{email: string, password: string}>} accounts - 账号列表
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array>} 登录结果列表
   */
  async batchAutoLogin(accounts, onProgress = null) {
    const results = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      const progressCallback = (message) => {
        const fullMessage = `[${i + 1}/${accounts.length}] ${account.email}: ${message}`;
        console.log(fullMessage);
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: accounts.length,
            email: account.email,
            message: message
          });
        }
      };

      console.log(`\n开始处理账号 ${i + 1}/${accounts.length}: ${account.email}`);

      const result = await this.autoLogin(
        account.email,
        account.password,
        progressCallback
      );

      results.push({
        email: account.email,
        ...result
      });

      // 账号之间间隔几秒，避免被检测为机器人
      if (i < accounts.length - 1) {
        console.log('等待5秒后处理下一个账号...');
        await this.delay(5000);
      }
    }

    return results;
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('浏览器已关闭');
      } catch (e) {
        console.error('关闭浏览器时出错:', e);
      }
      this.browser = null;
    }
  }
}

module.exports = AutoLoginService;
