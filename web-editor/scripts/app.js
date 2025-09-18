/**
 * Luna TV 配置编辑器 - 主应用类
 * 经典布局版本，集成 GitHub API
 */
class LunaTVEditor {
    constructor() {
        // 文件管理
        this.files = [];
        this.currentFile = null;
        
        // 历史管理
        this.history = [];
        this.historyIndex = -1;
        
        // 搜索功能
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        
        // GitHub 相关
        this.githubToken = null;
        this.isConnected = false;
        this.repoOwner = 'hafrey1';
        this.repoName = 'LunaTV-config';
        
        // 应用设置
        this.currentTheme = 'dark';
        this.autoSaveInterval = null;
        this.lastContent = '';
    }
    
    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🌙 初始化 Luna TV 配置编辑器...');
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 加载设置
            this.loadSettings();
            
            // 启动自动保存
            this.startAutoSave();
            
            // 更新状态
            this.updateStatus();
            
            // 检查保存的 Token
            const savedToken = localStorage.getItem('lunatv_github_token');
            if (savedToken) {
                this.githubToken = savedToken;
                document.getElementById('github-token').value = savedToken;
                await this.connectGitHub();
            } else {
                // 没有 Token，显示 Token 输入区
                this.showTokenSection();
                await this.enterDemoMode();
            }
            
