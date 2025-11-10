const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * 路径帮助工具
 * 统一处理web模式和electron模式的路径差异
 */
class PathHelper {
  constructor(mode = 'electron') {
    this.mode = mode; // 'electron' or 'web'
    this.dataDir = this.getDataDirectory();

    // 确保数据目录存在
    this.ensureDirectoryExists(this.dataDir);
  }

  /**
   * 获取数据存储目录
   */
  getDataDirectory() {
    if (this.mode === 'electron') {
      // Electron模式：使用electron的app.getPath('userData')
      // 但这个类在非electron环境下也要工作，所以使用环境变量或默认路径
      const electronUserData = process.env.ELECTRON_USER_DATA;
      if (electronUserData) {
        return electronUserData;
      }
      // 回退到默认位置
      return this.getDefaultUserDataPath('gmail_client_electron');
    } else {
      // Web模式：使用项目根目录下的data文件夹
      return path.join(process.cwd(), 'data');
    }
  }

  /**
   * 获取默认用户数据路径
   */
  getDefaultUserDataPath(appName) {
    const platform = process.platform;
    const home = os.homedir();

    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), appName);
      case 'darwin':
        return path.join(home, 'Library', 'Application Support', appName);
      case 'linux':
        return path.join(home, '.config', appName);
      default:
        return path.join(home, '.config', appName);
    }
  }

  /**
   * 获取数据库文件路径
   */
  getDatabasePath() {
    return path.join(this.dataDir, 'gmail_client.db');
  }

  /**
   * 获取credentials文件路径
   */
  getCredentialsPath() {
    return path.join(__dirname, '../../config/credentials.json');
  }

  /**
   * 确保目录存在
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 获取静态文件路径（renderer目录）
   */
  getRendererPath() {
    return path.join(__dirname, '../renderer');
  }

  /**
   * 检查是否为web模式
   */
  isWebMode() {
    return this.mode === 'web';
  }

  /**
   * 检查是否为electron模式
   */
  isElectronMode() {
    return this.mode === 'electron';
  }
}

module.exports = PathHelper;
