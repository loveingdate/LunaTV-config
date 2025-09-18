/**
 * Luna TV 配置编辑器 - 工具函数
 * 提供常用的工具函数和辅助方法
 */

class Utils {
    /**
     * 简单的加密/解密工具 (仅用于本地存储)
     */
    static encrypt(text) {
        // 简单的 Base64 编码 + 简单混淆
        const encoded = btoa(unescape(encodeURIComponent(text)));
        return encoded.split('').reverse().join('');
    }

    static decrypt(encrypted) {
        try {
            const reversed = encrypted.split('').reverse().join('');
            return decodeURIComponent(escape(atob(reversed)));
        } catch (e) {
            return null;
        }
    }

    /**
     * 本地存储管理
     */
    static setStorage(key, value, encrypt = false) {
        try {
            const data = encrypt ? this.encrypt(JSON.stringify(value)) : JSON.stringify(value);
            localStorage.setItem(`lunatv_${key}`, data);
            return true;
        } catch (e) {
            console.error('存储失败:', e);
            return false;
        }
    }

    static getStorage(key, decrypt = false) {
        try {
            const data = localStorage.getItem(`lunatv_${key}`);
            if (!data) return null;
            
            const parsed = decrypt ? this.decrypt(data) : data;
            return JSON.parse(parsed);
        } catch (e) {
            console.error('读取存储失败:', e);
            return null;
        }
    }

    static removeStorage(key) {
        localStorage.removeItem(`lunatv_${key}`);
    }

    static clearStorage() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('lunatv_')) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * 会话存储管理
     */
    static setSessionStorage(key, value) {
        try {
            sessionStorage.setItem(`lunatv_${key}`, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('会话存储失败:', e);
            return false;
        }
    }

    static getSessionStorage(key) {
        try {
            const data = sessionStorage.getItem(`lunatv_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('读取会话存储失败:', e);
            return null;
        }
    }

    /**
     * JSON 处理工具
     */
    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    static formatJSON(str, indent = 2) {
        try {
            const obj = JSON.parse(str);
            return JSON.stringify(obj, null, indent);
        } catch (e) {
            throw new Error('无法格式化 JSON: ' + e.message);
        }
    }

    static compressJSON(str) {
        try {
            const obj = JSON.parse(str);
            return JSON.stringify(obj);
        } catch (e) {
            throw new Error('无法压缩 JSON: ' + e.message);
        }
    }

    static validateJSON(str) {
        try {
            JSON.parse(str);
            return { valid: true, error: null };
        } catch (e) {
            return { 
                valid: false, 
                error: e.message,
                line: this.getJSONErrorLine(str, e.message)
            };
        }
    }

    static getJSONErrorLine(str, errorMessage) {
        // 尝试从错误消息中提取行号
        const match = errorMessage.match(/line (\d+)/i) || errorMessage.match(/position (\d+)/i);
        if (match) {
            return parseInt(match[1]);
        }
        return null;
    }

    /**
     * 文件处理工具
     */
    static downloadFile(content, filename, mimeType = 'application/json') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * DOM 工具
     */
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    static $$(selector, context = document) {
        return context.querySelectorAll(selector);
    }

    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        if (content) {
            element.textContent = content;
        }
        return element;
    }

    /**
     * 事件处理工具
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 日期时间工具
     */
    static formatDate(date = new Date()) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return '刚刚';
        if (minutes < 60) return `${minutes} 分钟前`;
        if (hours < 24) return `${hours} 小时前`;
        if (days < 7) return `${days} 天前`;
        return this.formatDate(date);
    }

    /**
     * 通知工具
     */
    static showToast(message, type = 'info', duration = 3000) {
        const container = this.$('#toast-container');
        if (!container) return;

        const toast = this.createElement('div', {
            className: `toast ${type}`
        }, message);

        container.appendChild(toast);

        // 点击关闭
        toast.addEventListener('click', () => {
            toast.remove();
        });

        // 自动关闭
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    /**
     * 模态对话框工具
     */
    static showModal(title, content, options = {}) {
        return new Promise((resolve) => {
            const overlay = this.$('#modal-overlay');
            const modal = this.$('#modal-title');
            const body = this.$('#modal-body');
            const confirmBtn = this.$('#modal-confirm');
            const cancelBtn = this.$('#modal-cancel');
            const closeBtn = this.$('#modal-close');

            modal.textContent = title;
            body.innerHTML = content;
            
            if (options.confirmText) {
                confirmBtn.textContent = options.confirmText;
            }
            if (options.cancelText) {
                cancelBtn.textContent = options.cancelText;
            }

            overlay.style.display = 'flex';

            const close = (result) => {
                overlay.style.display = 'none';
                resolve(result);
            };

            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
            closeBtn.onclick = () => close(false);
            
            overlay.onclick = (e) => {
                if (e.target === overlay) close(false);
            };
        });
    }

    /**
     * 键盘快捷键处理
     */
    static isShortcut(event, shortcut) {
        const keys = shortcut.toLowerCase().split('+');
        const modifiers = {
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey
        };

        return keys.every(key => {
            if (key === 'ctrl') return modifiers.ctrl;
            if (key === 'shift') return modifiers.shift;
            if (key === 'alt') return modifiers.alt;
            return event.key.toLowerCase() === key;
        });
    }

    /**
     * 浏览器检测
     */
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Safari')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
        }

        return { browser, version };
    }

    /**
     * 性能监控
     */
    static measureTime(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * 深度克隆对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * 字符串工具
     */
    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 数字格式化
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatNumber(num) {
        return new Intl.NumberFormat('zh-CN').format(num);
    }
}

// 导出到全局作用域
window.Utils = Utils;
