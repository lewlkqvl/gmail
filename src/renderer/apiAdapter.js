/**
 * API适配器
 * 自动检测运行模式（Electron或Web），并使用相应的通信方式
 */

class ApiAdapter {
  constructor() {
    // 检测运行模式
    this.isElectron = typeof window !== 'undefined' && window.gmailAPI !== undefined;
    this.mode = this.isElectron ? 'electron' : 'web';
    this._authSuccessCallback = null;
    this._authFailedCallback = null;
    this._authPollingInterval = null;

    console.log(`🔧 API Adapter initialized in ${this.mode} mode`);

    // Web模式下设置授权监听机制
    if (!this.isElectron) {
      this._setupWebAuthListeners();
    }
  }

  /**
   * 设置Web模式的授权监听（多种方式）
   */
  _setupWebAuthListeners() {
    // 方式1：监听 postMessage
    window.addEventListener('message', (event) => {
      // 验证来源
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data;
      if (data && data.type === 'gmail-auth-success') {
        console.log('📨 收到postMessage授权成功通知:', data);
        this._handleAuthSuccess(data);
      }
    });

    // 方式2：监听 localStorage 变化
    window.addEventListener('storage', (event) => {
      if (event.key === 'gmail-auth-success' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          console.log('📦 收到localStorage授权成功通知:', data);
          this._handleAuthSuccess(data);
          // 清除标记
          localStorage.removeItem('gmail-auth-success');
        } catch (e) {
          console.error('解析localStorage数据失败:', e);
        }
      }
    });

