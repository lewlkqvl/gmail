// 全局变量
let currentMessages = [];
let currentMessageId = null;
let currentAccounts = [];
let sidebarCurrentPage = 1;
let sidebarPageSize = 10;
let sidebarTotalPages = 1;

// DOM 元素
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authBtn = document.getElementById('auth-btn');
const authImportBtn = document.getElementById('auth-import-btn');
const authWaiting = document.getElementById('auth-waiting');
const authError = document.getElementById('auth-error');

const accountInfo = document.getElementById('account-info');
const accountsBtn = document.getElementById('accounts-btn');
const composeBtn = document.getElementById('compose-btn');
const syncBtn = document.getElementById('sync-btn');
const syncAllBtn = document.getElementById('sync-all-btn');
const mailListContainer = document.getElementById('mail-list-container');
const loading = document.getElementById('loading');
const mailDetailEmpty = document.getElementById('mail-detail-empty');
const mailDetailContainer = document.getElementById('mail-detail-container');
const deleteBtn = document.getElementById('delete-btn');
const replyBtn = document.getElementById('reply-btn');

const composeModal = document.getElementById('compose-modal');
const composeTo = document.getElementById('compose-to');
const composeSubject = document.getElementById('compose-subject');
const composeMessage = document.getElementById('compose-message');
const sendBtn = document.getElementById('send-btn');
const composeError = document.getElementById('compose-error');
const composeSuccess = document.getElementById('compose-success');

const accountsModal = document.getElementById('accounts-modal');
const addAccountBtn = document.getElementById('add-account-btn');
const batchAuthBtn = document.getElementById('batch-auth-btn');
const importAccountsBtn = document.getElementById('import-accounts-btn');
const exportAccountsBtn = document.getElementById('export-accounts-btn');
const deleteAllAccountsBtn = document.getElementById('delete-all-accounts-btn');
const accountsList = document.getElementById('accounts-list');
const accountsError = document.getElementById('accounts-error');
const accountsSuccess = document.getElementById('accounts-success');

// 批量授权模态框元素
const batchAuthModal = document.getElementById('batch-auth-modal');
const batchAuthStep1 = document.getElementById('batch-auth-step1');
const batchAuthStep2 = document.getElementById('batch-auth-step2');
const batchAuthStep3 = document.getElementById('batch-auth-step3');
const batchAuthFile = document.getElementById('batch-auth-file');
const batchAuthTextarea = document.getElementById('batch-auth-textarea');
const batchAuthParseBtn = document.getElementById('batch-auth-parse-btn');
const batchAuthBackBtn = document.getElementById('batch-auth-back-btn');
const batchAuthStartBtn = document.getElementById('batch-auth-start-btn');
const batchAuthCloseBtn = document.getElementById('batch-auth-close-btn');
const batchAuthCount = document.getElementById('batch-auth-count');
const batchAuthList = document.getElementById('batch-auth-list');
const batchAuthProgressBar = document.getElementById('batch-auth-progress-bar');
const batchAuthProgressText = document.getElementById('batch-auth-progress-text');
const batchAuthLog = document.getElementById('batch-auth-log');
const batchAuthError = document.getElementById('batch-auth-error');

// 侧边栏账号列表元素
const accountsSidebarList = document.getElementById('accounts-sidebar-list');
const accountsPagination = document.getElementById('accounts-pagination');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfo = document.getElementById('page-info');
const sidebarAddAccountBtn = document.getElementById('sidebar-add-account-btn');

// ============ 工具函数 ============

// 检测是否为Web模式
function isWebMode() {
  // Electron环境中会有window.process
  return typeof window.process === 'undefined';
}

// 复制文本到剪贴板（多种方法兼容）
async function copyToClipboard(text, options = {}) {
  // 兼容旧的调用方式：copyToClipboard(text, true/false)
  if (typeof options === 'boolean') {
    options = { showFeedback: options };
  }

  // 默认配置
  const {
    showFeedback = true,    // 是否显示全局反馈（Toast或弹窗）
    onSuccess = null,       // 成功回调函数
    onError = null          // 失败回调函数
  } = options;

  let success = false;

  // 方法1: 优先使用 Electron clipboard API（最可靠）
  if (window.gmailAPI && window.gmailAPI.copyToClipboard) {
    try {
      console.log('[复制] 尝试方法1: Electron clipboard API');
      const result = window.gmailAPI.copyToClipboard(text);
      console.log('[复制] Electron clipboard 返回结果:', result);

      if (result && result.success === true) {
        success = true;
        console.log('✓ Electron clipboard 复制成功');
      } else {
        console.warn('✗ Electron clipboard 返回失败:', result);
      }
    } catch (error) {
      console.error('✗ Electron clipboard 异常:', error);
    }
  } else {
    console.log('[复制] Electron clipboard API 不可用');
  }

  // 方法2: 尝试使用现代 Clipboard API
  if (!success) {
    try {
      console.log('[复制] 尝试方法2: Navigator Clipboard API');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
        console.log('✓ Navigator clipboard 复制成功');
      } else {
        console.log('[复制] Navigator Clipboard API 不可用');
      }
    } catch (error) {
      console.error('✗ Navigator clipboard 失败:', error);
    }
  }

  // 方法3: 使用传统的 execCommand 方法
  if (!success) {
    try {
      console.log('[复制] 尝试方法3: document.execCommand');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      // 尝试选择所有文本（兼容iOS）
      textarea.setSelectionRange(0, textarea.value.length);

      // 执行复制命令
      const execResult = document.execCommand('copy');
      console.log('[复制] execCommand 返回结果:', execResult);

      document.body.removeChild(textarea);

      if (execResult === true) {
        success = true;
        console.log('✓ execCommand 复制成功');
      } else {
        console.warn('✗ execCommand 返回 false');
      }
    } catch (error) {
      console.error('✗ execCommand 异常:', error);
    }
  }

  // 最终判断和反馈
  console.log('[复制] 最终结果 - success:', success);

  if (success === true) {
    // 复制成功
    console.log('✅ 复制成功');

    // 调用成功回调
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }

    // 显示全局反馈
    if (showFeedback) {
      showCopyToast('✓ 已复制');
    }

    return true;
  } else {
    // 复制失败
    console.error('❌ 所有复制方法都失败了');

    // 调用失败回调
    if (onError && typeof onError === 'function') {
      onError();
    }

    // 显示全局反馈
    if (showFeedback) {
      showManualCopyPrompt(text);
    }

    return false;
  }
}

// 显示复制成功提示框
function showCopyToast(message) {
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 1500);
}