            console.log('✨ Luna TV 配置编辑器初始化完成');
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.showToast('初始化失败: ' + error.message, 'error');
            await this.enterDemoMode();
        }
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const editor = document.getElementById('editor');
        
        // 编辑器事件
        editor.addEventListener('input', () => this.onContentChange());
        editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        editor.addEventListener('scroll', () => this.updateCursorPosition());
        editor.addEventListener('click', () => this.updateCursorPosition());
        editor.addEventListener('keyup', () => this.updateCursorPosition());
        
        // 工具栏按钮
        document.getElementById('refresh-btn').onclick = () => this.loadJSONFiles();
        document.getElementById('upload-btn').onclick = () => this.uploadFile();
        document.getElementById('download-btn').onclick = () => this.downloadFile();
        document.getElementById('format-btn').onclick = () => this.formatJSON();
        document.getElementById('validate-btn').onclick = () => this.validateJSON();
        document.getElementById('find-btn').onclick = () => this.showFind();
        document.getElementById('undo-btn').onclick = () => this.undo();
        document.getElementById('redo-btn').onclick = () => this.redo();
        document.getElementById('theme-toggle').onclick = () => this.toggleTheme();
        
        // 头部按钮
        document.getElementById('save-btn').onclick = () => this.saveToGitHub();
        
        // GitHub 连接
        document.getElementById('connect-btn').onclick = () => this.connectGitHub();
        document.getElementById('demo-btn').onclick = () => this.enterDemoMode();
        
        // 文件选择
        document.getElementById('files-list').onclick = (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                this.selectFile(fileItem.dataset.path);
            }
        };
        
        document.getElementById('file-input').onchange = (e) => this.handleFileUpload(e);
        document.getElementById('refresh-files').onclick = () => this.loadJSONFiles();
        
        // 查找功能
        document.getElementById('editor-find-btn').onclick = () => this.showFind();
        document.getElementById('search-input').addEventListener('input', (e) => this.performSearch(e.target.value));
        document.getElementById('search-prev').onclick = () => this.searchPrevious();
        document.getElementById('search-next').onclick = () => this.searchNext();
        document.getElementById('search-close').onclick = () => this.hideFind();
        
        // 查找栏键盘事件
        document.getElementById('search-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.searchPrevious();
                } else {
                    this.searchNext();
                }
            } else if (e.key === 'Escape') {
                this.hideFind();
            }
        });
        
        // 历史记录
        document.getElementById('clear-history').onclick = () => this.clearHistory();
        document.getElementById('export-history').onclick = () => this.exportHistory();
        document.getElementById('history-list').onclick = (e) => {
            const item = e.target.closest('.history-item');
            if (item) {
                this.restoreHistory(parseInt(item.dataset.index));
            }
        };
        
        // 错误面板
        document.getElementById('close-error').onclick = () => this.hideError();
        
        // 移动端侧边栏切换
        document.getElementById('toggle-files').onclick = () => this.toggleFilesSidebar();
        document.getElementById('toggle-history').onclick = () => this.toggleHistorySidebar();
        
        // 全局键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideFind();
                this.hideError();
            }
        });
        
        // 响应式布局检测
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const toggleFiles = document.getElementById('toggle-files');
        const toggleHistory = document.getElementById('toggle-history');
        
        if (isMobile) {
            toggleFiles.style.display = 'flex';
            toggleHistory.style.display = 'flex';
        } else {
            toggleFiles.style.display = 'none';
            toggleHistory.style.display = 'none';
            // 移除移动端激活状态
            document.getElementById('files-sidebar').classList.remove('active');
            document.getElementById('history-sidebar').classList.remove('active');
        }
    }
    
    /**
     * 切换文件侧边栏
     */
    toggleFilesSidebar() {
        const sidebar = document.getElementById('files-sidebar');
        sidebar.classList.toggle('active');
    }
    
    /**
     * 切换历史侧边栏
     */
    toggleHistorySidebar() {
        const sidebar = document.getElementById('history-sidebar');
        sidebar.classList.toggle('active');
    }
    
    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveToGitHub();
                    break;
                case 'f':
                    e.preventDefault();
                    this.showFind();
                    break;
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
            }
        }
        
        // Ctrl+Shift+F 格式化
        if (e.ctrlKey && e.shiftKey && e.key === 'F') {
            e.preventDefault();
            this.formatJSON();
        }
    }
    
    /**
     * 内容变化处理
     */
    onContentChange() {
        const content = document.getElementById('editor').value;
        this.updateFileSize(content);
        this.validateJSON();
        
        if (content !== this.lastContent) {
            this.saveToHistory(content);
            this.lastContent = content;
            this.updateSaveStatus(false);
        }
    }
    
    /**
     * 显示 Token 输入区
     */
    showTokenSection() {
        const tokenSection = document.getElementById('token-section');
        tokenSection.classList.remove('hidden');
    }
    
    /**
     * 隐藏 Token 输入区
     */
    hideTokenSection() {
        const tokenSection = document.getElementById('token-section');
        tokenSection.classList.add('hidden');
    }
    
    /**
     * 进入演示模式
     */
    async enterDemoMode() {
        this.isConnected = true;
        this.updateConnectionStatus();
        this.showToast('已进入演示模式，可查看示例文件', 'info');
        
        // 隐藏 token 输入区
        this.hideTokenSection();
        
        // 加载演示数据
        await this.loadDemoFiles();
    }
    
    /**
     * 加载演示文件
     */
    async loadDemoFiles() {
        this.files = [
            {
                name: 'luna-tv-config.json',
                path: 'luna-tv-config.json',
                size: 2048,
                type: 'demo',
                content: JSON.stringify({
                    "sites": [
                        {
                            "key": "csp_AppYsV2",
                            "name": "AppYs",
                            "type": 3,
                            "api": "csp_AppYsV2",
                            "searchable": 1,
                            "quickSearch": 1,
                            "filterable": 1,
                            "ext": "https://raw.githubusercontent.com/hafrey1/LunaTV-config/main/luna-tv-config.json"
                        }
                    ],
                    "wallpaper": "https://picsum.photos/1920/1080",
                    "spider": "https://raw.githubusercontent.com/hafrey1/LunaTV-config/main/js/spider.jar",
                    "warningText": "本应用仅供学习交流使用",
                    "disclaimer": "免责声明内容",
                    "version": "2.0.0"
                }, null, 2)
            },
            {
                name: 'jinhuang.json',
                path: 'jinhuang.json',
                size: 1536,
                type: 'demo',
                content: JSON.stringify({
                    "sites": [
                        {
                            "key": "csp_XYQHiker",
                            "name": "香雅情",
                            "type": 3,
                            "api": "csp_XYQHiker",
                            "searchable": 1,
                            "quickSearch": 1,
                            "filterable": 1
                        }
                    ],
                    "wallpaper": "https://picsum.photos/1920/1080",
                    "spider": "https://raw.githubusercontent.com/hafrey1/LunaTV-config/main/js/spider.jar",
                    "warningText": "本应用仅供学习交流使用",
                    "disclaimer": "免责声明内容",
                    "version": "1.5.0"
                }, null, 2)
            },
            {
                name: 'config-example.json',
                path: 'config-example.json',
                size: 512,
                type: 'demo',
                content: JSON.stringify({
                    "app_name": "Luna TV",
                    "version": "2.0.0",
                    "author": "hafrey1",
                    "repository": "https://github.com/hafrey1/LunaTV-config",
                    "settings": {
                        "auto_update": true,
                        "cache_size": 100,
                        "max_concurrent_requests": 5
                    },
                    "features": [
                        "多源聚合",
                        "智能搜索",
                        "在线播放",
                        "离线缓存"
                    ]
                }, null, 2)
            }
        ];
        
        this.updateFilesList();
    }
    
    /**
     * 更新文件列表
     */
    updateFilesList() {
        const list = document.getElementById('files-list');
        list.innerHTML = '';
        
        if (this.files.length === 0) {
            list.innerHTML = `
                <div class="history-empty">
                    🔍 没有找到 JSON 文件
                    <br><small>请检查仓库或上传文件</small>
                </div>
            `;
            return;
        }
        
        this.files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.dataset.path = file.path;
            
            if (this.currentFile && this.currentFile.path === file.path) {
                item.classList.add('active');
            }
            
            const sizeText = this.formatFileSize(file.size);
            const typeIcon = file.type === 'github' ? '🌐' : '💾';
            
            item.innerHTML = `
                <span class="file-icon">📄</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${typeIcon} ${sizeText}</span>
            `;
            
            list.appendChild(item);
        });
    }
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    /**
     * 选择文件
     */
    async selectFile(path) {
        const file = this.files.find(f => f.path === path);
        if (!file) return;
        
        try {
            this.showToast('正在加载文件...', 'info');
            
            let content;
            
            if (file.type === 'github') {
                // 从 GitHub 加载
                content = await window.GitHubAPI.getFileContent(file.path);
            } else {
                // 演示模式
                content = file.content;
            }
            
            this.currentFile = file;
            document.getElementById('current-file').textContent = `📄 ${file.name}`;
            document.getElementById('editor').value = content;
            this.updateFilesList();
            this.onContentChange();
            
            this.showToast(`已加载文件: ${file.name}`, 'success');
            
            // 移动端自动关闭侧边栏
            if (window.innerWidth <= 768) {
                document.getElementById('files-sidebar').classList.remove('active');
            }
            
        } catch (error) {
            console.error('加载文件失败:', error);
            this.showToast('加载文件失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 上传文件
     */
    uploadFile() {
        document.getElementById('file-input').click();
    }
    
    /**
     * 处理文件上传
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            document.getElementById('editor').value = content;
            this.onContentChange();
            this.showToast(`文件 "${file.name}" 上传成功`, 'success');
            
            // 更新当前文件名
            this.currentFile = { 
                name: file.name, 
                path: file.name, 
                type: 'local',
                size: content.length
            };
            document.getElementById('current-file').textContent = `📄 ${file.name}`;
        };
        reader.readAsText(file);
        
        // 清空输入
        event.target.value = '';
    }
    
    /**
     * 下载文件
     */
    downloadFile() {
        const content = document.getElementById('editor').value;
        const filename = this.currentFile ? 
            this.currentFile.name : 
            `luna-tv-config-${new Date().toISOString().split('T')[0]}.json`;
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('文件下载成功', 'success');
    }
    
    /**
     * 更新连接状态
     */
    updateConnectionStatus() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const saveBtn = document.getElementById('save-btn');
        
        if (this.isConnected) {
            statusDot.classList.add('connected');
            statusText.textContent = '已连接';
            saveBtn.disabled = false;
            this.hideTokenSection();
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = '未连接';
            saveBtn.disabled = true;
            this.showTokenSection();
        }
    }
    
    /**
     * 切换主题
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('lunatv_theme', this.currentTheme);
        this.showToast(`已切换到${this.currentTheme === 'dark' ? '深色' : '浅色'}主题`, 'info');
    }
    
    /**
     * 启动自动保存
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            const content = document.getElementById('editor').value;
            if (content !== this.lastContent && this.validateJSON()) {
                localStorage.setItem('lunatv_autosave', content);
                localStorage.setItem('lunatv_autosave_time', Date.now());
            }
        }, 30000); // 30秒自动保存
    }
    
    /**
     * 更新保存状态
     */
    updateSaveStatus(saved) {
        const status = document.getElementById('last-saved');
        if (saved) {
            status.textContent = '已保存';
            setTimeout(() => {
                if (status.textContent === '已保存') {
                    status.textContent = '刚刚保存';
                }
            }, 2000);
        } else {
            status.textContent = '未保存';
        }
    }
    
    /**
     * 更新文件大小显示
     */
    updateFileSize(content) {
        const size = new Blob([content]).size;
        const sizeElement = document.getElementById('file-size');
        if (sizeElement) {
            sizeElement.textContent = this.formatFileSize(size);
        }
    }
    
    /**
     * 更新光标位置
     */
    updateCursorPosition() {
        const editor = document.getElementById('editor');
        const position = editor.selectionStart;
        const content = editor.value.substring(0, position);
        const lines = content.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        document.getElementById('cursor-position').textContent = `行 ${line}, 列 ${column}`;
    }
    
    /**
     * 更新状态
     */
    updateStatus() {
        // 初始状态
        this.updateCursorPosition();
        
        // 定期更新光标位置
        setInterval(() => {
            if (document.activeElement === document.getElementById('editor')) {
                this.updateCursorPosition();
            }
        }, 100);
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const errorPanel = document.getElementById('error-panel');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = message;
        errorPanel.classList.add('show');
    }
    
    /**
     * 隐藏错误信息
     */
    hideError() {
        const errorPanel = document.getElementById('error-panel');
        errorPanel.classList.remove('show');
    }
    
    /**
     * 显示 Toast 通知
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // 点击关闭
        toast.onclick = () => toast.remove();
        
        // 自动关闭
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        // 加载主题
        const theme = localStorage.getItem('lunatv_theme') || 'dark';
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        // 加载历史记录
        const historyData = localStorage.getItem('lunatv_history');
        if (historyData) {
            try {
                const parsed = JSON.parse(historyData);
                this.history = parsed.history || [];
                this.historyIndex = parsed.index || -1;
                this.updateUndoRedoButtons();
                this.updateHistoryPanel();
            } catch (e) {
                console.warn('历史记录加载失败:', e);
            }
        }
        
        // 加载自动保存的内容
        const autoSaved = localStorage.getItem('lunatv_autosave');
        const autoSaveTime = localStorage.getItem('lunatv_autosave_time');
        if (autoSaved && autoSaveTime) {
            const timeDiff = Date.now() - parseInt(autoSaveTime);
            if (timeDiff < 24 * 60 * 60 * 1000) { // 24小时内
                if (confirm('检测到自动保存的内容，是否恢复？')) {
                    document.getElementById('editor').value = autoSaved;
                    this.onContentChange();
                }
            }
        }
    }
    
    /**
     * 加载 JSON 文件列表 - 在 github.js 中实现
     */
    async loadJSONFiles() {
        if (window.GitHubAPI && this.isConnected && this.githubToken) {
            await window.GitHubAPI.loadJSONFiles();
        } else {
            await this.loadDemoFiles();
        }
    }
    
    /**
     * 连接 GitHub - 在 github.js 中实现
     */
    async connectGitHub() {
        if (window.GitHubAPI) {
            await window.GitHubAPI.connect();
        }
    }
    
    /**
     * 保存到 GitHub - 在 github.js 中实现
     */
    async saveToGitHub() {
        if (window.GitHubAPI && this.isConnected) {
            await window.GitHubAPI.saveFile();
        } else {
            this.showToast('请先连接 GitHub', 'error');
        }
    }
    
    // 编辑器功能在 editor.js 中实现
    formatJSON() { window.EditorUtils?.formatJSON(); }
    compressJSON() { window.EditorUtils?.compressJSON(); }
    validateJSON() { return window.EditorUtils?.validateJSON() || true; }
    
    // 搜索功能在 editor.js 中实现
    showFind() { window.EditorUtils?.showFind(); }
    hideFind() { window.EditorUtils?.hideFind(); }
    performSearch(query) { window.EditorUtils?.performSearch(query); }
    searchNext() { window.EditorUtils?.searchNext(); }
    searchPrevious() { window.EditorUtils?.searchPrevious(); }
    
    // 历史管理在 editor.js 中实现
    saveToHistory(content) { window.EditorUtils?.saveToHistory(content); }
    undo() { window.EditorUtils?.undo(); }
    redo() { window.EditorUtils?.redo(); }
    updateUndoRedoButtons() { window.EditorUtils?.updateUndoRedoButtons(); }
    updateHistoryPanel() { window.EditorUtils?.updateHistoryPanel(); }
    clearHistory() { window.EditorUtils?.clearHistory(); }
    exportHistory() { window.EditorUtils?.exportHistory(); }
    restoreHistory(index) { window.EditorUtils?.restoreHistory(index); }
}

// 全局实例
window.LunaTVApp = new LunaTVEditor();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.LunaTVApp.init();
});

console.log('🌙 Luna TV 配置编辑器 v2.0 - 经典布局版');
