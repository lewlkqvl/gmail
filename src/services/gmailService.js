const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Gmail API 权限范围
// 使用完整访问权限以支持所有邮件操作：读取、发送、删除、修改标签等
// 注意：修改权限后，已授权的账号需要重新授权才能获得新权限
const SCOPES = ['https://mail.google.com/'];

class GmailService {
  constructor(dbService, pathHelper = null) {
    this.dbService = dbService;
    this.pathHelper = pathHelper;
    // 只保存 OAuth credentials 配置，不保存状态
    this.credentials = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // 只加载 credentials 配置
      this.credentials = await this.loadCredentials();
      this.initialized = true;
      console.log('Gmail service initialized successfully');
    } catch (error) {
      console.error('Error initializing Gmail client:', error.message);
      throw error;
    }
  }

  /**
   * 为指定账号创建独立的 Gmail API 实例
   * 每个请求都应该使用独立的实例，避免并发冲突
   */
  createGmailInstance(account) {
    if (!this.credentials) {
      throw new Error('Gmail service not initialized');
    }

    if (!account || !account.access_token) {
      throw new Error('Account not authorized');
    }

    const { client_secret, client_id } = this.credentials.installed;

    // 为此账号创建独立的 OAuth2 客户端
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      'http://localhost:3001/callback'
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      expiry_date: account.token_expiry
    });

    // 创建独立的 Gmail API 实例
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    return {
      gmail,
      oauth2Client,
      accountId: account.id,
      email: account.email
    };
  }

  /**
   * 创建临时的 OAuth2 客户端用于授权
   */
  createTempOAuth2Client() {
    if (!this.credentials) {
      throw new Error('Gmail service not initialized');
    }

    const { client_secret, client_id } = this.credentials.installed;

    return new google.auth.OAuth2(
      client_id,
      client_secret,
      'http://localhost:3001/callback'
    );
  }

  async loadCredentials() {
    try {
      const credentialsPath = this.pathHelper
        ? this.pathHelper.getCredentialsPath()
        : path.join(__dirname, '../../config/credentials.json');

      const content = await fs.readFile(credentialsPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error('请先配置 credentials.json 文件。参考 credentials.example.json');
    }
  }

  getAuthUrl() {
    const oauth2Client = this.createTempOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    return authUrl;
  }

  async setAuthCode(code, email) {
    console.log('Starting authorization with code');

    try {
      // 创建临时的OAuth2客户端用于授权
      const oauth2Client = this.createTempOAuth2Client();

      // 获取token
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // 初始化 Gmail API 获取用户邮箱
      const tempGmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await tempGmail.users.getProfile({ userId: 'me' });
      const userEmail = profile.data.emailAddress;

      console.log('New account authorization successful:', userEmail);

      // 检查账号是否已存在
      let account = this.dbService.getAccountByEmail(userEmail);
      let newAccountId;

      if (account) {
        // 更新现有账号的 token
        this.dbService.updateAccount(account.id, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date
        });
        newAccountId = account.id;
        console.log('Updated existing account:', newAccountId);
      } else {
        // 添加新账号
        newAccountId = this.dbService.addAccount(userEmail, null, tokens);
        console.log('Added new account:', newAccountId);
      }

      // 设置为活动账号
      this.dbService.setActiveAccount(newAccountId);

      console.log('Authorization completed successfully:', {
        email: userEmail,
        accountId: newAccountId,
        hasTokens: !!tokens.access_token,
        tokenPreview: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'none'
      });

      return userEmail;
    } catch (error) {
      console.error('Error in setAuthCode:', error);
      throw error;
    }
  }

  async switchAccount(accountId) {
    const account = this.dbService.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.access_token) {
      throw new Error('Account not authorized');
    }

    console.log('Switching account to:', account.email);

    // 只更新数据库活动账号
    this.dbService.setActiveAccount(accountId);

    console.log('Account switched successfully to:', account.email);
  }

  /**
   * 验证账号是否匹配活动账号
   * 用于防止账号不匹配导致的数据混乱
   */
  validateAccountMatch(expectedAccountId, activeAccount) {
    if (!activeAccount) {
      throw new Error('No active account');
    }

    if (expectedAccountId && activeAccount.id !== expectedAccountId) {
      throw new Error(
        `Account mismatch: expected account ${expectedAccountId}, but active account is ${activeAccount.id} (${activeAccount.email})`
      );
    }
  }

  async isAuthorized() {
    const activeAccount = this.dbService.getActiveAccount();
    return !!(activeAccount && activeAccount.access_token);
  }

  async syncMessages(maxResults = 50, expectedAccountId = null) {
    // 从数据库加载活动账号
    const activeAccount = this.dbService.getActiveAccount();

    if (!activeAccount || !activeAccount.access_token) {
      throw new Error('Not authorized. Please authorize first.');
    }

    // 验证账号匹配
    this.validateAccountMatch(expectedAccountId, activeAccount);

    console.log('syncMessages called for account:', activeAccount.email);

    // 为此请求创建独立的 Gmail API 实例
    const { gmail, accountId } = this.createGmailInstance(activeAccount);

    // 使用独立实例获取邮件列表
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    const messages = response.data.messages || [];

    // 获取每封邮件的详细信息并保存到数据库
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = details.data.payload.headers;
          const getHeader = (name) => {
            const header = headers.find(h => h.name === name);
            return header ? header.value : '';
          };

          const message = {
            id: msg.id,
            threadId: msg.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            snippet: details.data.snippet,
            labelIds: details.data.labelIds || []
          };

          // 保存到数据库（使用此请求的 accountId）
          this.dbService.saveMessage(accountId, message);

          return message;
        } catch (error) {
          console.error(`Error fetching message ${msg.id}:`, error);
          return null;
        }
      })
    );

    console.log(`syncMessages completed: ${detailedMessages.filter(m => m !== null).length}/${messages.length} messages synced`);

    return detailedMessages.filter(msg => msg !== null);
  }

  async listMessages(maxResults = 50, expectedAccountId = null) {
    // 从数据库加载活动账号
    const activeAccount = this.dbService.getActiveAccount();

    console.log('listMessages called:', {
      hasActiveAccount: !!activeAccount,
      activeAccountId: activeAccount ? activeAccount.id : null,
      activeAccountEmail: activeAccount ? activeAccount.email : null,
      expectedAccountId: expectedAccountId
    });

    if (!activeAccount || !activeAccount.id) {
      throw new Error('No active account. Please import or add an account first.');
    }

    // 验证账号匹配
    this.validateAccountMatch(expectedAccountId, activeAccount);

    // 从数据库读取邮件（不需要Gmail API）
    return this.dbService.getMessages(activeAccount.id, maxResults);
  }

  async getMessage(messageId) {
    // 先从数据库读取
    let message = this.dbService.getMessage(messageId);

    // 如果数据库中没有 body，从 API 获取
    if (message && !message.body) {
      // 获取活动账号并创建独立 Gmail 实例
      const activeAccount = this.dbService.getActiveAccount();
      if (!activeAccount || !activeAccount.access_token) {
        throw new Error('Not authorized. Please authorize first.');
      }

      const { gmail, accountId } = this.createGmailInstance(activeAccount);

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const apiMessage = response.data;
      const headers = apiMessage.payload.headers;

      const getHeader = (name) => {
        const header = headers.find(h => h.name === name);
        return header ? header.value : '';
      };

      // 解析邮件正文
      let body = '';
      if (apiMessage.payload.body.data) {
        body = Buffer.from(apiMessage.payload.body.data, 'base64').toString('utf-8');
      } else if (apiMessage.payload.parts) {
        const textPart = apiMessage.payload.parts.find(part =>
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      message = {
        id: apiMessage.id,
        threadId: apiMessage.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        body: body,
        labelIds: apiMessage.labelIds || []
      };

      // 更新数据库
      this.dbService.saveMessage(accountId, message);
    }

    return message;
  }

  /**
   * 直接使用指定账号同步邮件（无状态方法，用于REST API）
   * @param {Object} account - 账号对象，必须包含 id, email, access_token, refresh_token
   * @param {number} maxResults - 要同步的邮件数量
   * @returns {Promise<Array>} - 同步的邮件列表
   */
  async syncMessagesForAccount(account, maxResults = 50) {
    if (!account || !account.access_token) {
      throw new Error('Account not authorized');
    }

    // 为此账号创建独立的 Gmail 实例
    const { gmail, accountId } = this.createGmailInstance(account);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      console.log('No messages found for account:', account.email);
      return [];
    }

    // 获取每封邮件的详细信息
    const messages = await Promise.all(
      response.data.messages.map(async (msg) => {
        const messageData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        });

        const headers = messageData.data.payload.headers;
        const getHeader = (name) => {
          const header = headers.find(h => h.name === name);
          return header ? header.value : '';
        };

        return {
          id: messageData.data.id,
          threadId: messageData.data.threadId,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          snippet: messageData.data.snippet,
          labelIds: messageData.data.labelIds || []
        };
      })
    );

    // 保存到数据库
    messages.forEach(message => {
      this.dbService.saveMessage(accountId, message);
    });

    console.log(`Synced ${messages.length} messages for account:`, account.email);
    return messages;
  }

  /**
   * 直接使用指定账号获取完整邮件内容（无状态方法，用于REST API）
   * @param {string} messageId - 邮件ID
   * @param {Object} account - 账号对象，必须包含 id, email, access_token, refresh_token
   * @returns {Promise<Object>} - 完整的邮件对象
   */
  async getMessageForAccount(messageId, account) {
    if (!account || !account.access_token) {
      throw new Error('Account not authorized');
    }

    // 先从数据库读取
    let message = this.dbService.getMessage(messageId);

    // 如果数据库中没有或缺少 body，从 API 获取
    if (!message || !message.body) {
      const { gmail, accountId } = this.createGmailInstance(account);

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const apiMessage = response.data;
      const headers = apiMessage.payload.headers;

      const getHeader = (name) => {
        const header = headers.find(h => h.name === name);
        return header ? header.value : '';
      };

      // 解析邮件正文
      let body = '';
      if (apiMessage.payload.body.data) {
        body = Buffer.from(apiMessage.payload.body.data, 'base64').toString('utf-8');
      } else if (apiMessage.payload.parts) {
        const textPart = apiMessage.payload.parts.find(part =>
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      message = {
        id: apiMessage.id,
        threadId: apiMessage.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        body: body,
        snippet: apiMessage.snippet,
        labelIds: apiMessage.labelIds || []
      };

      // 保存到数据库
      this.dbService.saveMessage(accountId, message);
    }

    return message;
  }

  async sendMessage({ to, subject, message }, expectedAccountId = null) {
    // 获取活动账号并创建独立 Gmail 实例
    const activeAccount = this.dbService.getActiveAccount();
    if (!activeAccount || !activeAccount.access_token) {
      throw new Error('Not authorized. Please authorize first.');
    }

    // 验证账号匹配
    this.validateAccountMatch(expectedAccountId, activeAccount);

    const { gmail } = this.createGmailInstance(activeAccount);

    const email = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      message
    ].join('\n');

    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return response.data;
  }

  async deleteMessage(messageId, expectedAccountId = null) {
    // 获取活动账号并创建独立 Gmail 实例
    const activeAccount = this.dbService.getActiveAccount();
    if (!activeAccount || !activeAccount.access_token) {
      throw new Error('Not authorized. Please authorize first.');
    }

    // 验证账号匹配
    this.validateAccountMatch(expectedAccountId, activeAccount);

    const { gmail } = this.createGmailInstance(activeAccount);

    try {
      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });

      // 在数据库中标记为已删除
      this.dbService.deleteMessage(messageId);
    } catch (error) {
      // 检测权限不足错误
      if (error.code === 403 || error.message.includes('Insufficient Permission')) {
        throw new Error('权限不足：请删除当前账号并重新添加以获得完整权限。操作步骤：账号管理 → 删除账号 → 重新添加账号');
      }
      throw error;
    }
  }

  async markAsRead(messageId, expectedAccountId = null) {
    // 获取活动账号并创建独立 Gmail 实例
    const activeAccount = this.dbService.getActiveAccount();
    if (!activeAccount || !activeAccount.access_token) {
      throw new Error('Not authorized. Please authorize first.');
    }

    // 验证账号匹配
    this.validateAccountMatch(expectedAccountId, activeAccount);

    const { gmail } = this.createGmailInstance(activeAccount);

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    // 更新数据库
    this.dbService.markMessageAsRead(messageId);
  }

  getCurrentAccountId() {
    const activeAccount = this.dbService.getActiveAccount();
    return activeAccount ? activeAccount.id : null;
  }
}

module.exports = GmailService;
