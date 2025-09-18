/**
 * Luna TV 配置编辑器 - 编辑器功能模块（修复版）
 * 处理 Monaco Editor 相关功能，包含备用编辑器
 */

class EditorManager {
    constructor() {
        this.editor = null;
        this.currentContent = '';
        this.isModified = false;
        this.validationTimeout = null;
        this.autoSaveTimeout = null;
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.useBackupEditor = false;
    }

    /**
     * 初始化编辑器
     */
    async init(containerId = 'monaco-editor') {
        try {
            console.log('开始初始化编辑器...');
            
            // 等待 Monaco Editor 加载完成或使用备用编辑器
            await this.waitForMonaco();
            
            if (window.useBackupEditor || !window.monaco) {
                console.log('使用备用编辑器');
                this.initBackupEditor(containerId);
            } else {
                console.log('使用Monaco Editor');
                this.initMonacoEditor(containerId);
            }
            
            // 设置编辑器事件监听
            this.setupEventListeners();
            
            // 初始化内容
            this.currentContent = this.getValue();
            
            console.log('编辑器初始化完成');
            return this.editor;
        } catch (error) {
            console.error('编辑器初始化失败:', error);
            // 降级到备用编辑器
            console.log('降级到备用编辑器');
            this.initBackupEditor(containerId);
            this.setupEventListeners();
            this.currentContent = this.getValue();
        }
    }

    /**
     * 初始化Monaco编辑器
     */
    initMonacoEditor(containerId) {
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

        // 设置 JSON 验证
        this.setupJSONValidation();
        this.useBackupEditor = false;
    }

    /**
     * 初始化备用编辑器（普通textarea）
     */
    initBackupEditor(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'backup-editor';
        textarea.value = this.getDefaultContent();
        textarea.spellcheck = false;
        
        // 设置样式
        Object.assign(textarea.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '16px',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            tabSize: '2'
        });
        
        // Tab键支持
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            }
        });
        
        container.appendChild(textarea);
        this.editor = {
            textarea: textarea,
            getValue: () => textarea.value,
            setValue: (value) => { textarea.value = value; },
            onDidChangeModelContent: (callback) => {
                textarea.addEventListener('input', callback);
            },
            onDidChangeCursorPosition: (callback) => {
                textarea.addEventListener('selectionchange', () => {
                    const lines = textarea.value.substr(0, textarea.selectionStart).split('\n');
                    callback({
                        position: {
                            lineNumber: lines.length,
                            column: lines[lines.length - 1].length + 1
                        }
                    });
                });
            },
            onDidFocusEditorText: (callback) => {
                textarea.addEventListener('focus', callback);
            },
            onDidBlurEditorText: (callback) => {
                textarea.addEventListener('blur', callback);
            },
            onKeyDown: (callback) => {
                textarea.addEventListener('keydown', callback);
            },
            layout: () => {}, // 备用编辑器不需要layout
            dispose: () => {
                if (textarea.parentNode) {
                    textarea.parentNode.removeChild(textarea);
                }
            }
        };
        
        this.useBackupEditor = true;
        Utils.showToast('正在使用简化编辑器模式', 'info', 3000);
    }

    /**
     * 等待 Monaco Editor 加载完成
     */
    waitForMonaco() {
        return new Promise((resolve, reject) => {
            // 如果已经标记使用备用编辑器，直接resolve
            if (window.useBackupEditor) {
                resolve();
                return;
            }
            
            // 如果Monaco已经加载，直接resolve
            if (window.monaco) {
                resolve();
                return;
            }
            
            // 监听monaco-ready事件
            const onMonacoReady = () => {
                document.removeEventListener('monaco-ready', onMonacoReady);
                clearTimeout(timeout);
                resolve();
            };
            
            document.addEventListener('monaco-ready', onMonacoReady);
            
            // 设置超时（降低超时时间到15秒）
            const timeout = setTimeout(() => {
                document.removeEventListener('monaco-ready', onMonacoReady);
                console.warn('Monaco Editor 加载超时，将使用备用编辑器');
                window.useBackupEditor = true;
                resolve();
            }, 15000);
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
        if (this.editor.onDidChangeCursorPosition) {
            this.editor.onDidChangeCursorPosition((e) => {
                this.updateCursorPosition(e.position);
            });
        }

        // 焦点变化监听
        if (this.editor.onDidFocusEditorText) {
            this.editor.onDidFocusEditorText(() => {
                this.onEditorFocus();
            });
        }

        if (this.editor.onDidBlurEditorText) {
            this.editor.onDidBlurEditorText(() => {
                this.onEditorBlur();
            });
        }

        // 键盘事件监听
        if (this.editor.onKeyDown) {
            this.editor.onKeyDown((e) => {
                this.handleKeyDown(e);
            });
        }
    }

    /**
     * 设置 JSON 验证
     */
    setupJSONValidation() {
        if (this.useBackupEditor || !window.monaco) return;
        
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
        const newContent = this.getValue();
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
        const content = this.getValue();
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
        // 其他快捷键...
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
        if (this.editor && !this.useBackupEditor && window.monaco) {
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
                this.resize();
            }, 100);
        }
    }

    /**
     * 调整编辑器大小
     */
    resize() {
        if (this.editor && this.editor.layout) {
            this.editor.layout();
        }
    }

    /**
     * 销毁编辑器
     */
    dispose() {
        if (this.editor && this.editor.dispose) {
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