// 显示手动复制提示框
function showManualCopyPrompt(text) {
  const modal = document.createElement('div');
  modal.className = 'manual-copy-modal';
  modal.innerHTML = `
    <div class="manual-copy-content">
      <div class="manual-copy-header">
        <h3>📋 请手动复制</h3>
        <button class="manual-copy-close">&times;</button>
      </div>
      <div class="manual-copy-body">
        <p>自动复制失败，请手动选择并复制以下内容：</p>
        <div class="manual-copy-text-container">
          <input type="text" class="manual-copy-text" value="${escapeHtml(text)}" readonly>
          <button class="manual-copy-select-btn">全选</button>
        </div>
        <p class="manual-copy-hint">💡 提示：点击"全选"按钮，然后按 Ctrl+C (Mac: Cmd+C) 复制</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 自动选中文本
  const input = modal.querySelector('.manual-copy-text');
  input.focus();
  input.select();

  // 关闭按钮事件
  const closeBtn = modal.querySelector('.manual-copy-close');
  closeBtn.onclick = () => {
    modal.classList.add('fade-out');
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 300);
  };

  // 全选按钮事件
  const selectBtn = modal.querySelector('.manual-copy-select-btn');
  selectBtn.onclick = () => {
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
  };

  // 点击背景关闭
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeBtn.click();
    }
  };

  // 添加淡入动画
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Web模式导入账号辅助函数
async function importAccountsInWebMode() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve({ success: false, error: 'User cancelled' });
        return;
      }

      try {
        const text = await file.text();
        const accounts = JSON.parse(text);

        if (!Array.isArray(accounts)) {
          resolve({ success: false, error: 'Invalid file format' });
          return;
        }

        // 调用Web API导入账号
        const result = await window.gmailAPI.account.import(accounts);
        resolve(result);
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    };

    input.click();
  });
}

// ============ 初始化 ============

// 初始化
async function initialize() {
  const result = await window.gmailAPI.checkAuth();
  if (result.success && result.isAuthorized) {
    showMainScreen();
    await loadSidebarAccounts();
    await loadActiveAccount();
    await loadMessages();
  } else {
    showAuthScreen();
  }

  // 监听授权成功事件
  window.gmailAPI.onAuthSuccess(async (data) => {
    console.log('授权成功:', data);

    // 切换到主界面
    showMainScreen();

    // 加载侧边栏账号列表
    await loadSidebarAccounts();

    // 加载账号信息
    await loadActiveAccount();

    // 给服务一点时间初始化，然后尝试同步
    console.log('等待服务就绪...');
    setTimeout(async () => {
      try {
        // 首次同步不显示alert，静默失败
        await syncMessages(false);
        console.log('✅ 首次同步成功');
      } catch (error) {
        console.error('⚠️ 首次同步失败:', error);
        // 首次同步失败不阻塞用户，只在控制台记录
        // 用户可以稍后手动点击同步按钮
        console.log('💡 提示：可以点击"同步"按钮手动同步邮件');
      }
    }, 1500); // 延迟1.5秒再同步，给服务更多准备时间
  });

  // 监听授权失败事件
  window.gmailAPI.onAuthFailed((error) => {
    console.error('授权失败:', error);
    showError(authError, '授权失败: ' + error);
    // 恢复授权按钮
    authWaiting.classList.add('hidden');
    authBtn.classList.remove('hidden');
    authBtn.disabled = false;
    authBtn.textContent = '授权 Gmail 访问';
  });
}

// 显示授权界面
function showAuthScreen() {
  authScreen.classList.remove('hidden');
  mainScreen.classList.add('hidden');
}

// 显示主界面
function showMainScreen() {
  authScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

// ==================== 侧边栏账号列表 ====================

// 加载侧边栏账号列表
async function loadSidebarAccounts() {
  const result = await window.gmailAPI.account.getAll();
  if (result.success) {
    currentAccounts = result.accounts;
    renderSidebarAccounts();
  } else {
    console.error('加载账号列表失败:', result.error);
  }
}

// 渲染侧边栏账号列表（支持分页）
function renderSidebarAccounts() {
  accountsSidebarList.innerHTML = '';

  if (currentAccounts.length === 0) {
    accountsSidebarList.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <div style="color: #80868b; font-size: 13px; margin-bottom: 16px;">暂无账号</div>
        <button id="sidebar-import-btn" class="btn btn-sm" style="width: 100%; margin-bottom: 8px;">
          📥 导入账号
        </button>
        <div style="color: #999; font-size: 11px; margin-top: 12px;">
          或点击顶部 ➕ 添加新账号
        </div>
      </div>
    `;

    // 绑定导入按钮事件
    const sidebarImportBtn = document.getElementById('sidebar-import-btn');
    if (sidebarImportBtn) {
      sidebarImportBtn.addEventListener('click', async () => {
        // Web模式需要先选择文件
        const result = isWebMode()
          ? await importAccountsInWebMode()
          : await window.gmailAPI.account.import();

        if (result.success) {
          const summary = result.results.map(r => {
            if (r.status === 'added') return `✓ ${r.email} - 已添加`;
            if (r.status === 'updated') return `✓ ${r.email} - 已更新`;
            return `✗ ${r.email} - ${r.error}`;
          }).join('\n');

          alert(`导入完成！\n${summary}`);
          await loadSidebarAccounts();
          await loadActiveAccount();
          await loadMessages();
        } else if (result.error !== 'User cancelled') {
          alert('导入失败: ' + result.error);
        }
      });
    }

    accountsPagination.classList.add('hidden');
    return;
  }

  // 计算总页数
  sidebarTotalPages = Math.ceil(currentAccounts.length / sidebarPageSize);

  // 确保当前页在有效范围内
  if (sidebarCurrentPage > sidebarTotalPages) {
    sidebarCurrentPage = sidebarTotalPages;
  }
  if (sidebarCurrentPage < 1) {
    sidebarCurrentPage = 1;
  }

  // 计算当前页的账号
  const startIndex = (sidebarCurrentPage - 1) * sidebarPageSize;
  const endIndex = Math.min(startIndex + sidebarPageSize, currentAccounts.length);
  const pageAccounts = currentAccounts.slice(startIndex, endIndex);

  // 渲染当前页的账号
  pageAccounts.forEach(account => {
    const accountItem = document.createElement('div');
    accountItem.className = 'sidebar-account-item';

    if (account.is_active) {
      accountItem.classList.add('active');
    }

    if (!account.has_token) {
      accountItem.classList.add('not-authorized');
    }

    const statusClass = account.has_token ? 'authorized' : 'not-authorized';
    const statusText = account.has_token ? '✓ 已授权' : '✗ 未授权';

    accountItem.innerHTML = `
      <div class="sidebar-account-main">
        <div class="sidebar-account-email" title="${escapeHtml(account.email)}">
          ${escapeHtml(account.email)}
        </div>
        <div class="sidebar-account-status ${statusClass}">${statusText}</div>
      </div>
      <button class="sidebar-account-copy-btn" title="复制邮箱地址" data-email="${escapeHtml(account.email)}">
        📋
      </button>
    `;

    // 只有已授权的账号才能点击切换
    if (account.has_token) {
      const mainArea = accountItem.querySelector('.sidebar-account-main');
      mainArea.onclick = () => {
        if (!account.is_active) {
          switchToAccount(account.id, account.email);
        }
      };
      mainArea.style.cursor = 'pointer';
    }

    // 绑定复制按钮事件
    const copyBtn = accountItem.querySelector('.sidebar-account-copy-btn');
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      copyToClipboard(account.email);
    };

    accountsSidebarList.appendChild(accountItem);
  });

  // 更新分页控件
  updatePaginationControls();
}

