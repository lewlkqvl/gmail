const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DatabaseService {
  constructor(pathHelper = null) {
    this.db = null;
    this.dbPath = null;
    this.SQL = null;
    this.initialized = false;
    this.pathHelper = pathHelper;
  }

  // 初始化数据库
  async initialize() {
    try {
      // 加载 sql.js
      this.SQL = await initSqlJs();

      // 设置数据库路径
      if (this.pathHelper) {
        // 使用PathHelper（web模式或已配置的electron模式）
        this.dbPath = this.pathHelper.getDatabasePath();
      } else {
        // 回退到electron模式（为了向后兼容）
        try {
          const { app } = require('electron');
          const userDataPath = app.getPath('userData');
          this.dbPath = path.join(userDataPath, 'gmail_client.db');
        } catch (error) {
          // 如果不在electron环境中，使用默认路径
          console.warn('Not in Electron environment, using default path');
          this.dbPath = path.join(process.cwd(), 'data', 'gmail_client.db');

          // 确保data目录存在
          const dataDir = path.dirname(this.dbPath);
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
        }
      }

      // 尝试加载现有数据库
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
      } else {
        // 创建新数据库
        this.db = new this.SQL.Database();
      }

      // 初始化表结构
      this.initializeTables();

      // 保存数据库
      this.save();

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // 加密密码
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('gmail-client-secret-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  // 解密密码
  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('gmail-client-secret-key', 'salt', 32);

    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // 保存数据库到文件
  save() {
    if (!this.db || !this.dbPath) return;

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // 初始化表结构
  initializeTables() {
    // 创建账号表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry INTEGER,
        is_active INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // 创建邮件表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        message_id TEXT UNIQUE NOT NULL,
        thread_id TEXT,
        from_email TEXT,
        to_email TEXT,
        subject TEXT,
        snippet TEXT,
        body TEXT,
        date TEXT,
        labels TEXT,
        is_read INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_account_id ON messages(account_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date DESC)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)`);
  }

  // ==================== 账号管理 ====================

  // 添加账号
  addAccount(email, password = null, tokens = null) {
    const encryptedPassword = password ? this.encrypt(password) : null;
    const accessToken = tokens?.access_token || null;
    const refreshToken = tokens?.refresh_token || null;
    const tokenExpiry = tokens?.expiry_date || null;

    this.db.run(
      `INSERT INTO accounts (email, password, access_token, refresh_token, token_expiry)
       VALUES (?, ?, ?, ?, ?)`,
      [email, encryptedPassword, accessToken, refreshToken, tokenExpiry]
    );

    this.save();

    // 获取插入的 ID
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0];
  }

  // 更新账号
  updateAccount(id, data) {
    const updates = [];
    const values = [];

    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      values.push(data.password ? this.encrypt(data.password) : null);
    }
    if (data.access_token !== undefined) {
      updates.push('access_token = ?');
      values.push(data.access_token);
    }
    if (data.refresh_token !== undefined) {
      updates.push('refresh_token = ?');
      values.push(data.refresh_token);
    }
    if (data.token_expiry !== undefined) {
      updates.push('token_expiry = ?');
      values.push(data.token_expiry);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));

    values.push(id);

    this.db.run(
      `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    this.save();
  }

  // 获取账号
  getAccount(id) {
    const result = this.db.exec('SELECT * FROM accounts WHERE id = ?', [id]);

    if (!result.length || !result[0].values.length) return null;

    const account = this.rowToObject(result[0].columns, result[0].values[0]);

    if (account && account.password) {
      account.password = this.decrypt(account.password);
    }

    return account;
  }

  // 通过邮箱获取账号
  getAccountByEmail(email) {
    const result = this.db.exec('SELECT * FROM accounts WHERE email = ?', [email]);

    if (!result.length || !result[0].values.length) return null;

    const account = this.rowToObject(result[0].columns, result[0].values[0]);

    if (account && account.password) {
      account.password = this.decrypt(account.password);
    }

    return account;
  }

  // 获取所有账号
  getAllAccounts() {
    const result = this.db.exec('SELECT * FROM accounts ORDER BY created_at DESC');

    if (!result.length) return [];

    const accounts = result[0].values.map(row =>
      this.rowToObject(result[0].columns, row)
    );

    return accounts.map(account => {
      if (account.password) {
        account.password = this.decrypt(account.password);
      }
      return account;
    });
  }

  // 获取活动账号
  getActiveAccount() {
    const result = this.db.exec('SELECT * FROM accounts WHERE is_active = 1 LIMIT 1');

    if (!result.length || !result[0].values.length) return null;

    const account = this.rowToObject(result[0].columns, result[0].values[0]);

    if (account && account.password) {
      account.password = this.decrypt(account.password);
    }

    return account;
  }

  // 设置活动账号
  setActiveAccount(id) {
    // 先将所有账号设置为非活动
    this.db.run('UPDATE accounts SET is_active = 0');

    // 设置指定账号为活动
    const timestamp = Math.floor(Date.now() / 1000);
    this.db.run('UPDATE accounts SET is_active = 1, updated_at = ? WHERE id = ?', [timestamp, id]);

    this.save();
  }

  // 删除账号
  deleteAccount(id) {
    this.db.run('DELETE FROM accounts WHERE id = ?', [id]);
    this.save();
  }

  // 删除所有账号
  deleteAllAccounts() {
    this.db.run('DELETE FROM accounts');
    // 同时删除所有关联的邮件
    this.db.run('DELETE FROM messages');
    this.save();
  }

  // ==================== 邮件管理 ====================

  // 保存邮件
  saveMessage(accountId, message) {
    const labels = Array.isArray(message.labelIds) ? message.labelIds.join(',') : '';
    const isRead = message.labelIds && !message.labelIds.includes('UNREAD') ? 1 : 0;

    // 使用 INSERT OR REPLACE
    this.db.run(
      `INSERT OR REPLACE INTO messages
       (account_id, message_id, thread_id, from_email, to_email, subject, snippet, body, date, labels, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        message.id,
        message.threadId || '',
        message.from || '',
        message.to || '',
        message.subject || '',
        message.snippet || '',
        message.body || '',
        message.date || '',
        labels,
        isRead
      ]
    );

    this.save();
  }

  // 批量保存邮件
  saveMessages(accountId, messages) {
    messages.forEach(message => {
      this.saveMessage(accountId, message);
    });
  }

  // 获取邮件列表
  getMessages(accountId, limit = 50, offset = 0) {
    const result = this.db.exec(
      `SELECT * FROM messages
       WHERE account_id = ? AND is_deleted = 0
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [accountId, limit, offset]
    );

    if (!result.length) return [];

    const messages = result[0].values.map(row =>
      this.rowToObject(result[0].columns, row)
    );

    return messages.map(msg => ({
      ...msg,
      labelIds: msg.labels ? msg.labels.split(',') : []
    }));
  }

  // 获取单个邮件
  getMessage(messageId) {
    const result = this.db.exec('SELECT * FROM messages WHERE message_id = ?', [messageId]);

    if (!result.length || !result[0].values.length) return null;

    const message = this.rowToObject(result[0].columns, result[0].values[0]);

    if (message) {
      message.labelIds = message.labels ? message.labels.split(',') : [];
    }

    return message;
  }

  // 标记邮件为已读
  markMessageAsRead(messageId) {
    this.db.run('UPDATE messages SET is_read = 1 WHERE message_id = ?', [messageId]);
    this.save();
  }

  // 删除邮件（软删除）
  deleteMessage(messageId) {
    this.db.run('UPDATE messages SET is_deleted = 1 WHERE message_id = ?', [messageId]);
    this.save();
  }

  // 获取邮件统计
  getMessageStats(accountId) {
    const result = this.db.exec(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
       FROM messages
       WHERE account_id = ? AND is_deleted = 0`,
      [accountId]
    );

    if (!result.length || !result[0].values.length) {
      return { total: 0, unread: 0 };
    }

    return this.rowToObject(result[0].columns, result[0].values[0]);
  }

  // ==================== 导入导出 ====================

  // 导出账号
  exportAccounts() {
    const accounts = this.getAllAccounts();

    return accounts.map(account => ({
      email: account.email,
      password: account.password,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expiry: account.token_expiry,
      created_at: account.created_at
    }));
  }

  // 导入账号
  importAccounts(accounts) {
    const results = [];
    let firstAddedAccountId = null;

    for (const account of accounts) {
      try {
        // 检查账号是否已存在
        const existing = this.getAccountByEmail(account.email);

        if (existing) {
          // 更新已存在的账号（包括token）
          this.updateAccount(existing.id, {
            password: account.password,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            token_expiry: account.token_expiry
          });
          results.push({ email: account.email, status: 'updated' });

          // 记录第一个更新的账号ID（如果有token）
          if (!firstAddedAccountId && account.access_token) {
            firstAddedAccountId = existing.id;
          }
        } else {
          // 添加新账号（包括token）
          const tokens = account.access_token ? {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expiry_date: account.token_expiry
          } : null;

          const newAccountId = this.addAccount(account.email, account.password, tokens);
          results.push({ email: account.email, status: 'added' });

          // 记录第一个添加的账号ID（如果有token）
          if (!firstAddedAccountId && tokens) {
            firstAddedAccountId = newAccountId;
          }
        }
      } catch (error) {
        results.push({ email: account.email, status: 'error', error: error.message });
      }
    }

    // 如果当前没有活动账号，自动设置第一个导入的账号为活动账号
    const currentActiveAccount = this.getActiveAccount();
    console.log('importAccounts summary:', {
      totalAccounts: accounts.length,
      results: results,
      firstAddedAccountId: firstAddedAccountId,
      hasCurrentActiveAccount: !!currentActiveAccount,
      currentActiveAccountId: currentActiveAccount ? currentActiveAccount.id : null
    });

    if (!currentActiveAccount && firstAddedAccountId) {
      this.setActiveAccount(firstAddedAccountId);
      console.log('✅ Auto-set first imported account as active:', firstAddedAccountId);

      // 验证设置是否成功
      const verifyActiveAccount = this.getActiveAccount();
      console.log('Verification - Active account after set:', {
        id: verifyActiveAccount ? verifyActiveAccount.id : null,
        email: verifyActiveAccount ? verifyActiveAccount.email : null
      });
    } else if (currentActiveAccount) {
      console.log('ℹ️ Active account already exists, not changing:', currentActiveAccount.email);
    } else if (!firstAddedAccountId) {
      console.log('⚠️ No valid account to set as active (all accounts lack tokens)');
    }

    return results;
  }

  // ==================== 工具函数 ====================

  // 将数据库行转换为对象
  rowToObject(columns, values) {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = values[idx];
    });
    return obj;
  }

  // 关闭数据库
  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DatabaseService;
