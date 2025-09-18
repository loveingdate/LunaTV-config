/**
 * Luna TV 配置编辑器 - 主应用程序
 * 应用程序的主要逻辑和事件处理
 */

class LunaTVEditor {
    constructor() {
        this.github = new GitHubAPI();
        this.editor = new EditorManager();
        this.isInitialized = false;
        this.currentTheme = 'dark';
        this.viewMode = 'editor';
        this.isConnected = false;
    }

    /**
     * 初始化应用程序
     */
    async init() {
        try {
            console.log('初始化 Luna TV 配置编辑器...');
            
            // 显示加载界面
            this.showLoading(true);
            
            // 初始化编辑器
            await this.editor.init();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 恢复保存的设置
            this.restoreSettings();
            
            // 尝试自动连接
            await this.autoConnect();
            
            // 隐藏加载界面，显示应用
            this.showLoading(false);
            
            this.isInitialized = true;
            console.log('Luna TV 配置编辑器初始化完成');
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showLoading(false);
            Utils.showToast('应用初始化失败: ' + error.message, 'error', 5000);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // UI 按钮事件
        this.setupUIEvents();
        
        // 编辑器事件
        this.setupEditorEvents();
        
        // 键盘快捷键
        this.setupKeyboardEvents();
        
        // 窗口事件
        this.setupWindowEvents();
    }

    /**
     * 设置 UI 事件
     */
    setupUIEvents() {
        // GitHub 连接
        Utils.$('#connect-btn')?.addEventListener('click', () => this.connectGitHub());
        
        // 工具栏按钮
        Utils.$('#save-btn')?.addEventListener('click', () => this.saveToGitHub());
        Utils.$('#load-btn')?.addEventListener('click', () => this.loadFromGitHub());
        Utils.$('#upload-btn')?.addEventListener('click', () => this.uploadFile());
        Utils.$('#download-btn')?.addEventListener('click', () => this.downloadFile());
        
        // JSON 工具
        Utils.$('#format-btn')?.addEventListener('click', () => this.editor.formatJSON());
        Utils.$('#compress-btn')?.addEventListener('click', () => this.editor.compressJSON());
        Utils.$('#validate-btn')?.addEventListener('click', () => this.editor.validateJSON());
        
        // 主题和视图
        Utils.$('#theme-toggle')?.addEventListener('click', () => this.toggleTheme());
        Utils.$('#fullscreen-toggle')?.addEventListener('click', () => this.editor.toggleFullscreen());
        Utils.$('#view-mode')?.addEventListener('change', (e) => this.changeViewMode(e.target.value));
        
        // 错误面板
        Utils.$('#close-error')?.addEventListener('click', () => this.editor.hideErrorPanel());
        
        // 侧边面板
        Utils.$('#close-panel')?.addEventListener('click', () => this.closeSidePanel());
        
        // 文件输入
        Utils.$('#file-input')?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Token 输入回车键
        Utils.$('#github-token')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectGitHub();
            }
        });
    }

    /**
     * 设置编辑器事件
     */
    setupEditorEvents() {
        document.addEventListener('editor:contentChange', (e) => {
            this.onContentChange(e.detail);
        });
        
        document.addEventListener('editor:jsonValidation', (e) => {
            this.onJSONValidation(e.detail);
        });
        
        document.addEventListener('editor:save', () => {
            this.saveToGitHub();
        });
        
        document.addEventListener('editor:load', () => {
            this.loadFromGitHub();
        });
        
        document.addEventListener('editor:upload', () => {
            this.uploadFile();
        });
        
        document.addEventListener('editor:download', () => {
            this.downloadFile();
        });
        
        document.addEventListener('editor:toggleFullscreen', () => {
            this.editor.toggleFullscreen();
        });
        
        document.addEventListener('editor:autoSave', () => {
            this.autoSave();
        });
    }

    /**
     * 设置键盘事件
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // 阻止某些默认快捷键
            if ((e.ctrlKey || e.metaKey) && ['s', 'o', 'u', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
    }

    /**
     * 设置窗口事件
     */
    setupWindowEvents() {
        // 窗口调整大小
        window.addEventListener('resize', Utils.debounce(() => {
            this.editor.resize();
        }, 250));
        
        // 页面关闭前检查
        window.addEventListener('beforeunload', (e) => {
            if (this.editor.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
            }
        });
        
        // 在线状态变化
        window.addEventListener('online', () => {
            Utils.showToast('网络连接已恢复', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.showToast('网络连接已断开', 'warning');
        });
    }

    /**
     * 显示/隐藏加载界面
     */
    showLoading(show) {
        const loading = Utils.$('#loading');
        const app = Utils.$('#app');
        
        if (loading && app) {
            if (show) {
                loading.style.display = 'flex';
                app.style.display = 'none';
            } else {
                loading.style.display = 'none';
                app.style.display = 'grid';
            }
        }
    }

    /**
     * 尝试自动连接 GitHub
     */
    async autoConnect() {
        const savedToken = this.github.getStoredToken();
        if (savedToken) {
            Utils.$('#github-token').value = '••••••••••••••••';
            this.github.setToken(savedToken);
            
            try {
                const validation = await this.github.validateToken();
                if (validation.valid) {
                    this.setConnectionStatus(true, validation.user.login);
                    Utils.showToast(`已连接到 GitHub (${validation.user.login})`, 'success');
                } else {
                    throw new Error(validation.error);
                }
            } catch (error) {
                console.warn('自动连接失败:', error);
                this.github.clearToken();
                Utils.$('#github-token').value = '';
            }
        }
    }

    /**
     * 连接 GitHub
     */
    async connectGitHub() {
        const tokenInput = Utils.$('#github-token');
        const token = tokenInput.value.trim();
        
        if (!token || token === '••••••••••••••••') {
            Utils.showToast('请输入有效的 GitHub Token', 'error');
            return;
        }
        
        const connectBtn = Utils.$('#connect-btn');
        const originalText = connectBtn.textContent;
        
        try {
            connectBtn.textContent = '连接中...';
            connectBtn.disabled = true;
            
            this.github.setToken(token);
            const validation = await this.github.validateToken();
            
            if (validation.valid) {
                this.setConnectionStatus(true, validation.user.login);
                tokenInput.value = '••••••••••••••••'; // 隐藏 token
                Utils.showToast(`连接成功！欢迎 ${validation.user.login}`, 'success');
                
                // 尝试加载配置文件
                this.loadFromGitHub();
            } else {
                throw new Error(validation.error);
            }
        } catch (error) {
            this.setConnectionStatus(false);
            this.github.clearToken();
            Utils.showToast('连接失败: ' + error.message, 'error');
        } finally {
            connectBtn.textContent = originalText;
            connectBtn.disabled = false;
        }
    }

    /**
     * 设置连接状态
     */
    setConnectionStatus(connected, username = '') {
        this.isConnected = connected;
        const statusDot = Utils.$('.status-dot');
        const statusText = Utils.$('.status-text');
        const tokenSection = Utils.$('#token-section');
        
        if (statusDot) {
            statusDot.classList.toggle('connected', connected);
        }
        
        if (statusText) {
            statusText.textContent = connected ? `已连接 (${username})` : '未连接';
        }
        
        if (tokenSection) {
            tokenSection.style.display = connected ? 'none' : 'block';
        }
        
        // 启用/禁用相关按钮
        const buttons = ['#save-btn', '#load-btn'];
        buttons.forEach(selector => {
            const btn = Utils.$(selector);
            if (btn) {
                btn.disabled = !connected;
            }
        });
    }

    /**
     * 从 GitHub 加载配置
     */
    async loadFromGitHub() {
        if (!this.isConnected) {
            Utils.showToast('请先连接 GitHub', 'error');
            return;
        }
        
        const loadBtn = Utils.$('#load-btn');
        const originalText = loadBtn.textContent;
        
        try {
            loadBtn.textContent = '加载中...';
            loadBtn.disabled = true;
            
            const fileData = await this.github.getFileContent();
            this.editor.setValue(fileData.content);
            
            Utils.showToast('配置文件加载成功', 'success');
            console.log('配置文件加载成功:', fileData);
        } catch (error) {
            console.error('加载失败:', error);
            Utils.showToast('加载失败: ' + error.message, 'error');
        } finally {
            loadBtn.textContent = originalText;
            loadBtn.disabled = false;
        }
    }

    /**
     * 保存到 GitHub
     */
    async saveToGitHub() {
        if (!this.isConnected) {
            Utils.showToast('请先连接 GitHub', 'error');
            return;
        }
        
        // 验证 JSON
        const validation = Utils.validateJSON(this.editor.getValue());
        if (!validation.valid) {
            Utils.showToast('保存失败: JSON 格式无效', 'error');
            return;
        }
        
        const saveBtn = Utils.$('#save-btn');
        const originalText = saveBtn.textContent;
        
        try {
            saveBtn.textContent = '保存中...';
            saveBtn.disabled = true;
            
            const content = this.editor.getValue();
            const result = await this.github.updateFileContent(content);
            
            this.editor.markAsSaved();
            Utils.showToast('配置保存成功', 'success');
            console.log('保存成功:', result);
        } catch (error) {
            console.error('保存失败:', error);
            Utils.showToast('保存失败: ' + error.message, 'error');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    /**
     * 上传文件
     */
    uploadFile() {
        const fileInput = Utils.$('#file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * 处理文件上传
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            Utils.showToast('请选择 JSON 文件', 'error');
            return;
        }
        
        try {
            const content = await Utils.readFile(file);
            
            // 验证 JSON
            const validation = Utils.validateJSON(content);
            if (!validation.valid) {
                const confirmed = await Utils.showModal(
                    'JSON 格式错误',
                    `文件包含无效的 JSON 格式：\n${validation.error}\n\n是否仍要加载此文件？`,
                    { confirmText: '仍要加载', cancelText: '取消' }
                );
                if (!confirmed) return;
            }
            
            this.editor.setValue(content);
            Utils.showToast(`文件 "${file.name}" 上传成功`, 'success');
        } catch (error) {
            Utils.showToast('文件读取失败: ' + error.message, 'error');
        } finally {
            // 清空文件输入
            event.target.value = '';
        }
    }

    /**
     * 下载文件
     */
    downloadFile() {
        try {
            const content = this.editor.getValue();
            const filename = `luna-tv-config-${new Date().toISOString().split('T')[0]}.json`;
            Utils.downloadFile(content, filename);
            Utils.showToast('文件下载成功', 'success');
        } catch (error) {
            Utils.showToast('下载失败: ' + error.message, 'error');
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const themes = ['dark', 'light', 'high-contrast'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];
        
        document.body.setAttribute('data-theme', this.currentTheme);
        this.editor.setTheme(this.currentTheme);
        
        // 保存主题设置
        Utils.setStorage('theme', this.currentTheme);
        
        const themeNames = {
            'dark': '深色主题',
            'light': '浅色主题',
            'high-contrast': '高对比度主题'
        };
        
        Utils.showToast(`已切换到${themeNames[this.currentTheme]}`, 'info', 2000);
    }

    /**
     * 更改视图模式
     */
    changeViewMode(mode) {
        this.viewMode = mode;
        const sidePanel = Utils.$('#side-panel');
        
        if (mode === 'tree' || mode === 'split') {
            this.showTreeView();
            sidePanel.style.display = 'flex';
        } else {
            sidePanel.style.display = 'none';
        }
        
        Utils.setStorage('viewMode', mode);
    }

    /**
     * 显示树状视图
     */
    showTreeView() {
        try {
            const content = this.editor.getValue();
            if (!content.trim()) return;
            
            const jsonData = JSON.parse(content);
            const treeContainer = Utils.$('#json-tree');
            
            if (treeContainer) {
                treeContainer.innerHTML = this.generateTreeHTML(jsonData);
                this.setupTreeEvents();
            }
        } catch (error) {
            const treeContainer = Utils.$('#json-tree');
            if (treeContainer) {
                treeContainer.innerHTML = '<div class="tree-error">JSON 格式无效，无法显示树状视图</div>';
            }
        }
    }

    /**
     * 生成树状 HTML
     */
    generateTreeHTML(obj, level = 0) {
        let html = '';
        const indent = '\u00A0'.repeat(level * 4);
        
        if (Array.isArray(obj)) {
            html += `<div class="tree-node">${indent}[</div>`;
            obj.forEach((item, index) => {
                html += `<div class="tree-node">${indent}\u00A0\u00A0${index}: `;
                if (typeof item === 'object' && item !== null) {
                    html += '</div>';
                    html += this.generateTreeHTML(item, level + 1);
                } else {
                    html += `<span class="tree-${typeof item}">${JSON.stringify(item)}</span></div>`;
                }
            });
            html += `<div class="tree-node">${indent}]</div>`;
        } else if (typeof obj === 'object' && obj !== null) {
            html += `<div class="tree-node">${indent}{</div>`;
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                html += `<div class="tree-node">${indent}\u00A0\u00A0<span class="tree-key">"${key}"</span>: `;
                if (typeof value === 'object' && value !== null) {
                    html += '</div>';
                    html += this.generateTreeHTML(value, level + 1);
                } else {
                    html += `<span class="tree-${typeof value}">${JSON.stringify(value)}</span></div>`;
                }
            });
            html += `<div class="tree-node">${indent}}</div>`;
        } else {
            html += `<span class="tree-${typeof obj}">${JSON.stringify(obj)}</span>`;
        }
        
        return html;
    }

    /**
     * 设置树状视图事件
     */
    setupTreeEvents() {
        // 这里可以添加树状视图的交互事件
        // 比如点击折叠/展开节点等
    }

    /**
     * 关闭侧边面板
     */
    closeSidePanel() {
        const sidePanel = Utils.$('#side-panel');
        const viewModeSelect = Utils.$('#view-mode');
        
        if (sidePanel) {
            sidePanel.style.display = 'none';
        }
        
        if (viewModeSelect) {
            viewModeSelect.value = 'editor';
        }
        
        this.viewMode = 'editor';
        Utils.setStorage('viewMode', 'editor');
    }

    /**
     * 内容变化处理
     */
    onContentChange(detail) {
        // 如果是树状视图或分屏模式，更新树状视图
        if (this.viewMode === 'tree' || this.viewMode === 'split') {
            Utils.debounce(() => {
                this.showTreeView();
            }, 1000)();
        }
    }

    /**
     * JSON 验证处理
     */
    onJSONValidation(detail) {
        // 可以在这里添加额外的验证逻辑
        console.log('JSON 验证结果:', detail);
    }

    /**
     * 自动保存
     */
    async autoSave() {
        if (this.isConnected && this.editor.hasUnsavedChanges()) {
            try {
                const content = this.editor.getValue();
                const validation = Utils.validateJSON(content);
                
                if (validation.valid) {
                    await this.github.updateFileContent(content, '自动保存 - ' + Utils.formatDate());
                    this.editor.markAsSaved();
                    Utils.showToast('已自动保存', 'info', 2000);
                }
            } catch (error) {
                console.warn('自动保存失败:', error);
            }
        }
    }

    /**
     * 恢复保存的设置
     */
    restoreSettings() {
        // 恢复主题
        const savedTheme = Utils.getStorage('theme') || 'dark';
        this.currentTheme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
        this.editor.setTheme(savedTheme);
        
        // 恢复视图模式
        const savedViewMode = Utils.getStorage('viewMode') || 'editor';
        const viewModeSelect = Utils.$('#view-mode');
        if (viewModeSelect) {
            viewModeSelect.value = savedViewMode;
            this.changeViewMode(savedViewMode);
        }
        
        console.log('设置恢复完成');
    }

    /**
     * 显示欢迎消息
     */
    showWelcomeMessage() {
        const hasShownWelcome = Utils.getStorage('hasShownWelcome');
        if (!hasShownWelcome) {
            setTimeout(() => {
                Utils.showToast('欢迎使用 Luna TV 配置编辑器！', 'info', 4000);
                Utils.setStorage('hasShownWelcome', true);
            }, 1000);
        }
    }

    /**
     * 获取应用状态
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isConnected: this.isConnected,
            currentTheme: this.currentTheme,
            viewMode: this.viewMode,
            hasUnsavedChanges: this.editor.hasUnsavedChanges()
        };
    }
}

// 应用程序实例
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new LunaTVEditor();
        await app.init();
        
        // 将应用实例暴露到全局，便于调试
        window.lunaTVEditor = app;
        
        console.log('🌙 Luna TV 配置编辑器启动完成！');
    } catch (error) {
        console.error('应用启动失败:', error);
        
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h3>🚫 应用启动失败</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">重新加载</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// 导出到全局作用域
window.LunaTVEditor = LunaTVEditor;