// 更新分页控件
function updatePaginationControls() {
  if (sidebarTotalPages <= 1) {
    accountsPagination.classList.add('hidden');
    return;
  }

  accountsPagination.classList.remove('hidden');
  pageInfo.textContent = `${sidebarCurrentPage}/${sidebarTotalPages}`;

  // 更新按钮状态
  prevPageBtn.disabled = sidebarCurrentPage <= 1;
  nextPageBtn.disabled = sidebarCurrentPage >= sidebarTotalPages;
}

// 切换到指定账号并同步邮件
async function switchToAccount(accountId, email) {
  console.log(`切换账号: ${email} (ID: ${accountId})`);

  // 显示加载状态
  loading.classList.remove('hidden');
  mailListContainer.innerHTML = '';

  try {
    // 调用切换账号API
    const result = await window.gmailAPI.account.switch(accountId);
    if (result.success) {
      console.log('✅ 账号切换成功');

      // 验证切换是否成功
      const activeResult = await window.gmailAPI.account.getActive();
      if (activeResult.success && activeResult.account && activeResult.account.id !== accountId) {
        throw new Error(`Account switch verification failed: expected ${accountId}, got ${activeResult.account.id}`);
      }

      // 刷新侧边栏和顶部账号信息
      await loadSidebarAccounts();
      await loadActiveAccount();

      // 加载新账号的邮件列表，传递 accountId 进行验证
      await loadMessages(accountId);

      // 同步新账号的邮件（静默失败），传递 accountId 进行验证
      setTimeout(async () => {
        try {
          await syncMessages(false, accountId);
          console.log('✅ 账号邮件同步成功');
        } catch (error) {
          console.error('⚠️ 账号邮件同步失败:', error);
        }
      }, 1000);
    } else {
      loading.classList.add('hidden');
      alert('切换账号失败: ' + result.error);
    }
  } catch (error) {
    loading.classList.add('hidden');
    alert('切换账号失败: ' + error.message);
    console.error('切换账号错误:', error);
  }
}

// 分页按钮事件监听
prevPageBtn.addEventListener('click', () => {
  if (sidebarCurrentPage > 1) {
    sidebarCurrentPage--;
    renderSidebarAccounts();
  }
});

nextPageBtn.addEventListener('click', () => {
  if (sidebarCurrentPage < sidebarTotalPages) {
    sidebarCurrentPage++;
    renderSidebarAccounts();
  }
});

// 侧边栏添加账号按钮
sidebarAddAccountBtn.addEventListener('click', async () => {
  showModal('accounts-modal');
  await loadAccounts();
});

// 加载活动账号信息
async function loadActiveAccount() {
  const result = await window.gmailAPI.account.getActive();
  if (result.success && result.account) {
    accountInfo.textContent = result.account.email;
  }
}

// 授权按钮点击
authBtn.addEventListener('click', async () => {
  console.log('授权按钮被点击');
  authBtn.disabled = true;
  authBtn.textContent = '正在启动授权...';

  try {
    const result = await window.gmailAPI.authorize();
    console.log('授权结果:', result);

    if (result.success) {
      console.log('授权 URL:', result.authUrl);
      // 打开浏览器授权页面（隐私模式）
      await window.gmailAPI.openExternal(result.authUrl);
      // 显示等待界面
      authWaiting.classList.remove('hidden');
      authError.classList.add('hidden');
      authBtn.classList.add('hidden');
      authImportBtn.classList.add('hidden');
    } else {
      showError(authError, result.error);
      authBtn.textContent = '授权 Gmail 访问';
      authBtn.disabled = false;
    }
  } catch (error) {
    console.error('授权过程出错:', error);
    showError(authError, error.message);
    authBtn.textContent = '授权 Gmail 访问';
    authBtn.disabled = false;
  }
});

// 授权界面导入账号按钮
authImportBtn.addEventListener('click', async () => {
  console.log('授权界面导入按钮被点击');
  authImportBtn.disabled = true;
  authImportBtn.textContent = '正在导入...';

  try {
    // Web模式需要先选择文件
    const result = isWebMode()
      ? await importAccountsInWebMode()
      : await window.gmailAPI.account.import();

    if (result.success) {
      const summary = result.results.map(r => {
        if (r.status === 'added') return `✓ ${r.email} - 已添加`;
        if (r.status === 'updated') return `✓ ${r.email} - 已更新`;
        return `✗ ${r.email} - ${r.error}`;
      }).join('\n');

      alert(`导入完成！\n${summary}`);

      // 切换到主界面
      showMainScreen();
      await loadSidebarAccounts();
      await loadActiveAccount();
      await loadMessages();
    } else if (result.error !== 'User cancelled') {
      showError(authError, '导入失败: ' + result.error);
    }
  } catch (error) {
    console.error('导入过程出错:', error);
    showError(authError, error.message);
  } finally {
    authImportBtn.textContent = '📥 导入已有账号';
    authImportBtn.disabled = false;
  }
});

// 同步邮件
async function syncMessages(showAlert = true, expectedAccountId = null) {
  loading.classList.remove('hidden');
  mailListContainer.innerHTML = '';

  try {
    const result = await window.gmailAPI.syncMessages(50, expectedAccountId);
    loading.classList.add('hidden');

    if (result.success) {
      await loadMessages(expectedAccountId);
      return true;
    } else {
      if (showAlert) {
        alert('同步失败: ' + result.error);
      } else {
        throw new Error(result.error);
      }
      return false;
    }
  } catch (error) {
    loading.classList.add('hidden');
    if (showAlert) {
      alert('同步失败: ' + error.message);
    }
    throw error;
  }
}