    // 方式3：使用 BroadcastChannel（如果支持）
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('gmail-auth-channel');
        channel.addEventListener('message', (event) => {
          const data = event.data;
          if (data && data.type === 'gmail-auth-success') {
            console.log('📡 收到BroadcastChannel授权成功通知:', data);
            this._handleAuthSuccess(data);
          }
        });
      } catch (e) {
        console.warn('BroadcastChannel不可用:', e);
      }
    }

    // 方式4：页面可见时检查localStorage（处理同标签页授权的情况）
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this._checkStoredAuthSuccess();
      }
    });

    // 方式5：定期轮询（最后的备选方案，启动时检查一次）
    this._checkStoredAuthSuccess();
  }

  /**
   * 检查localStorage中存储的授权成功标记
   */
  _checkStoredAuthSuccess() {
    try {
      const stored = localStorage.getItem('gmail-auth-success');
      if (stored) {
        const data = JSON.parse(stored);
        // 检查时间戳，只处理5分钟内的
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          console.log('✅ 发现localStorage中的授权成功标记:', data);
          this._handleAuthSuccess(data);
        }
        // 清除标记
        localStorage.removeItem('gmail-auth-success');
      }
    } catch (e) {
      console.error('检查localStorage失败:', e);
    }
  }

  /**
   * 处理授权成功
   */
  _handleAuthSuccess(data) {
    if (this._authSuccessCallback) {
      console.log('🎉 触发授权成功回调');
      this._authSuccessCallback(data);
    }
  }

  /**
   * Electron模式：调用IPC
   * Web模式：调用HTTP API
   */
  async callApi(method, ...args) {
    if (this.isElectron) {
      // Electron模式：使用IPC
      return await window.gmailAPI[method](...args);
    } else {
      // Web模式：使用HTTP API
      return await this._callHttpApi(method, args);
    }
  }

  /**
   * HTTP API调用（Web模式）
   */
  async _callHttpApi(method, args) {
    // 将IPC方法映射到HTTP端点
    const methodMap = {
      // Gmail操作
      'authorize': { method: 'POST', url: '/api/gmail/authorize' },
      'setAuthCode': { method: 'POST', url: '/api/gmail/setAuthCode', body: (args) => ({ code: args[0] }) },
      'checkAuth': { method: 'GET', url: '/api/gmail/checkAuth' },
      'syncMessages': { method: 'POST', url: '/api/gmail/syncMessages', body: (args) => ({ maxResults: args[0], expectedAccountId: args[1] || null }) },
      'listMessages': { method: 'GET', url: (args) => `/api/gmail/listMessages?maxResults=${args[0] || 50}${args[1] ? `&expectedAccountId=${args[1]}` : ''}` },
      'getMessage': { method: 'GET', url: (args) => `/api/gmail/getMessage/${args[0]}` },
      'sendMessage': { method: 'POST', url: '/api/gmail/sendMessage', body: (args) => ({ ...args[0], expectedAccountId: args[1] || null }) },
      'deleteMessage': { method: 'DELETE', url: (args) => `/api/gmail/deleteMessage/${args[0]}${args[1] ? `?expectedAccountId=${args[1]}` : ''}` },
      'markAsRead': { method: 'POST', url: (args) => `/api/gmail/markAsRead/${args[0]}`, body: (args) => ({ expectedAccountId: args[1] || null }) },
      'getStats': { method: 'GET', url: '/api/gmail/getStats' },

      // 账号操作
      'getAllAccounts': { method: 'GET', url: '/api/account/getAll' },
      'getActiveAccount': { method: 'GET', url: '/api/account/getActive' },
      'switchAccount': { method: 'POST', url: '/api/account/switch', body: (args) => ({ accountId: args[0] }) },
      'deleteAccount': { method: 'DELETE', url: (args) => `/api/account/delete/${args[0]}` },
      'deleteAllAccounts': { method: 'DELETE', url: '/api/account/deleteAll' },
      'exportAccounts': { method: 'GET', url: '/api/account/export' },
      'importAccounts': { method: 'POST', url: '/api/account/import', body: (args) => ({ accounts: args[0] }) },
    };

    const apiConfig = methodMap[method];
    if (!apiConfig) {
      throw new Error(`Unknown API method: ${method}`);
    }

    const fetchOptions = {
      method: apiConfig.method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // 包含cookies（用于session）
    };

    // 构建URL
    let url = apiConfig.url;
    if (typeof url === 'function') {
      url = url(args);
    }

    // 添加请求体
    if (apiConfig.body && (apiConfig.method === 'POST' || apiConfig.method === 'PUT')) {
      fetchOptions.body = JSON.stringify(apiConfig.body(args));
    }

    try {
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed (${method}):`, error);
      throw error;
    }
  }

  /**
   * 打开外部链接
   */
  async openExternal(url) {
    if (this.isElectron) {
      return await window.gmailAPI.openExternal(url);
    } else {
      // Web模式：在新标签页打开
      window.open(url, '_blank');
      return { success: true };
    }
  }

  /**
   * 监听授权成功事件
   */
  onAuthSuccess(callback) {
    if (this.isElectron) {
      window.gmailAPI.onAuthSuccess(callback);
    } else {
      // Web模式：轮询检查授权状态
      this._authSuccessCallback = callback;
    }
  }

  /**
   * 监听授权失败事件
   */
  onAuthFailed(callback) {
    if (this.isElectron) {
      window.gmailAPI.onAuthFailed(callback);
    } else {
      // Web模式：通过HTTP响应处理
      this._authFailedCallback = callback;
    }
  }

  /**
   * 获取运行模式
   */
  getMode() {
    return this.mode;
  }

  /**
   * 是否为Electron模式
   */
  isElectronMode() {
    return this.isElectron;
  }

  /**
   * 是否为Web模式
   */
  isWebMode() {
    return !this.isElectron;
  }
}

// 创建全局实例
const apiAdapter = new ApiAdapter();

// 兼容性包装：模拟window.gmailAPI接口
if (!apiAdapter.isElectron) {
  window.gmailAPI = {
    authorize: () => apiAdapter.callApi('authorize'),
    setAuthCode: (code) => apiAdapter.callApi('setAuthCode', code),
    checkAuth: () => apiAdapter.callApi('checkAuth'),
    syncMessages: (maxResults) => apiAdapter.callApi('syncMessages', maxResults),
    listMessages: (maxResults) => apiAdapter.callApi('listMessages', maxResults),
    getMessage: (messageId) => apiAdapter.callApi('getMessage', messageId),
    sendMessage: (data) => apiAdapter.callApi('sendMessage', data),
    deleteMessage: (messageId) => apiAdapter.callApi('deleteMessage', messageId),
    markAsRead: (messageId) => apiAdapter.callApi('markAsRead', messageId),
    getStats: () => apiAdapter.callApi('getStats'),

    // 账号管理（与Electron模式保持一致的结构）
    account: {
      getAll: () => apiAdapter.callApi('getAllAccounts'),
      getActive: () => apiAdapter.callApi('getActiveAccount'),
      switch: (accountId) => apiAdapter.callApi('switchAccount', accountId),
      delete: (accountId) => apiAdapter.callApi('deleteAccount', accountId),
      deleteAll: () => apiAdapter.callApi('deleteAllAccounts'),
      export: () => apiAdapter.callApi('exportAccounts'),
      import: (accounts) => apiAdapter.callApi('importAccounts', accounts)
    },

    openExternal: (url) => apiAdapter.openExternal(url),
    onAuthSuccess: (callback) => apiAdapter.onAuthSuccess(callback),
    onAuthFailed: (callback) => apiAdapter.onAuthFailed(callback),
  };
}
