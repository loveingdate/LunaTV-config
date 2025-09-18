/**
 * Luna TV 配置编辑器 - 编辑器功能模块
 * 处理 Monaco Editor 相关功能
 */

class EditorManager {
    constructor() {
        this.editor = null;
        this.currentContent = '';
        this.isModified = false;
        this.validationTimeout = null;
        this.autoSaveTimeout = null;
        this.autoSaveInterval = 30000; // 30秒自动保存
    }

    /**
     * 初始化编辑器
     */
    async init(containerId = 'monaco-editor') {
        try {
            // 等待 Monaco Editor 加载完成
            await this.waitForMonaco();
            
            // 创建编辑器实例
            this.editor = monaco.editor.create(document.getElementById(containerId), {
                value: this.getDefaultContent(),
                language: 'json',
                theme: 'vs-dark',
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                minimap: {
                    enabled: true
                },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: 14,
                tabSize: 2,
                insertSpaces: true,
                detectIndentation: true,
                renderWhitespace: 'boundary',
                renderControlCharacters: true,
                quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false
                },
                parameterHints: {
                    enabled: true
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                accessibilitySupport: 'auto'
            });

            // 设置编辑器事件监听
            this.setupEventListeners();
            
            // 设置 JSON 验证
            this.setupJSONValidation();
            
            // 初始化内容
            this.currentContent = this.editor.getValue();
            
            console.log('Monaco Editor 初始化完成');
            return this.editor;
        } catch (error) {
            console.error('编辑器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 等待 Monaco Editor 加载完成
     */
    waitForMonaco() {
        return new Promise((resolve, reject) => {
            if (typeof monaco !== 'undefined') {
                resolve();
                return;
            }
            
            let attempts = 0;
            const maxAttempts = 50;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof monaco !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Monaco Editor 加载超时'));
                }
            }, 100);
        });
    }

    /**
     * 获取默认内容
     */
    getDefaultContent() {
        return JSON.stringify({
            "sites": [],
            "wallpaper": "",
            "spider": "",
            "warningText": "",
            "disclaimer": "",
            "version": "1.0.0"
        }, null, 2);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (!this.editor) return;

        // 内容变化监听
        this.editor.onDidChangeModelContent(() => {
            this.onContentChange();
        });

        // 光标位置变化监听
        this.editor.onDidChangeCursorPosition((e) => {
            this.updateCursorPosition(e.position);
        });

        // 焦点变化监听
        this.editor.onDidFocusEditorText(() => {
            this.onEditorFocus();
        });

        this.editor.onDidBlurEditorText(() => {
            this.onEditorBlur();
        });

        // 键盘事件监听
        this.editor.onKeyDown((e) => {
            this.handleKeyDown(e);
        });
    }