// 同步所有账号的邮件
async function syncAllAccounts() {
  // 禁用按钮防止重复点击
  syncAllBtn.disabled = true;
  syncAllBtn.textContent = '🔄 同步中...';

  loading.classList.remove('hidden');
  mailListContainer.innerHTML = '';

  try {
    // 获取所有账号
    const accountsResult = await window.gmailAPI.account.getAll();

    if (!accountsResult.success || !accountsResult.accounts || accountsResult.accounts.length === 0) {
      alert('没有可同步的账号');
      syncAllBtn.disabled = false;
      syncAllBtn.textContent = '🔄 同步所有';
      loading.classList.add('hidden');
      return;
    }

    const accounts = accountsResult.accounts;
    const totalAccounts = accounts.length;

    console.log(`开始同步 ${totalAccounts} 个账号的邮件...`);

    // 调用批量同步 API
    const result = await window.gmailAPI.syncAllMessages(50);

    loading.classList.add('hidden');
    syncAllBtn.disabled = false;
    syncAllBtn.textContent = '🔄 同步所有';

    if (result.success) {
      const { totalAccounts, successCount, failedCount, results } = result;

      // 构建详细消息
      let message = `同步完成！\n\n`;
      message += `总账号数: ${totalAccounts}\n`;
      message += `成功: ${successCount} 个\n`;
      if (failedCount > 0) {
        message += `失败: ${failedCount} 个\n\n`;
        message += `失败详情:\n`;
        results.filter(r => !r.success).forEach(r => {
          message += `- ${r.email}: ${r.error}\n`;
        });
      }

      alert(message);

      // 重新加载当前账号的邮件列表
      const activeAccount = await window.gmailAPI.account.getActive();
      if (activeAccount.success && activeAccount.account) {
        await loadMessages(activeAccount.account.id);
      }
    } else {
      alert('批量同步失败: ' + result.error);
    }
  } catch (error) {
    loading.classList.add('hidden');
    syncAllBtn.disabled = false;
    syncAllBtn.textContent = '🔄 同步所有';
    alert('批量同步失败: ' + error.message);
    console.error('批量同步错误:', error);
  }
}

// 加载邮件列表（从数据库）
async function loadMessages(expectedAccountId = null) {
  loading.classList.remove('hidden');

  const result = await window.gmailAPI.listMessages(50, expectedAccountId);
  loading.classList.add('hidden');

  if (result.success) {
    currentMessages = result.messages;
    renderMessageList(result.messages);
  } else {
    showError(authError, result.error);
  }
}

// 渲染邮件列表
function renderMessageList(messages) {
  mailListContainer.innerHTML = '';

  if (messages.length === 0) {
    mailListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #80868b;">暂无邮件，点击"同步邮件"获取最新邮件</div>';
    return;
  }

  // 按日期排序：最新的邮件在前
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA; // 降序：最新的在前
  });

  console.log('[邮件列表] 按日期排序完成，共', sortedMessages.length, '封邮件');

  sortedMessages.forEach((message, index) => {
    const mailItem = document.createElement('div');
    mailItem.className = 'mail-item';

    // 检查是否未读
    if (message.labelIds && (message.labelIds.includes('UNREAD') || message.is_read === 0)) {
      mailItem.classList.add('unread');
    }

    const from = extractEmail(message.from || message.from_email || '');
    const subject = message.subject || '(无主题)';
    const snippet = message.snippet || '';
    const date = formatDate(message.date);

    mailItem.innerHTML = `
      <div class="mail-item-from">${escapeHtml(from)}</div>
      <div class="mail-item-subject">${escapeHtml(subject)}</div>
      <div class="mail-item-snippet">${escapeHtml(snippet)}</div>
      <div class="mail-item-date">${escapeHtml(date)}</div>
    `;

    mailItem.addEventListener('click', () => {
      selectMessage(message.message_id || message.id, index);
    });

    mailListContainer.appendChild(mailItem);
  });
}

// 选择邮件
async function selectMessage(messageId, index) {
  // 更新选中状态
  const mailItems = document.querySelectorAll('.mail-item');
  mailItems.forEach((item, idx) => {
    item.classList.remove('active');
    if (idx === index) {
      item.classList.add('active');
    }
  });

  currentMessageId = messageId;

  // 加载邮件详情
  const result = await window.gmailAPI.getMessage(messageId);
  if (result.success && result.message) {
    renderMessageDetail(result.message);

    // 标记为已读
    if (result.message.labelIds && result.message.labelIds.includes('UNREAD')) {
      await window.gmailAPI.markAsRead(messageId);
      mailItems[index].classList.remove('unread');
    }
  }
}

// 渲染邮件详情
function renderMessageDetail(message) {
  mailDetailEmpty.classList.add('hidden');
  mailDetailContainer.classList.remove('hidden');

  document.getElementById('detail-subject').textContent = message.subject || '(无主题)';
  document.getElementById('detail-from').textContent = message.from || message.from_email || '';
  document.getElementById('detail-to').textContent = message.to || message.to_email || '';
  document.getElementById('detail-date').textContent = formatDateDetailed(message.date) || '';

  // 渲染邮件正文
  const bodyElement = document.getElementById('detail-body');
  const body = message.body || '';

  if (body.includes('<html') || body.includes('<body')) {
    bodyElement.innerHTML = body;
  } else {
    bodyElement.textContent = body;
  }

  // 提取并显示邮件中的链接
  extractAndDisplayLinks(body);
}

// 提取邮件中的所有链接（优化版）
function extractLinks(html) {
  if (!html) return [];

  const links = new Set();

  try {
    // 方式1: 使用DOMParser解析HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1.1 提取所有<a>标签的href属性
    const anchorTags = doc.querySelectorAll('a[href]');
    anchorTags.forEach(a => {
      const href = a.getAttribute('href');
      if (href) {
        const cleanedUrl = cleanUrl(href);
        if (cleanedUrl && isValidHttpUrl(cleanedUrl)) {
          links.add(cleanedUrl);
        }
      }
    });

    // 1.2 提取其他标签中可能包含URL的属性（如img src, iframe src等）
    const elementsWithUrls = doc.querySelectorAll('[src], [data-url], [data-href]');
    elementsWithUrls.forEach(el => {
      ['src', 'data-url', 'data-href'].forEach(attr => {
        const url = el.getAttribute(attr);
        if (url) {
          const cleanedUrl = cleanUrl(url);
          if (cleanedUrl && isValidHttpUrl(cleanedUrl)) {
            links.add(cleanedUrl);
          }
        }
      });
    });

    // 方式2: 从纯文本中提取URL
    // 获取所有文本内容（包括<a>标签的文本）
    const bodyText = doc.body ? doc.body.textContent : html;

    // 使用更强大的URL正则表达式
    // 支持各种URL格式，包括带端口号、查询参数、锚点等
    const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;

    const matches = bodyText.matchAll(urlRegex);
    for (const match of matches) {
      const url = match[0];
      const cleanedUrl = cleanUrl(url);
      if (cleanedUrl && isValidHttpUrl(cleanedUrl)) {
        links.add(cleanedUrl);
      }
    }

    // 方式3: 直接从原始HTML中提取（防止DOMParser丢失某些格式）
    const htmlMatches = html.matchAll(urlRegex);
    for (const match of htmlMatches) {
      const url = match[0];
      const cleanedUrl = cleanUrl(url);
      if (cleanedUrl && isValidHttpUrl(cleanedUrl)) {
        links.add(cleanedUrl);
      }
    }

  } catch (error) {
    console.error('链接提取失败:', error);
  }

  // 转换为数组并排序（按域名分组）
  const linksArray = Array.from(links);

  // 打印提取结果以便调试
  if (linksArray.length > 0) {
    console.log(`✅ 成功提取 ${linksArray.length} 个链接:`, linksArray);
  } else {
    console.log('ℹ️ 未在邮件中发现任何链接');
  }

  return linksArray;
}

