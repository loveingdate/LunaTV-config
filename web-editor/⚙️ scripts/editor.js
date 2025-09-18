/**
 * 编辑器工具类
 * 包含 JSON 编辑、验证、搜索、历史等功能
 */
class EditorUtils {
    constructor() {
        this.app = null; // 引用主应用实例
        this.searchMatches = [];
        this.currentSearchIndex = -1;
    }
    
    /**
     * 初始化，设置主应用引用
     */
    init(app) {
        this.app = app;
    }
    
    /**
     * 格式化 JSON
     */
    formatJSON() {
        try {
            const content = document.getElementById('editor').value;
            if (!content.trim()) {
                this.app.showToast('请输入 JSON 内容', 'warning');
                return;
            }
            
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            
            document.getElementById('editor').value = formatted;
            this.app.onContentChange();
            this.app.showToast('JSON 格式化成功', 'success');
            
            // 记录操作
            console.log('JSON 格式化完成');
            
        } catch (e) {
            this.app.showToast('JSON 格式化失败: ' + e.message, 'error');
            this.app.showError('格式化错误: ' + e.message);
        }
    }
    
    /**
     * 压缩 JSON
     */
    compressJSON() {
        try {
            const content = document.getElementById('editor').value;
            if (!content.trim()) {
                this.app.showToast('请输入 JSON 内容', 'warning');
                return;
            }
            
            const parsed = JSON.parse(content);
            const compressed = JSON.stringify(parsed);
            
            document.getElementById('editor').value = compressed;
            this.app.onContentChange();
            this.app.showToast('JSON 压缩成功', 'success');
            
        } catch (e) {
            this.app.showToast('JSON 压缩失败: ' + e.message, 'error');
            this.app.showError('压缩错误: ' + e.message);
        }
    }
    
    /**
     * 验证 JSON 格式
     */
    validateJSON() {
        const content = document.getElementById('editor').value;
        const jsonStatus = document.getElementById('json-status');
        
        if (!content.trim()) {
            jsonStatus.textContent = '无内容';
            jsonStatus.className = 'status-invalid';
            return false;
        }
        
        try {
            // 尝试解析 JSON
            const parsed = JSON.parse(content);
            
            // 检查是否为空对象或数组
            if (parsed === null) {
                jsonStatus.textContent = 'JSON 值为 null';
                jsonStatus.className = 'status-valid';
            } else if (typeof parsed === 'object') {
                const keys = Object.keys(parsed);
                if (keys.length === 0) {
                    jsonStatus.textContent = 'JSON 对象为空';
                } else {
                    jsonStatus.textContent = `JSON 格式正常 (${keys.length} 个属性)`;
                }
                jsonStatus.className = 'status-valid';
            } else {
                jsonStatus.textContent = 'JSON 格式正常';
                jsonStatus.className = 'status-valid';
            }
            
            this.app.hideError();
            return true;
            
        } catch (e) {
            jsonStatus.textContent = 'JSON 格式错误';
            jsonStatus.className = 'status-invalid';
            
            // 提供详细的错误信息
            const errorDetails = this.parseJSONError(e, content);
            this.app.showError(errorDetails);
            
            return false;
        }
    }
    
    /**
     * 解析 JSON 错误信息，提供更友好的提示
     */
    parseJSONError(error, content) {
        let message = error.message;
        
        // 尝试提取行号和列号
        const positionMatch = message.match(/position (\d+)/);
        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const lines = content.substring(0, position).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            
            message += `\n\n位置：第 ${line} 行，第 ${column} 列`;
            
            // 显示错误上下文
            const startLine = Math.max(0, line - 3);
            const endLine = Math.min(content.split('\n').length, line + 2);
            const contextLines = content.split('\n').slice(startLine, endLine);
            
            message += '\n\n上下文：\n';
            contextLines.forEach((contextLine, index) => {
                const lineNumber = startLine + index + 1;
                const marker = lineNumber === line ? '>>> ' : '    ';
                message += `${marker}第${lineNumber}行: ${contextLine}\n`;
            });
        }
        
