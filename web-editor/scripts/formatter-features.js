/**
 * Luna TV 配置编辑器 - 增强功能模块
 * 参考 jsonformatter.org 的功能实现
 */

class JSONFormatterFeatures {
    constructor(editorManager) {
        this.editor = editorManager;
        this.settings = {
            indentSize: 2,
            autoFormat: true,
            showLineNumbers: true,
            enableSyntaxCheck: true,
            enableAutoComplete: true
        };
        this.history = [];
        this.historyIndex = -1;
    }

    /**
     * 初始化增强功能
     */
    init() {
        this.loadSettings();
        this.setupToolbar();
        this.setupContextMenu();
        this.setupKeyboardShortcuts();
        this.initializeFeatures();
        console.log('JSONFormatter增强功能已初始化');
    }

    /**
     * 设置工具栏（类似jsonformatter.org）
     */
    setupToolbar() {
        // 添加设置按钮
        this.addToolbarButton('⚙️', '设置', () => this.showSettings());
        
        // 添加缩进选择器
        this.addIndentSelector();
        
        // 添加自动格式化开关
        this.addAutoFormatToggle();
        
        // 添加更多工具
        this.addToolbarSeparator();
        this.addToolbarButton('📋', '复制', () => this.copyToClipboard());
        this.addToolbarButton('📁', '从URL加载', () => this.loadFromURL());
        this.addToolbarButton('🔗', '生成分享链接', () => this.generateShareLink());
        this.addToolbarButton('🖨️', '打印', () => this.printJSON());
        
        // 添加转换工具
        this.addToolbarSeparator();
        this.addToolbarButton('🔄 XML', '转换为XML', () => this.convertToXML());
        this.addToolbarButton('📊 CSV', '转换为CSV', () => this.convertToCSV());
        this.addToolbarButton('📝 YAML', '转换为YAML', () => this.convertToYAML());
    }

    /**
     * 添加工具栏按钮
     */
    addToolbarButton(icon, title, onclick) {
        const toolbar = Utils.$('.toolbar .toolbar-section:last-child');
        if (toolbar) {
            const button = document.createElement('button');
            button.className = 'btn btn-outline';
            button.innerHTML = icon;
            button.title = title;
            button.setAttribute('data-tooltip', title);
            button.onclick = onclick;
            toolbar.appendChild(button);
        }
    }

    /**
     * 添加工具栏分隔符
     */
    addToolbarSeparator() {
        const toolbar = Utils.$('.toolbar .toolbar-section:last-child');
        if (toolbar) {
            const separator = document.createElement('div');
            separator.style.cssText = 'width: 1px; height: 24px; background: var(--border-color); margin: 0 8px;';
            toolbar.appendChild(separator);
        }
    }

    /**
     * 添加缩进选择器
     */
    addIndentSelector() {
        const toolbar = Utils.$('.toolbar .toolbar-section:last-child');
        if (toolbar) {
            const select = document.createElement('select');
            select.className = 'select';
            select.innerHTML = `
                <option value="2" ${this.settings.indentSize === 2 ? 'selected' : ''}>2 空格</option>
                <option value="3" ${this.settings.indentSize === 3 ? 'selected' : ''}>3 空格</option>
                <option value="4" ${this.settings.indentSize === 4 ? 'selected' : ''}>4 空格</option>
                <option value="\t">Tab</option>
            `;
            select.onchange = (e) => {
                this.settings.indentSize = e.target.value === '\t' ? '\t' : parseInt(e.target.value);
                this.saveSettings();
            };
            toolbar.appendChild(select);
        }
    }

    /**
     * 添加自动格式化开关
     */
    addAutoFormatToggle() {
        const toolbar = Utils.$('.toolbar .toolbar-section:last-child');
        if (toolbar) {
            const toggle = document.createElement('label');
            toggle.className = 'auto-format-toggle';
            toggle.innerHTML = `
                <input type="checkbox" ${this.settings.autoFormat ? 'checked' : ''}>
                <span class="toggle-slider"></span>
                <span class="toggle-label">自动格式化</span>
            `;
            toggle.querySelector('input').onchange = (e) => {
                this.settings.autoFormat = e.target.checked;
                this.saveSettings();
            };
            toolbar.appendChild(toggle);
        }
    }