// 清理URL，去除尾部的标点符号等
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';

  // 去除首尾空格
  url = url.trim();

  // 去除URL尾部常见的标点符号（但保留URL中合法的标点）
  // 这些标点通常是句子结尾，不是URL的一部分
  const trailingPunctuation = /[.,;:!?)\]}>'"]+$/;
  url = url.replace(trailingPunctuation, '');

  // 处理URL中的HTML实体编码
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = url;
    url = textarea.value;
  } catch (e) {
    // 如果解码失败，使用原始URL
  }

  // 去除可能的尾部反斜杠（但如果URL就是根路径则保留）
  if (url.length > 10 && url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return url;
}

// 验证是否为有效的HTTP/HTTPS URL
function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;

  // 基本检查
  if (!string.startsWith('http://') && !string.startsWith('https://')) {
    return false;
  }

  // 检查URL长度（太短的不太可能是有效URL）
  if (string.length < 10) {
    return false;
  }

  // 尝试使用URL构造函数验证
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// 显示提取的链接
function extractAndDisplayLinks(body) {
  const linksSection = document.getElementById('mail-links-section');
  const linksList = document.getElementById('mail-links-list');
  const linksCount = document.getElementById('links-count');
  const copyAllBtn = document.getElementById('copy-all-links-btn');

  if (!body) {
    linksSection.classList.add('hidden');
    if (copyAllBtn) copyAllBtn.style.display = 'none';
    return;
  }

  const links = extractLinks(body);

  if (links.length === 0) {
    linksSection.classList.add('hidden');
    if (copyAllBtn) copyAllBtn.style.display = 'none';
    return;
  }

  // 显示链接区域
  linksSection.classList.remove('hidden');
  linksCount.textContent = links.length;

  // 显示"全部复制"按钮
  if (copyAllBtn) {
    copyAllBtn.style.display = 'block';
    // 移除旧的事件监听器（如果有）
    const newCopyAllBtn = copyAllBtn.cloneNode(true);
    copyAllBtn.parentNode.replaceChild(newCopyAllBtn, copyAllBtn);
    // 添加新的事件监听器
    newCopyAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      copyAllLinksToClipboard(links, newCopyAllBtn);
    });
  }

  // 清空列表
  linksList.innerHTML = '';

  // 渲染每个链接
  links.forEach((link, index) => {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';

    const linkText = document.createElement('a');
    linkText.className = 'link-url';
    linkText.href = link;
    linkText.target = '_blank';
    linkText.rel = 'noopener noreferrer';
    linkText.textContent = truncateUrl(link, 60);
    linkText.title = link;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-sm copy-link-btn';
    copyBtn.textContent = '📋 复制';
    copyBtn.dataset.url = link;
    copyBtn.onclick = async (e) => {
      e.preventDefault();
      const originalText = copyBtn.textContent;

      // 使用统一的 copyToClipboard 函数，不显示全局反馈，使用按钮反馈
      await copyToClipboard(link, {
        showFeedback: false,  // 不显示全局 Toast
        onSuccess: () => {
          // 成功：更新按钮状态
          copyBtn.textContent = '✅ 已复制';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        },
        onError: () => {
          // 失败：显示错误并显示手动复制弹窗
          alert('复制失败，请手动复制');
        }
      });
    };

    linkItem.appendChild(linkText);
    linkItem.appendChild(copyBtn);
    linksList.appendChild(linkItem);
  });
}

// 截断过长的URL显示
function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

// 复制所有链接到剪贴板
async function copyAllLinksToClipboard(links, button) {
  if (!links || links.length === 0) {
    alert('没有链接可复制');
    return;
  }

  // 将所有链接用换行符连接
  const allLinksText = links.join('\n');
  const originalText = button.textContent;

  // 使用统一的 copyToClipboard 函数，不显示全局反馈，使用按钮反馈
  await copyToClipboard(allLinksText, {
    showFeedback: false,  // 不显示全局 Toast
    onSuccess: () => {
      // 成功：更新按钮状态
      button.textContent = `✅ 已复制 ${links.length} 个链接`;
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    },
    onError: () => {
      // 失败：显示错误信息
      alert('复制失败，请手动复制');
    }
  });
}

// 删除邮件
deleteBtn.addEventListener('click', async () => {
  if (!currentMessageId) return;

  if (confirm('确定要删除这封邮件吗？')) {
    const result = await window.gmailAPI.deleteMessage(currentMessageId);
    if (result.success) {
      mailDetailEmpty.classList.remove('hidden');
      mailDetailContainer.classList.add('hidden');
      currentMessageId = null;
      await loadMessages();
    } else {
      alert('删除失败: ' + result.error);
    }
  }
});

// 回复邮件
replyBtn.addEventListener('click', () => {
  if (!currentMessageId) return;

  const message = currentMessages.find(m => (m.message_id || m.id) === currentMessageId);
  if (message) {
    const replyTo = extractEmail(message.from || message.from_email || '');
    const subject = message.subject || '';
    const replySubject = subject.startsWith('Re:') ? subject : 'Re: ' + subject;

    composeTo.value = replyTo;
    composeSubject.value = replySubject;
    composeMessage.value = '';

    showModal('compose-modal');
  }
});

// 同步按钮
syncBtn.addEventListener('click', syncMessages);

// 同步所有邮箱按钮
syncAllBtn.addEventListener('click', syncAllAccounts);

// 写邮件按钮
composeBtn.addEventListener('click', () => {
  composeTo.value = '';
  composeSubject.value = '';
  composeMessage.value = '';
  showModal('compose-modal');
});