        // 常见错误提示
        if (message.includes('Unexpected token')) {
            message += '\n\n常见问题：\n' +
                      '1. 缺少逗号或冒号\n' +
                      '2. 字符串未用双引号包围\n' +
                      '3. 多余的逗号\n' +
                      '4. 使用了中文标点符号';
        } else if (message.includes('Unexpected end')) {
            message += '\n\n可能原因：\n' +
                      '1. JSON 结构不完整\n' +
                      '2. 缺少右括号 } 或 ]';
        }
        
        return message;
    }
    
    /**
     * 复制到剪贴板
     */
    async copyToClipboard() {
        try {
            const content = document.getElementById('editor').value;
            if (!content.trim()) {
                this.app.showToast('无内容可复制', 'warning');
                return;
            }
            
            await navigator.clipboard.writeText(content);
            this.app.showToast('已复制到剪贴板', 'success');
        } catch (e) {
            // 备用方案
            const editor = document.getElementById('editor');
            editor.select();
            document.execCommand('copy');
            this.app.showToast('已复制到剪贴板', 'success');
        }
    }
    
    /**
     * 显示查找栏
     */
    showFind() {
        const searchBar = document.getElementById('search-bar');
        const searchInput = document.getElementById('search-input');
        
        searchBar.classList.add('show');
        searchInput.focus();
        
        // 如果有选中的文本，自动填入查找框
        const editor = document.getElementById('editor');
        const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
        if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
            searchInput.value = selectedText;
            this.performSearch(selectedText);
        }
    }
    
    /**
     * 隐藏查找栏
     */
    hideFind() {
        const searchBar = document.getElementById('search-bar');
        searchBar.classList.remove('show');
        this.clearSearchHighlight();
        document.getElementById('editor').focus();
    }
    
    /**
     * 执行搜索
     */
    performSearch(query) {
        const editor = document.getElementById('editor');
        const content = editor.value;
        this.searchMatches = [];
        
        if (!query || !content) {
            this.updateSearchInfo();
            return;
        }
        
        // 查找所有匹配项（不区分大小写）
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let index = lowerContent.indexOf(lowerQuery);
        
        while (index !== -1) {
            this.searchMatches.push({ 
                start: index, 
                end: index + query.length,
                text: content.substring(index, index + query.length)
            });
            index = lowerContent.indexOf(lowerQuery, index + 1);
        }
        
        this.currentSearchIndex = this.searchMatches.length > 0 ? 0 : -1;
        this.updateSearchInfo();
        
        if (this.searchMatches.length > 0) {
            this.jumpToSearchMatch(0);
        }
    }
    
    /**
     * 搜索下一个
     */
    searchNext() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchMatches.length;
        this.jumpToSearchMatch(this.currentSearchIndex);
        this.updateSearchInfo();
    }
    
    /**
     * 搜索上一个
     */
    searchPrevious() {
        if (this.searchMatches.length === 0) return;
        
        this.currentSearchIndex = this.currentSearchIndex === 0 ? 
            this.searchMatches.length - 1 : this.currentSearchIndex - 1;
        this.jumpToSearchMatch(this.currentSearchIndex);
        this.updateSearchInfo();
    }
    
    /**
     * 跳转到查找结果
     */
    jumpToSearchMatch(index) {
        if (index < 0 || index >= this.searchMatches.length) return;
        
        const editor = document.getElementById('editor');
        const match = this.searchMatches[index];
        
        editor.focus();
        editor.setSelectionRange(match.start, match.end);
        
        // 滚动到可见区域
        const lines = editor.value.substring(0, match.start).split('\n');
        const lineNumber = lines.length;
        const lineHeight = 20; // 估算行高
        const viewHeight = editor.clientHeight;
        const scrollTop = Math.max(0, (lineNumber - Math.floor(viewHeight / lineHeight / 2)) * lineHeight);
        
        editor.scrollTop = scrollTop;
    }
    
    /**
     * 更新搜索信息显示
     */
    updateSearchInfo() {
        const searchInfo = document.getElementById('search-info');
        if (this.searchMatches.length === 0) {
            searchInfo.textContent = '0/0';
        } else {
            searchInfo.textContent = `${this.currentSearchIndex + 1}/${this.searchMatches.length}`;
        }
    }
    
    /**
     * 清除搜索高亮
     */
    clearSearchHighlight() {
        this.searchMatches = [];
        this.currentSearchIndex = -1;
        this.updateSearchInfo();
    }
    
    /**
     * 替换功能（预留）
     */
    replace(searchText, replaceText, replaceAll = false) {
        const editor = document.getElementById('editor');
        let content = editor.value;
        
        if (replaceAll) {
            // 全部替换
            const regex = new RegExp(this.escapeRegExp(searchText), 'gi');
            content = content.replace(regex, replaceText);
        } else {
            // 替换当前选中
            if (this.currentSearchIndex >= 0 && this.currentSearchIndex < this.searchMatches.length) {
                const match = this.searchMatches[this.currentSearchIndex];
                content = content.substring(0, match.start) + 
                         replaceText + 
                         content.substring(match.end);
            }
        }
        
        editor.value = content;
        this.app.onContentChange();
        
        // 重新搜索
        if (this.searchMatches.length > 0) {
            const query = document.getElementById('search-input').value;
            this.performSearch(query);
        }
    }
    
    /**
     * 转义正则表达式特殊字符
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 保存到历史记录
     */
    saveToHistory(content) {
        // 如果内容相同，不保存
        if (this.app.history[this.app.historyIndex] === content) return;
        
        // 移除当前位置之后的历史记录
        this.app.history = this.app.history.slice(0, this.app.historyIndex + 1);
        
        // 添加新记录
        this.app.history.push(content);
        
        // 限制历史记录数量
        if (this.app.history.length > 50) {
            this.app.history.shift();
        } else {
            this.app.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
        this.updateHistoryPanel();
        
        // 保存到本地存储
        localStorage.setItem('lunatv_history', JSON.stringify({
            history: this.app.history,
            index: this.app.historyIndex
        }));
    }
    
    /**
     * 撤销操作
     */
    undo() {
        if (this.app.historyIndex > 0) {
            this.app.historyIndex--;
            const content = this.app.history[this.app.historyIndex];
            document.getElementById('editor').value = content;
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
            this.app.showToast('已撤销', 'info');
            this.app.onContentChange();
        }
    }
    
    /**
     * 重做操作
     */
    redo() {
        if (this.app.historyIndex < this.app.history.length - 1) {
            this.app.historyIndex++;
            const content = this.app.history[this.app.historyIndex];
            document.getElementById('editor').value = content;
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
            this.app.showToast('已重做', 'info');
            this.app.onContentChange();
        }
    }
    
    /**
     * 更新撤销/重做按钮状态
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.disabled = this.app.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.app.historyIndex >= this.app.history.length - 1;
    }
    
    /**
     * 更新历史记录面板
     */
    updateHistoryPanel() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (this.app.history.length === 0) {
            list.innerHTML = `
                <div class="history-empty">
                    暂无历史记录
                    <br><small>编辑内容后将自动生成历史记录</small>
                </div>
            `;
            return;
        }
        
        // 逆序显示，最新的在前面
        this.app.history.slice().reverse().forEach((content, reverseIndex) => {
            const index = this.app.history.length - 1 - reverseIndex;
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.index = index;
            
            // 高亮当前版本
            if (index === this.app.historyIndex) {
                item.classList.add('active');
            }
            
            // 生成预览文本
            const preview = content.substring(0, 80).replace(/\n/g, ' ').replace(/\s+/g, ' ');
            const timeAgo = this.getTimeAgo(Date.now() - (reverseIndex * 30000)); // 模拟时间
            
            // 计算字符数
            const charCount = content.length;
            const sizeText = charCount < 1024 ? `${charCount} 字符` : `${(charCount / 1024).toFixed(1)}KB`;
            
            item.innerHTML = `
                <div class="history-time">版本 ${index + 1} - ${timeAgo} - ${sizeText}</div>
                <div class="history-preview">${preview}${content.length > 80 ? '...' : ''}</div>
            `;
            
            // 点击事件
            item.onclick = () => {
                this.restoreHistory(index);
            };
            
            list.appendChild(item);
        });
    }
    
    /**
     * 获取相对时间
     */
    getTimeAgo(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return `${seconds}秒前`;
    }
    
    /**
     * 恢复历史版本
     */
    restoreHistory(index) {
        if (index >= 0 && index < this.app.history.length) {
            const content = this.app.history[index];
            document.getElementById('editor').value = content;
            this.app.historyIndex = index;
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
            this.app.onContentChange();
            this.app.showToast(`已恢复版本 ${index + 1}`, 'success');
            
            // 移动端自动关闭历史面板
            if (window.innerWidth <= 768) {
                document.getElementById('history-sidebar').classList.remove('active');
            }
        }
    }
    
    /**
     * 清除历史记录
     */
    clearHistory() {
        if (confirm('确定要清除所有历史记录吗？此操作无法撤销。')) {
            this.app.history = [];
            this.app.historyIndex = -1;
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
            localStorage.removeItem('lunatv_history');
            this.app.showToast('历史记录已清除', 'info');
        }
    }
    
    /**
     * 导出历史记录
     */
    exportHistory() {
        if (this.app.history.length === 0) {
            this.app.showToast('没有历史记录可导出', 'warning');
            return;
        }
        
        const data = {
            exported_at: new Date().toISOString(),
            app_version: '2.0',
            total_versions: this.app.history.length,
            current_index: this.app.historyIndex,
            history: this.app.history.map((content, index) => ({
                version: index + 1,
                content: content,
                size: content.length,
                is_current: index === this.app.historyIndex
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `lunatv-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.app.showToast('历史记录已导出', 'success');
    }
    
    /**
     * 导入历史记录
     */
    importHistory(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.history && Array.isArray(data.history)) {
                    this.app.history = data.history.map(item => 
                        typeof item === 'string' ? item : item.content
                    );
                    this.app.historyIndex = Math.min(
                        data.current_index || data.history.length - 1,
                        this.app.history.length - 1
                    );
                    
                    this.updateUndoRedoButtons();
                    this.updateHistoryPanel();
                    
                    // 保存到本地
                    localStorage.setItem('lunatv_history', JSON.stringify({
                        history: this.app.history,
                        index: this.app.historyIndex
                    }));
                    
                    this.app.showToast(`已导入 ${this.app.history.length} 个历史版本`, 'success');
                } else {
                    throw new Error('无效的历史数据格式');
                }
            } catch (error) {
                this.app.showToast('导入失败: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * 获取编辑器统计信息
     */
    getEditorStats() {
        const content = document.getElementById('editor').value;
        const lines = content.split('\n');
        const words = content.split(/\s+/).filter(word => word.length > 0);
        
        return {
            characters: content.length,
            charactersNoSpaces: content.replace(/\s/g, '').length,
            lines: lines.length,
            words: words.length,
            size: new Blob([content]).size
        };
    }
}

// 创建全局实例
window.EditorUtils = new EditorUtils();

// 当主应用初始化后，设置引用
document.addEventListener('DOMContentLoaded', () => {
    // 等待主应用初始化完成
    setTimeout(() => {
        if (window.LunaTVApp) {
            window.EditorUtils.init(window.LunaTVApp);
            console.log('✏️ 编辑器工具模块已初始化');
        }
    }, 100);
});
