/**
 * Luna TV 配置编辑器 - 工具函数库
 * @author hafrey1
 * @version 1.0.0
 */

const Utils = {
    
    /**
     * 日志记录器
     */
    Logger: {
        debug: (message, ...args) => {
            if (CONFIG.DEV.DEBUG && CONFIG.DEV.LOG_LEVEL === 'debug') {
                console.debug(`[Luna TV Editor] ${message}`, ...args);
            }
        },
        
        info: (message, ...args) => {
            if (['debug', 'info'].includes(CONFIG.DEV.LOG_LEVEL)) {
                console.info(`[Luna TV Editor] ${message}`, ...args);
            }
        },
        
        warn: (message, ...args) => {
            if (['debug', 'info', 'warn'].includes(CONFIG.DEV.LOG_LEVEL)) {
                console.warn(`[Luna TV Editor] ${message}`, ...args);
            }
        },
        
        error: (message, ...args) => {
            console.error(`[Luna TV Editor] ${message}`, ...args);
        }
    },
    
    /**
     * 本地存储工具
     */
    Storage: {
        // 设置存储项
        set: (key, value) => {
            try {
                const data = {
                    value,
                    timestamp: Date.now(),
                    expires: null
                };
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                Utils.Logger.error('存储设置失败:', error);
                return false;
            }
        },
        
        // 获取存储项
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return defaultValue;
                
                const data = JSON.parse(item);
                
                // 检查过期时间
                if (data.expires && Date.now() > data.expires) {
                    localStorage.removeItem(key);
                    return defaultValue;
                }
                
                return data.value;
            } catch (error) {
                Utils.Logger.error('存储读取失败:', error);
                return defaultValue;
            }
        },
        
        // 设置带过期时间的存储项
        setWithExpiry: (key, value, expiryDays = 7) => {
            try {
                const data = {
                    value,
                    timestamp: Date.now(),
                    expires: Date.now() + (expiryDays * 24 * 60 * 60 * 1000)
                };
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                Utils.Logger.error('存储设置失败:', error);
                return false;
            }
        },
        
        // 删除存储项
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                Utils.Logger.error('存储删除失败:', error);
                return false;
            }
        },
        
        // 清除所有相关存储
        clear: () => {
            try {
                Object.values(CONFIG.STORAGE).forEach(key => {
                    localStorage.removeItem(key);
                });
                return true;
            } catch (error) {
                Utils.Logger.error('存储清除失败:', error);
                return false;
            }
        }
    },
    
    /**
     * 加密工具（简单加密，仅用于本地存储）
     */
    Crypto: {
        // 简单加密
        encrypt: (text, key = CONFIG.SETTINGS.TOKEN.ENCRYPT_KEY) => {
            try {
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                    result += String.fromCharCode(charCode);
                }
                return btoa(result);
            } catch (error) {
                Utils.Logger.error('加密失败:', error);
                return text;
            }
        },
        
        // 简单解密
        decrypt: (encryptedText, key = CONFIG.SETTINGS.TOKEN.ENCRYPT_KEY) => {
            try {
                const text = atob(encryptedText);
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                    result += String.fromCharCode(charCode);
                }
                return result;
            } catch (error) {
                Utils.Logger.error('解密失败:', error);
                return encryptedText;
            }
        }
    },
    
    /**
     * JSON工具
     */
    JSON: {
        // 验证JSON格式
        isValid: (jsonString) => {
            try {
                JSON.parse(jsonString);
                return true;
            } catch (error) {
                return false;
            }
        },
        
        // 格式化JSON
        format: (jsonString, indent = 2) => {
            try {
                const parsed = JSON.parse(jsonString);
                return JSON.stringify(parsed, null, indent);
            } catch (error) {
                throw new Error(`JSON格式化失败: ${error.message}`);
            }
        },
        
        // 压缩JSON
        compress: (jsonString) => {
            try {
                const parsed = JSON.parse(jsonString);
                return JSON.stringify(parsed);
            } catch (error) {
                throw new Error(`JSON压缩失败: ${error.message}`);
            }
        },
        
        // 验证配置JSON结构
        validateConfig: (jsonString) => {
            try {
                const config = JSON.parse(jsonString);
                
                // 基本结构检查
                if (!config || typeof config !== 'object') {
                    return { valid: false, error: '配置必须是一个有效的JSON对象' };
                }
                
                if (!Array.isArray(config.sites)) {
                    return { valid: false, error: '配置中缺少sites数组' };
                }
                
                // 检查每个源的必需字段
                for (let i = 0; i < config.sites.length; i++) {
                    const site = config.sites[i];
                    if (!site.key) {
                        return { valid: false, error: `第${i + 1}个源缺少key字段` };
                    }
                    if (!site.name) {
                        return { valid: false, error: `第${i + 1}个源缺少name字段` };
                    }
                    if (!site.api) {
                        return { valid: false, error: `第${i + 1}个源缺少api字段` };
                    }
                    if (!CONFIG.REGEX.URL.test(site.api)) {
                        return { valid: false, error: `第${i + 1}个源的api不是有效的URL` };
                    }
                }
                
                return { valid: true, config };
            } catch (error) {
                return { valid: false, error: `JSON解析失败: ${error.message}` };
            }
        }
    },
    
    /**
     * 文件工具
     */
    File: {
        // 读取文件内容
        read: (file) => {
            return new Promise((resolve, reject) => {
                if (file.size > CONFIG.VALIDATION.MAX_FILE_SIZE) {
                    reject(new Error(CONFIG.MESSAGES.ERRORS.FILE_TOO_LARGE));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            });
        },
        
        // 下载文件
        download: (content, filename, contentType = 'application/json') => {
            try {
                const blob = new Blob([content], { type: contentType });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                Utils.Logger.error('文件下载失败:', error);
                return false;
            }
        },
        
        // 获取文件扩展名
        getExtension: (filename) => {
            return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
        },
        
        // 格式化文件大小
        formatSize: (bytes) => {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    },
    
    /**
     * DOM工具
     */
    DOM: {
        // 查询元素
        $: (selector, parent = document) => {
            return parent.querySelector(selector);
        },
        
        // 查询所有元素
        $$: (selector, parent = document) => {
            return Array.from(parent.querySelectorAll(selector));
        },
        
        // 创建元素
        create: (tag, attributes = {}, parent = null) => {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'textContent' || key === 'innerHTML') {
                    element[key] = value;
                } else if (key === 'className') {
                    element.className = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (parent) {
                parent.appendChild(element);
            }
            
            return element;
        },
        
        // 移除元素
        remove: (element) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        },
        
        // 切换类名
        toggleClass: (element, className, force = null) => {
            if (force !== null) {
                element.classList.toggle(className, force);
            } else {
                element.classList.toggle(className);
            }
        },
        
        // 检查元素是否可见
        isVisible: (element) => {
            return element.offsetParent !== null;
        }
    },
    
    /**
     * 时间工具
     */
    Time: {
        // 格式化时间
        format: (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
            const date = new Date(timestamp);
            
            const formatMap = {
                YYYY: date.getFullYear(),
                MM: String(date.getMonth() + 1).padStart(2, '0'),
                DD: String(date.getDate()).padStart(2, '0'),
                HH: String(date.getHours()).padStart(2, '0'),
                mm: String(date.getMinutes()).padStart(2, '0'),
                ss: String(date.getSeconds()).padStart(2, '0')
            };
            
            return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
        },
        
        // 相对时间
        relative: (timestamp) => {
            const now = Date.now();
            const diff = now - timestamp;
            
            const minute = 60 * 1000;
            const hour = 60 * minute;
            const day = 24 * hour;
            const month = 30 * day;
            const year = 365 * day;
            
            if (diff < minute) return '刚刚';
            if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
            if (diff < day) return `${Math.floor(diff / hour)}小时前`;
            if (diff < month) return `${Math.floor(diff / day)}天前`;
            if (diff < year) return `${Math.floor(diff / month)}个月前`;
            return `${Math.floor(diff / year)}年前`;
        }
    },
    
    /**
     * URL工具
     */
    URL: {
        // 构建GitHub API URL
        buildGitHubAPI: (endpoint, params = {}) => {
            let url = CONFIG.GITHUB.API_BASE + endpoint;
            
            // 替换路径参数
            Object.entries(params).forEach(([key, value]) => {
                url = url.replace(`{${key}}`, encodeURIComponent(value));
            });
            
            return url;
        },
        
        // 构建GitHub Raw URL
        buildGitHubRaw: (owner, repo, path, branch = 'main') => {
            return `${CONFIG.GITHUB.RAW_BASE}/${owner}/${repo}/${branch}/${path}`;
        }
    },
    
    /**
     * 防抖函数
     */
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    /**
     * 节流函数
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * 深度克隆对象
     */
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    },
    
    /**
     * 生成UUID
     */
    generateUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * 检查是否为移动设备
     */
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * 检查是否支持触摸
     */
    isTouchDevice: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else if (typeof define === 'function' && define.amd) {
    define([], () => Utils);
} else {
    window.Utils = Utils;
}