// 发送邮件
sendBtn.addEventListener('click', async () => {
  const to = composeTo.value.trim();
  const subject = composeSubject.value.trim();
  const message = composeMessage.value.trim();

  if (!to || !subject || !message) {
    showError(composeError, '请填写所有字段');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    showError(composeError, '请输入有效的邮箱地址');
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = '发送中...';

  const result = await window.gmailAPI.sendMessage({ to, subject, message });

  sendBtn.disabled = false;
  sendBtn.textContent = '发送';

  if (result.success) {
    showSuccess(composeSuccess, '邮件发送成功！');
    setTimeout(() => {
      closeModal('compose-modal');
    }, 1500);
  } else {
    showError(composeError, result.error);
  }
});

// ==================== 账号管理 ====================

// 打开账号管理
accountsBtn.addEventListener('click', async () => {
  showModal('accounts-modal');
  await loadAccounts();
});

// 加载账号列表
async function loadAccounts() {
  const result = await window.gmailAPI.account.getAll();
  if (result.success) {
    currentAccounts = result.accounts;
    renderAccounts(result.accounts);
  } else {
    showError(accountsError, result.error);
  }
}

// 渲染账号列表
function renderAccounts(accounts) {
  accountsList.innerHTML = '';

  if (accounts.length === 0) {
    accountsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #80868b;">暂无账号</div>';
    return;
  }

  accounts.forEach(account => {
    const accountItem = document.createElement('div');
    accountItem.className = 'account-item';

    if (account.is_active) {
      accountItem.classList.add('active');
    }

    const statusClass = account.has_token ? 'authorized' : 'not-authorized';
    const statusText = account.has_token ? '已授权' : '未授权';
    const activeBadge = account.is_active ? '<span class="account-badge">当前</span>' : '';

    accountItem.innerHTML = `
      <div class="account-info-group">
        <div class="account-email">${escapeHtml(account.email)}${activeBadge}</div>
        <div class="account-status ${statusClass}">${statusText}</div>
      </div>
      <div class="account-actions">
        <button class="btn btn-sm btn-copy" data-email="${escapeHtml(account.email)}" title="复制邮箱地址">📋 复制</button>
        ${!account.is_active && account.has_token ? `<button class="btn btn-sm" onclick="switchAccount(${account.id})">切换</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="deleteAccount(${account.id})">删除</button>
      </div>
    `;

    // 绑定复制按钮事件
    const copyBtn = accountItem.querySelector('.btn-copy');
    if (copyBtn) {
      copyBtn.onclick = () => {
        copyToClipboard(account.email);
      };
    }

    accountsList.appendChild(accountItem);
  });
}

// 切换账号（从账号管理模态框）
window.switchAccount = async function(accountId) {
  const result = await window.gmailAPI.account.switch(accountId);
  if (result.success) {
    showSuccess(accountsSuccess, '切换成功！');
    await loadAccounts();
    await loadSidebarAccounts();
    await loadActiveAccount();
    await loadMessages();

    setTimeout(() => {
      closeModal('accounts-modal');
    }, 1000);

    // 同步新账号的邮件（静默失败）
    setTimeout(async () => {
      try {
        await syncMessages(false);
        console.log('✅ 账号邮件同步成功');
      } catch (error) {
        console.error('⚠️ 账号邮件同步失败:', error);
      }
    }, 1000);
  } else {
    showError(accountsError, result.error);
  }
};

// 删除账号
window.deleteAccount = async function(accountId) {
  if (!confirm('确定要删除此账号吗？')) return;

  const result = await window.gmailAPI.account.delete(accountId);
  if (result.success) {
    showSuccess(accountsSuccess, '删除成功！');
    await loadAccounts();
    await loadSidebarAccounts();
  } else {
    showError(accountsError, result.error);
  }
};

// 添加授权账号
addAccountBtn.addEventListener('click', async () => {
  const result = await window.gmailAPI.authorize();
  if (result.success) {
    window.gmailAPI.openExternal(result.authUrl);

    const code = prompt('请在浏览器完成授权后，输入授权码：');
    if (code) {
      const authResult = await window.gmailAPI.setAuthCode(code);
      if (authResult.success) {
        showSuccess(accountsSuccess, `账号 ${authResult.email} 添加成功！`);

        // 刷新账号列表、侧边栏和活动账号信息
        await loadAccounts();
        await loadSidebarAccounts();
        await loadActiveAccount();

        // 加载新账号的邮件列表
        await loadMessages();

        // 关闭账号管理模态框
        setTimeout(() => {
          closeModal('accounts-modal');
        }, 1500);

        // 延迟后同步新账号的邮件（静默失败）
        console.log('新账号添加成功，准备同步邮件...');
        setTimeout(async () => {
          try {
            await syncMessages(false); // 静默失败
            console.log('✅ 新账号邮件同步成功');
          } catch (error) {
            console.error('⚠️ 新账号邮件同步失败:', error);
            console.log('💡 提示：可以点击"同步"按钮手动同步邮件');
          }
        }, 1500);
      } else {
        showError(accountsError, authResult.error);
      }
    }
  } else {
    showError(accountsError, result.error);
  }
});

// 导入账号
importAccountsBtn.addEventListener('click', async () => {
  // Web模式需要先选择文件
  const result = isWebMode()
    ? await importAccountsInWebMode()
    : await window.gmailAPI.account.import();

  if (result.success) {
    const summary = result.results.map(r => {
      if (r.status === 'added') return `✓ ${r.email} - 已添加`;
      if (r.status === 'updated') return `✓ ${r.email} - 已更新`;
      return `✗ ${r.email} - ${r.error}`;
    }).join('\n');

    showSuccess(accountsSuccess, `导入完成！\n${summary}`);
    await loadAccounts();
    await loadSidebarAccounts();
    await loadActiveAccount();
    await loadMessages();
  } else if (result.error !== 'User cancelled') {
    showError(accountsError, result.error);
  }
});

// 导出账号
exportAccountsBtn.addEventListener('click', async () => {
  const result = await window.gmailAPI.account.export();

  if (result.success) {
    // Web模式：直接下载JSON文件
    if (result.accounts) {
      const jsonData = JSON.stringify(result.accounts, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gmail_accounts.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess(accountsSuccess, `成功导出 ${result.count} 个账号`);
    }
    // Electron模式：显示文件路径
    else if (result.filePath) {
      showSuccess(accountsSuccess, `成功导出 ${result.count} 个账号到 ${result.filePath}`);
    }
  } else if (result.error !== 'User cancelled') {
    showError(accountsError, result.error);
  }
});

// 删除所有账号
deleteAllAccountsBtn.addEventListener('click', async () => {
  const accountsCount = currentAccounts.length;

  if (accountsCount === 0) {
    alert('当前没有账号');
    return;
  }

  const confirmMessage = `⚠️ 警告：此操作将删除所有 ${accountsCount} 个账号及其关联的邮件数据！\n\n此操作不可撤销，确定要继续吗？`;

  if (!confirm(confirmMessage)) {
    return;
  }

  // 二次确认
  const doubleConfirm = confirm('请再次确认：真的要删除所有账号吗？');
  if (!doubleConfirm) {
    return;
  }

  try {
    const result = await window.gmailAPI.account.deleteAll();

    if (result.success) {
      showSuccess(accountsSuccess, `成功删除所有 ${accountsCount} 个账号！`);

      // 刷新所有相关界面
      await loadAccounts();
      await loadSidebarAccounts();

      // 切换回授权界面
      setTimeout(() => {
        closeModal('accounts-modal');
        showAuthScreen();
      }, 2000);
    } else {
      showError(accountsError, '删除失败: ' + result.error);
    }
  } catch (error) {
    showError(accountsError, '删除失败: ' + error.message);
    console.error('删除所有账号时出错:', error);
  }
});

// ==================== 批量授权 ====================

// 批量授权状态
let batchAuthAccounts = [];
let batchAuthCurrentIndex = 0;

// 打开批量授权模态框
batchAuthBtn.addEventListener('click', () => {
  showModal('batch-auth-modal');
  resetBatchAuthModal();
});

// 重置批量授权模态框
function resetBatchAuthModal() {
  batchAuthAccounts = [];
  batchAuthCurrentIndex = 0;
  batchAuthFile.value = '';
  batchAuthTextarea.value = '';
  batchAuthError.classList.add('hidden');

  // 显示步骤1，隐藏其他步骤
  batchAuthStep1.classList.remove('hidden');
  batchAuthStep2.classList.add('hidden');
  batchAuthStep3.classList.add('hidden');
}

// 解析账号列表
batchAuthParseBtn.addEventListener('click', async () => {
  let accountsText = '';

  // 优先使用文件
  if (batchAuthFile.files.length > 0) {
    const file = batchAuthFile.files[0];
    accountsText = await file.text();
  }
  // 否则使用文本框
  else if (batchAuthTextarea.value.trim()) {
    accountsText = batchAuthTextarea.value;
  }
  else {
    showError(batchAuthError, '请选择文件或输入账号列表');
    return;
  }

  // 解析账号列表（支持两种格式：1. 每行一个邮箱  2. email|password 格式）
  const lines = accountsText.split('\n');
  const accounts = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue; // 跳过空行和注释

    // 支持 email|password 格式
    const parts = trimmed.split('|');
    const email = parts[0].trim();
    const password = parts.length > 1 ? parts[1].trim() : null;

    // 简单的邮箱验证
    if (email && email.includes('@')) {
      accounts.push({ email, password });
    }
  }

  if (accounts.length === 0) {
    showError(batchAuthError, '未找到有效的邮箱地址');
    return;
  }

  // 检测授权模式
  const hasPasswords = accounts.some(acc => acc.password);
  const allHavePasswords = accounts.every(acc => acc.password);

  // 提示用户使用哪种模式
  if (hasPasswords && !allHavePasswords) {
    const message = '检测到部分账号有密码，部分没有。\n建议：\n1. 有密码的账号将使用自动登录\n2. 没有密码的账号将使用手动授权';
    console.log(message);
  }

  // 保存账号列表
  batchAuthAccounts = accounts.map((account, index) => ({
    index: index + 1,
    email: account.email,
    password: account.password,
    hasPassword: !!account.password,
    status: 'pending',
    message: ''
  }));

  // 显示步骤2
  batchAuthStep1.classList.add('hidden');
  batchAuthStep2.classList.remove('hidden');
  batchAuthError.classList.add('hidden');

  // 渲染账号列表
  renderBatchAuthList();
});

// 渲染批量授权账号列表
function renderBatchAuthList() {
  batchAuthCount.textContent = batchAuthAccounts.length;
  batchAuthList.innerHTML = '';

  batchAuthAccounts.forEach(account => {
    const item = document.createElement('div');
    item.className = 'batch-auth-list-item';
    item.innerHTML = `
      <span class="email">${escapeHtml(account.email)}</span>
      <span class="status ${account.status}">${getStatusText(account.status)}</span>
    `;
    batchAuthList.appendChild(item);
  });
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待授权',
    'authorizing': '授权中...',
    'success': '✓ 成功',
    'error': '✗ 失败',
    'skipped': '跳过'
  };
  return statusMap[status] || status;
}

// 返回步骤1
batchAuthBackBtn.addEventListener('click', () => {
  batchAuthStep2.classList.add('hidden');
  batchAuthStep1.classList.remove('hidden');
});

// 开始批量授权
batchAuthStartBtn.addEventListener('click', async () => {
  batchAuthStep2.classList.add('hidden');
  batchAuthStep3.classList.remove('hidden');
  batchAuthCloseBtn.disabled = true;

  batchAuthCurrentIndex = 0;
  batchAuthLog.innerHTML = '';

  // 检查是否有账号包含密码（自动登录模式）
  const accountsWithPassword = batchAuthAccounts.filter(acc => acc.hasPassword);
  const accountsWithoutPassword = batchAuthAccounts.filter(acc => !acc.hasPassword);

  // 如果所有账号都有密码，使用批量自动登录API（更高效）
  if (accountsWithPassword.length === batchAuthAccounts.length) {
    addBatchAuthLog('info', `检测到所有账号都有密码，使用自动登录模式...`);

    try {
      // 准备账号数据
      const accounts = batchAuthAccounts.map(acc => ({
        email: acc.email,
        password: acc.password
      }));

      // 监听自动登录进度
      window.gmailAPI.onAutoLoginProgress((progress) => {
        const account = batchAuthAccounts.find(a => a.email === progress.email);
        if (account) {
          batchAuthCurrentIndex = account.index - 1;
          updateBatchAuthProgress();

          // 根据消息判断状态
          if (progress.message.includes('授权成功') || progress.message.includes('成功')) {
            account.status = 'success';
            addBatchAuthLog('success', `[${progress.current}/${progress.total}] ${progress.email}: ${progress.message} ✓`);
          } else if (progress.message.includes('失败') || progress.message.includes('错误')) {
            account.status = 'error';
            addBatchAuthLog('error', `[${progress.current}/${progress.total}] ${progress.email}: ${progress.message}`);
          } else {
            addBatchAuthLog('info', `[${progress.current}/${progress.total}] ${progress.email}: ${progress.message}`);
          }
        }
      });

      // 调用批量自动登录API
      const result = await window.gmailAPI.account.batchAutoLogin(accounts);

      if (result.success) {
        addBatchAuthLog('info', '');
        addBatchAuthLog('success', '批量自动登录完成！');
      } else {
        addBatchAuthLog('error', `批量自动登录失败: ${result.error}`);
      }

    } catch (error) {
      addBatchAuthLog('error', `批量自动登录异常: ${error.message}`);
    }

  } else {
    // 混合模式：逐个处理
    addBatchAuthLog('info', `检测到混合模式：${accountsWithPassword.length} 个账号有密码（自动登录），${accountsWithoutPassword.length} 个账号无密码（手动授权）`);

    for (let i = 0; i < batchAuthAccounts.length; i++) {
      const account = batchAuthAccounts[i];
      batchAuthCurrentIndex = i;

      // 更新进度
      updateBatchAuthProgress();

      // 检查账号是否已存在
      const existingResult = await window.gmailAPI.account.getAll();
      if (existingResult.success) {
        const exists = existingResult.accounts.some(a => a.email === account.email);
        if (exists) {
          account.status = 'skipped';
          account.message = '账号已存在';
          addBatchAuthLog('info', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 账号已存在，跳过`);
          continue;
        }
      }

      // 开始授权
      account.status = 'authorizing';

      try {
        // 如果有密码，使用自动登录
        if (account.hasPassword) {
          addBatchAuthLog('info', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 使用自动登录模式...`);

          const result = await window.gmailAPI.account.autoLogin({
            email: account.email,
            password: account.password
          });

          if (result.success) {
            account.status = 'success';
            account.message = '授权成功';
            addBatchAuthLog('success', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 授权成功 ✓`);
          } else {
            throw new Error(result.error || '自动登录失败');
          }

        } else {
          // 使用手动授权
          addBatchAuthLog('info', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 使用手动授权模式...`);

          // 获取授权URL
          const authResult = await window.gmailAPI.authorize();
          if (!authResult.success) {
            throw new Error(authResult.error);
          }

          // 打开授权页面
          window.gmailAPI.openExternal(authResult.authUrl);
          addBatchAuthLog('info', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 已打开授权页面，请在浏览器中完成授权...`);

          // 等待用户输入授权码
          const code = prompt(`请在浏览器完成授权后，输入 ${account.email} 的授权码：`);

          if (!code) {
            account.status = 'error';
            account.message = '用户取消';
            addBatchAuthLog('error', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 用户取消授权`);
            continue;
          }

          // 提交授权码
          const setAuthResult = await window.gmailAPI.setAuthCode(code);

          if (setAuthResult.success) {
            account.status = 'success';
            account.message = '授权成功';
            addBatchAuthLog('success', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 授权成功 ✓`);
          } else {
            throw new Error(setAuthResult.error);
          }
        }

      } catch (error) {
        account.status = 'error';
        account.message = error.message;
        addBatchAuthLog('error', `[${account.index}/${batchAuthAccounts.length}] ${account.email}: 授权失败 - ${error.message}`);
      }

      // 更新进度
      updateBatchAuthProgress();

      // 短暂延迟，避免请求过快
      if (i < batchAuthAccounts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // 完成
  const successCount = batchAuthAccounts.filter(a => a.status === 'success').length;
  const errorCount = batchAuthAccounts.filter(a => a.status === 'error').length;
  const skippedCount = batchAuthAccounts.filter(a => a.status === 'skipped').length;

  addBatchAuthLog('info', '');
  addBatchAuthLog('info', `========== 批量授权完成 ==========`);
  addBatchAuthLog('success', `成功: ${successCount} 个`);
  if (skippedCount > 0) {
    addBatchAuthLog('info', `跳过: ${skippedCount} 个`);
  }
  if (errorCount > 0) {
    addBatchAuthLog('error', `失败: ${errorCount} 个`);
  }

  batchAuthCloseBtn.disabled = false;

  // 刷新账号列表
  await loadAccounts();
  await loadSidebarAccounts();
  await loadActiveAccount();
});