    /**
     * 设置右键菜单
     */
    setupContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.editor')) {
                e.preventDefault();
                this.showContextMenu(e.pageX, e.pageY);
            }
        });
    }

    /**
     * 显示右键菜单
     */
    showContextMenu(x, y) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            min-width: 200px;
        `;
        
        const menuItems = [
            { label: '🔧 格式化JSON', action: () => this.editor.formatJSON() },
            { label: '📦 压缩JSON', action: () => this.editor.compressJSON() },
            { label: '✅ 验证JSON', action: () => this.editor.validateJSON() },
            { separator: true },
            { label: '↩️ 撤销', action: () => this.undo() },
            { label: '↪️ 重做', action: () => this.redo() },
            { separator: true },
            { label: '📋 复制', action: () => this.copyToClipboard() },
            { label: '📥 粘贴', action: () => this.pasteFromClipboard() },
            { separator: true },
            { label: '🔍 查找', action: () => this.editor.find() },
            { label: '🔄 替换', action: () => this.editor.replace() }
        ];
        
        menuItems.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = 'height: 1px; background: var(--border-color); margin: 4px 0;';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                menuItem.textContent = item.label;
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: var(--transition-fast);
                `;
                menuItem.onmouseover = () => menuItem.style.background = 'var(--bg-tertiary)';
                menuItem.onmouseout = () => menuItem.style.background = 'transparent';
                menuItem.onclick = () => {
                    item.action();
                    menu.remove();
                };
                menu.appendChild(menuItem);
            }
        });
        
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.redo();
                        } else {
                            e.preventDefault();
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'i':
                        e.preventDefault();
                        this.formatJSON();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.editor.compressJSON();
                        break;
                }
            }
        });
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard() {
        try {
            const content = this.editor.getValue();
            await navigator.clipboard.writeText(content);
            Utils.showToast('JSON已复制到剪贴板', 'success');
            
            // 显示复制反馈动画
            this.showCopyFeedback();
        } catch (error) {
            Utils.showToast('复制失败: ' + error.message, 'error');
        }
    }

    /**
     * 从剪贴板粘贴
     */
    async pasteFromClipboard() {
        try {
            const content = await navigator.clipboard.readText();
            this.editor.setValue(content);
            Utils.showToast('已从剪贴板粘贴JSON', 'success');
        } catch (error) {
            Utils.showToast('粘贴失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示复制反馈动画
     */
    showCopyFeedback() {
        const feedback = document.createElement('div');
        feedback.textContent = 'Copied!';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary-green);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 10000;
            animation: copyFeedback 1.5s ease-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes copyFeedback {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
            style.remove();
        }, 1500);
    }

    /**
     * 从URL加载JSON
     */
    async loadFromURL() {
        const url = prompt('请输入JSON URL:');
        if (!url) return;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.text();
            this.editor.setValue(data);
            Utils.showToast('JSON已从URL加载', 'success');
        } catch (error) {
            Utils.showToast('加载失败: ' + error.message, 'error');
        }
    }

    /**
     * 生成分享链接
     */
    generateShareLink() {
        const content = this.editor.getValue();
        const encoded = encodeURIComponent(content);
        const shareUrl = `${window.location.origin}${window.location.pathname}?json=${encoded}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            Utils.showToast('分享链接已复制到剪贴板', 'success');
        }).catch(() => {
            prompt('分享链接:', shareUrl);
        });
    }

    /**
     * 打印JSON
     */
    printJSON() {
        const content = this.editor.getValue();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Luna TV 配置 - 打印</title>
                <style>
                    body { font-family: monospace; line-height: 1.6; margin: 20px; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                    .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌙 Luna TV 配置文件</h1>
                    <p>生成时间: ${new Date().toLocaleString()}</p>
                </div>
                <pre>${Utils.escapeHtml(content)}</pre>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    /**
     * 转换为XML
     */
    convertToXML() {
        try {
            const json = JSON.parse(this.editor.getValue());
            const xml = this.jsonToXML(json);
            this.showConversionResult('XML', xml);
        } catch (error) {
            Utils.showToast('转换失败: ' + error.message, 'error');
        }
    }

    /**
     * 转换为CSV
     */
    convertToCSV() {
        try {
            const json = JSON.parse(this.editor.getValue());
            const csv = this.jsonToCSV(json);
            this.showConversionResult('CSV', csv);
        } catch (error) {
            Utils.showToast('转换失败: ' + error.message, 'error');
        }
    }

    /**
     * 转换为YAML
     */
    convertToYAML() {
        try {
            const json = JSON.parse(this.editor.getValue());
            const yaml = this.jsonToYAML(json);
            this.showConversionResult('YAML', yaml);
        } catch (error) {
            Utils.showToast('转换失败: ' + error.message, 'error');
        }
    }

    /**
     * JSON转XML
     */
    jsonToXML(obj, rootName = 'root') {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
        
        function convertToXML(obj, name) {
            if (Array.isArray(obj)) {
                return obj.map((item, index) => convertToXML(item, `${name}_${index}`)).join('\n');
            } else if (typeof obj === 'object' && obj !== null) {
                const content = Object.entries(obj)
                    .map(([key, value]) => convertToXML(value, key))
                    .join('\n');
                return `<${name}>\n${content}\n</${name}>`;
            } else {
                return `<${name}>${Utils.escapeXml(String(obj))}</${name}>`;
            }
        }
        
        return xmlHeader + convertToXML(obj, rootName);
    }

    /**
     * JSON转CSV
     */
    jsonToCSV(json) {
        if (!Array.isArray(json)) {
            json = [json];
        }
        
        if (json.length === 0) return '';
        
        // 获取所有可能的键
        const keys = [...new Set(json.flatMap(obj => Object.keys(obj)))];
        
        // 创建CSV头
        const header = keys.map(key => `"${key}"`).join(',');
        
        // 创建CSV行
        const rows = json.map(obj => 
            keys.map(key => {
                const value = obj[key];
                if (value === undefined || value === null) return '';
                if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );
        
        return [header, ...rows].join('\n');
    }

    /**
     * JSON转YAML
     */
    jsonToYAML(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            return '\n' + obj.map(item => 
                spaces + '- ' + this.jsonToYAML(item, indent + 1).replace(/^\n/, '')
            ).join('\n');
        } else if (typeof obj === 'object' && obj !== null) {
            const entries = Object.entries(obj);
            if (entries.length === 0) return '{}';
            return '\n' + entries.map(([key, value]) => {
                const yamlValue = this.jsonToYAML(value, indent + 1);
                return spaces + key + ':' + (yamlValue.startsWith('\n') ? yamlValue : ' ' + yamlValue);
            }).join('\n');
        } else if (typeof obj === 'string') {
            return obj.includes('\n') || obj.includes('"') ? `"${obj.replace(/"/g, '\\"')}"` : obj;
        } else {
            return String(obj);
        }
    }

    /**
     * 显示转换结果
     */
    showConversionResult(format, content) {
        const modal = Utils.showModal(
            `JSON 转 ${format} 结果`,
            `<textarea style="width: 100%; height: 300px; font-family: monospace;" readonly>${Utils.escapeHtml(content)}</textarea>`,
            { 
                confirmText: '下载文件',
                cancelText: '关闭'
            }
        );
        
        modal.then(result => {
            if (result) {
                const extension = format.toLowerCase();
                const filename = `luna-tv-config.${extension}`;
                Utils.downloadFile(content, filename, `text/${extension}`);
            }
        });
    }

    /**
     * 撤销操作
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.editor.setValue(this.history[this.historyIndex]);
            Utils.showToast('已撤销', 'info', 1500);
        }
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.editor.setValue(this.history[this.historyIndex]);
            Utils.showToast('已重做', 'info', 1500);
        }
    }

    /**
     * 保存历史记录
     */
    saveToHistory(content) {
        // 移除当前位置之后的历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 添加新记录
        this.history.push(content);
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * 显示设置面板
     */
    showSettings() {
        const settingsHTML = `
            <div class="settings-panel">
                <h4>编辑器设置</h4>
                <label>
                    <input type="checkbox" ${this.settings.autoFormat ? 'checked' : ''}> 自动格式化
                </label>
                <label>
                    <input type="checkbox" ${this.settings.showLineNumbers ? 'checked' : ''}> 显示行号
                </label>
                <label>
                    <input type="checkbox" ${this.settings.enableSyntaxCheck ? 'checked' : ''}> 语法检查
                </label>
                <label>
                    <input type="checkbox" ${this.settings.enableAutoComplete ? 'checked' : ''}> 自动完成
                </label>
            </div>
        `;
        
        Utils.showModal('设置', settingsHTML).then(result => {
            if (result) {
                // 保存设置
                this.saveSettings();
            }
        });
    }

    /**
     * 加载设置
     */
    loadSettings() {
        const saved = Utils.getStorage('formatter_settings');
        if (saved) {
            this.settings = { ...this.settings, ...saved };
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        Utils.setStorage('formatter_settings', this.settings);
    }

    /**
     * 初始化功能
     */
    initializeFeatures() {
        // 检查URL参数
        this.checkURLParams();
        
        // 设置自动保存历史
        document.addEventListener('editor:contentChange', (e) => {
            this.saveToHistory(e.detail.content);
        });
    }

    /**
     * 检查URL参数
     */
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const jsonParam = urlParams.get('json');
        
        if (jsonParam) {
            try {
                const content = decodeURIComponent(jsonParam);
                this.editor.setValue(content);
                Utils.showToast('已从分享链接加载JSON', 'success');
            } catch (error) {
                console.error('加载分享JSON失败:', error);
            }
        }
    }
}

// 工具函数扩展
Utils.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

Utils.escapeXml = function(text) {
    return text.replace(/[<>&'"]/g, function(c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

// 导出到全局作用域
window.JSONFormatterFeatures = JSONFormatterFeatures;