    /**
     * 设置 JSON 验证
     */
    setupJSONValidation() {
        // 配置 JSON 语言特性
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            allowComments: false,
            schemas: [{
                uri: "http://json-schema.org/draft-07/schema#",
                fileMatch: ["*"],
                schema: {
                    type: "object",
                    properties: {
                        sites: {
                            type: "array",
                            description: "视频源站点列表"
                        },
                        wallpaper: {
                            type: "string",
                            description: "壁纸链接"
                        },
                        spider: {
                            type: "string",
                            description: "爬虫配置"
                        }
                    }
                }
            }]
        });
    }

    /**
     * 内容变化处理
     */
    onContentChange() {
        const newContent = this.editor.getValue();
        this.isModified = newContent !== this.currentContent;
        
        // 更新状态栏
        this.updateFileSize(newContent.length);
        this.updateModificationStatus();
        
        // 延迟验证 JSON
        this.scheduleJSONValidation();
        
        // 自动保存
        this.scheduleAutoSave();
        
        // 触发内容变化事件
        this.dispatchEvent('contentChange', {
            content: newContent,
            isModified: this.isModified
        });
    }

    /**
     * 安排 JSON 验证
     */
    scheduleJSONValidation() {
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        
        this.validationTimeout = setTimeout(() => {
            this.validateJSON();
        }, 500);
    }

    /**
     * 验证 JSON
     */
    validateJSON() {
        const content = this.editor.getValue();
        const validation = Utils.validateJSON(content);
        
        if (validation.valid) {
            this.hideErrorPanel();
            this.updateJSONStatus(true);
        } else {
            this.showErrorPanel(validation.error, validation.line);
            this.updateJSONStatus(false, validation.error);
        }
        
        // 触发验证事件
        this.dispatchEvent('jsonValidation', validation);
    }

    /**
     * 显示错误面板
     */
    showErrorPanel(error, line = null) {
        const errorPanel = Utils.$('#error-panel');
        const errorMessage = Utils.$('#error-message');
        
        if (errorPanel && errorMessage) {
            errorMessage.textContent = line ? `行 ${line}: ${error}` : error;
            errorPanel.style.display = 'block';
        }
    }

    /**
     * 隐藏错误面板
     */
    hideErrorPanel() {
        const errorPanel = Utils.$('#error-panel');
        if (errorPanel) {
            errorPanel.style.display = 'none';
        }
    }

    /**
     * 更新光标位置显示
     */
    updateCursorPosition(position) {
        const cursorElement = Utils.$('#cursor-position');
        if (cursorElement) {
            cursorElement.textContent = `行 ${position.lineNumber}, 列 ${position.column}`;
        }
    }

    /**
     * 更新文件大小显示
     */
    updateFileSize(length) {
        const fileSizeElement = Utils.$('#file-size');
        if (fileSizeElement) {
            fileSizeElement.textContent = `${Utils.formatNumber(length)} 字符`;
        }
    }

    /**
     * 更新修改状态显示
     */
    updateModificationStatus() {
        const lastSavedElement = Utils.$('#last-saved');
        if (lastSavedElement) {
            lastSavedElement.textContent = this.isModified ? '未保存' : '已保存';
        }
    }

    /**
     * 更新 JSON 状态显示
     */
    updateJSONStatus(isValid, error = null) {
        const jsonStatusElement = Utils.$('#json-status');
        if (jsonStatusElement) {
            if (isValid) {
                jsonStatusElement.textContent = 'JSON 有效';
                jsonStatusElement.className = 'status-valid';
            } else {
                jsonStatusElement.textContent = 'JSON 无效';
                jsonStatusElement.className = 'status-invalid';
                jsonStatusElement.title = error || '';
            }
        }
    }

    /**
     * 处理键盘按键
     */
    handleKeyDown(e) {
        // Ctrl+S / Cmd+S - 保存
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
            e.preventDefault();
            this.dispatchEvent('save');
        }
        // Ctrl+O / Cmd+O - 打开
        else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
            e.preventDefault();
            this.dispatchEvent('load');
        }
        // Ctrl+U / Cmd+U - 上传
        else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyU') {
            e.preventDefault();
            this.dispatchEvent('upload');
        }
        // Ctrl+D / Cmd+D - 下载
        else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
            e.preventDefault();
            this.dispatchEvent('download');
        }
        // F11 - 全屏
        else if (e.code === 'F11') {
            e.preventDefault();
            this.dispatchEvent('toggleFullscreen');
        }
    }

    /**
     * 编辑器获得焦点
     */
    onEditorFocus() {
        console.log('编辑器获得焦点');
    }

    /**
     * 编辑器失去焦点
     */
    onEditorBlur() {
        console.log('编辑器失去焦点');
        this.validateJSON(); // 失去焦点时验证
    }

    /**
     * 安排自动保存
     */
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        if (this.isModified) {
            this.autoSaveTimeout = setTimeout(() => {
                this.dispatchEvent('autoSave');
            }, this.autoSaveInterval);
        }
    }

    /**
     * 获取编辑器内容
     */
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    /**
     * 设置编辑器内容
     */
    setValue(content) {
        if (this.editor) {
            this.editor.setValue(content);
            this.currentContent = content;
            this.isModified = false;
            this.updateModificationStatus();
        }
    }

    /**
     * 格式化 JSON
     */
    formatJSON() {
        try {
            const content = this.getValue();
            const formatted = Utils.formatJSON(content);
            this.setValue(formatted);
            Utils.showToast('JSON 格式化成功', 'success');
        } catch (error) {
            Utils.showToast('格式化失败: ' + error.message, 'error');
        }
    }

    /**
     * 压缩 JSON
     */
    compressJSON() {
        try {
            const content = this.getValue();
            const compressed = Utils.compressJSON(content);
            this.setValue(compressed);
            Utils.showToast('JSON 压缩成功', 'success');
        } catch (error) {
            Utils.showToast('压缩失败: ' + error.message, 'error');
        }
    }

    /**
     * 切换主题
     */
    setTheme(theme) {
        if (this.editor) {
            const monacoTheme = theme === 'light' ? 'vs' : theme === 'high-contrast' ? 'hc-black' : 'vs-dark';
            monaco.editor.setTheme(monacoTheme);
        }
    }

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
        const appContainer = Utils.$('.app-container');
        if (appContainer) {
            appContainer.classList.toggle('fullscreen');
            
            // 重新调整编辑器大小
            setTimeout(() => {
                if (this.editor) {
                    this.editor.layout();
                }
            }, 100);
        }
    }

    /**
     * 查找文本
     */
    find() {
        if (this.editor) {
            this.editor.trigger('find', 'actions.find');
        }
    }

    /**
     * 替换文本
     */
    replace() {
        if (this.editor) {
            this.editor.trigger('replace', 'editor.action.startFindReplaceAction');
        }
    }

    /**
     * 跳转到指定行
     */
    goToLine(lineNumber) {
        if (this.editor) {
            this.editor.setPosition({ lineNumber, column: 1 });
            this.editor.revealLine(lineNumber);
        }
    }

    /**
     * 获取选中文本
     */
    getSelectedText() {
        if (this.editor) {
            const selection = this.editor.getSelection();
            return this.editor.getModel().getValueInRange(selection);
        }
        return '';
    }

    /**
     * 插入文本
     */
    insertText(text) {
        if (this.editor) {
            const position = this.editor.getPosition();
            this.editor.executeEdits('insert-text', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text
            }]);
        }
    }

    /**
     * 调整编辑器大小
     */
    resize() {
        if (this.editor) {
            this.editor.layout();
        }
    }

    /**
     * 销毁编辑器
     */
    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
        
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
    }

    /**
     * 触发自定义事件
     */
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(`editor:${eventName}`, {
            detail: detail,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * 检查是否有未保存的更改
     */
    hasUnsavedChanges() {
        return this.isModified;
    }

    /**
     * 标记为已保存
     */
    markAsSaved() {
        this.currentContent = this.getValue();
        this.isModified = false;
        this.updateModificationStatus();
        
        // 更新最后保存时间
        const lastSavedElement = Utils.$('#last-saved');
        if (lastSavedElement) {
            lastSavedElement.textContent = '刚刚保存';
            setTimeout(() => {
                if (!this.isModified) {
                    lastSavedElement.textContent = '已保存';
                }
            }, 2000);
        }
    }
}

// 导出到全局作用域
window.EditorManager = EditorManager;