// 更新批量授权进度
function updateBatchAuthProgress() {
  const total = batchAuthAccounts.length;
  const completed = batchAuthCurrentIndex + 1;
  const percentage = Math.round((completed / total) * 100);

  batchAuthProgressBar.style.width = `${percentage}%`;
  batchAuthProgressText.textContent = `${completed} / ${total}`;
}

// 添加批量授权日志
function addBatchAuthLog(type, message) {
  const logItem = document.createElement('div');
  logItem.className = `batch-auth-log-item ${type}`;

  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  logItem.innerHTML = `
    <span class="time">${time}</span>
    <span class="message">${escapeHtml(message)}</span>
  `;

  batchAuthLog.appendChild(logItem);

  // 自动滚动到底部
  batchAuthLog.scrollTop = batchAuthLog.scrollHeight;
}

// 关闭批量授权模态框
batchAuthCloseBtn.addEventListener('click', () => {
  closeModal('batch-auth-modal');
});

// ==================== 模态框管理 ====================

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');

    // 清空错误/成功消息
    const errorEl = modal.querySelector('.error');
    const successEl = modal.querySelector('.success');
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 关闭按钮事件委托
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn') || e.target.hasAttribute('data-close')) {
    const modalId = e.target.getAttribute('data-close');
    if (modalId) {
      closeModal(modalId);
    } else {
      // 查找最近的模态框
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }
  }

  // 点击模态框背景关闭
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

// ==================== 工具函数 ====================

function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

function extractEmail(emailString) {
  const match = emailString.match(/<(.+)>/);
  return match ? match[1] : emailString;
}

// 格式化日期为本地时间（邮件列表简短格式）
function formatDate(dateString) {
  try {
    if (!dateString) return '';

    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // 今天：显示时间
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // 昨天
    else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // 一周内
    else if (days < 7) {
      return days + ' 天前';
    }
    // 今年内：显示月日
    else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric'
      });
    }
    // 更早：显示年月日
    else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('日期格式化失败:', error, dateString);
    return dateString;
  }
}

// 格式化日期为完整本地时间（邮件详情完整格式）
function formatDateDetailed(dateString) {
  try {
    if (!dateString) return '';

    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString;
    }

    // 手动格式化，确保格式统一：YYYY/MM/DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 获取时区偏移（分钟）
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const timezone = `GMT${offsetSign}${offsetHours}${offsetMinutes > 0 ? ':' + String(offsetMinutes).padStart(2, '0') : ''}`;

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds} (${timezone})`;
  } catch (error) {
    console.error('详细日期格式化失败:', error, dateString);
    return dateString;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 启动应用
initialize();
