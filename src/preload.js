const { contextBridge, ipcRenderer, clipboard } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('gmailAPI', {
  // 授权相关
  authorize: () => ipcRenderer.invoke('gmail:authorize'),
  setAuthCode: (code) => ipcRenderer.invoke('gmail:setAuthCode', code),
  checkAuth: () => ipcRenderer.invoke('gmail:checkAuth'),

  // 邮件操作
  syncMessages: (maxResults, expectedAccountId) => ipcRenderer.invoke('gmail:syncMessages', maxResults, expectedAccountId),
  listMessages: (maxResults, expectedAccountId) => ipcRenderer.invoke('gmail:listMessages', maxResults, expectedAccountId),
  getMessage: (messageId) => ipcRenderer.invoke('gmail:getMessage', messageId),
  sendMessage: (messageData, expectedAccountId) => ipcRenderer.invoke('gmail:sendMessage', messageData, expectedAccountId),
  deleteMessage: (messageId, expectedAccountId) => ipcRenderer.invoke('gmail:deleteMessage', messageId, expectedAccountId),
  markAsRead: (messageId, expectedAccountId) => ipcRenderer.invoke('gmail:markAsRead', messageId, expectedAccountId),
  getStats: () => ipcRenderer.invoke('gmail:getStats'),

  // 账号管理
  account: {
    getAll: () => ipcRenderer.invoke('account:getAll'),
    getActive: () => ipcRenderer.invoke('account:getActive'),
    switch: (accountId) => ipcRenderer.invoke('account:switch', accountId),
    add: (data) => ipcRenderer.invoke('account:add', data),
    delete: (accountId) => ipcRenderer.invoke('account:delete', accountId),
    deleteAll: () => ipcRenderer.invoke('account:deleteAll'),
    export: () => ipcRenderer.invoke('account:export'),
    import: () => ipcRenderer.invoke('account:import'),
    autoLogin: (data) => ipcRenderer.invoke('account:autoLogin', data),
    batchAutoLogin: (accounts) => ipcRenderer.invoke('account:batchAutoLogin', accounts),
    importAndAutoLogin: () => ipcRenderer.invoke('account:importAndAutoLogin')
  },

  // 工具函数
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  copyToClipboard: (text) => {
    try {
      if (!text || typeof text !== 'string') {
        console.error('[Preload] 复制失败: 无效的文本参数', text);
        return { success: false, error: 'Invalid text parameter' };
      }

      console.log('[Preload] 尝试复制到剪贴板:', text.substring(0, 50));
      clipboard.writeText(text);

      // 验证是否真的复制成功
      const clipboardContent = clipboard.readText();
      if (clipboardContent === text) {
        console.log('[Preload] ✓ 复制成功，已验证剪贴板内容');
        return { success: true };
      } else {
        console.error('[Preload] ✗ 复制失败: 剪贴板内容不匹配');
        return { success: false, error: 'Clipboard content mismatch' };
      }
    } catch (error) {
      console.error('[Preload] ✗ 复制异常:', error);
      return { success: false, error: error.message };
    }
  },

  // 事件监听
  onAuthSuccess: (callback) => {
    ipcRenderer.on('auth:success', (event, data) => callback(data));
  },
  onAuthFailed: (callback) => {
    ipcRenderer.on('auth:failed', (event, error) => callback(error));
  },
  onAutoLoginProgress: (callback) => {
    ipcRenderer.on('autoLogin:progress', (event, progress) => callback(progress));
  }
});
