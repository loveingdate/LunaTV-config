/**
 * GitHub API 集成模块
 * 用于与 GitHub 仓库进行交互，加载和保存 JSON 文件
 */
class GitHubAPI {
    constructor() {
        this.app = null; // 引用主应用实例
        this.baseURL = 'https://api.github.com';
    }
    
    /**
     * 初始化，设置主应用引用
     */
    init(app) {
        this.app = app;
    }
    
    /**
     * 连接到 GitHub
     */
    async connect() {
        const token = document.getElementById('github-token').value.trim();
        if (!token) {
            this.app.showToast('请输入有效的 GitHub Token', 'error');
            return;
        }
        
        try {
            this.app.showToast('正在连接 GitHub...', 'info');
            
            // 测试 GitHub API 连接
            const response = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Token 无效或已过期，请检查 Token 是否正确');
                } else if (response.status === 404) {
                    throw new Error('仓库不存在或无访问权限');
                } else {
                    throw new Error(`GitHub API 错误: ${response.status} ${response.statusText}`);
                }
            }
            
            const repoData = await response.json();
            
            // 设置连接状态
            this.app.githubToken = token;
            this.app.isConnected = true;
            this.app.updateConnectionStatus();
            
            // 保存 Token
            localStorage.setItem('lunatv_github_token', token);
            
            this.app.showToast(`GitHub 连接成功: ${repoData.full_name}`, 'success');
            
            // 加载 JSON 文件列表
            await this.loadJSONFiles();
            
        } catch (error) {
            console.error('GitHub 连接失败:', error);
            this.app.showToast('GitHub 连接失败: ' + error.message, 'error');
            
            // 清除无效 Token
            if (error.message.includes('Token')) {
                localStorage.removeItem('lunatv_github_token');
                document.getElementById('github-token').value = '';
            }
        }
    }
    
    /**
     * 加载仓库中的 JSON 文件列表
     */
    async loadJSONFiles() {
        if (!this.app.isConnected || !this.app.githubToken) {
            await this.app.loadDemoFiles();
            return;
        }
        
        try {
            this.app.showToast('正在加载文件列表...', 'info');
            
            // 获取仓库根目录内容
            const response = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}/contents`, {
                headers: {
                    'Authorization': `token ${this.app.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            
            // 筛选 JSON 文件
            this.app.files = files
                .filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.json'))
                .map(file => ({
                    name: file.name,
                    path: file.path,
                    sha: file.sha,
                    size: file.size,
                    type: 'github',
                    download_url: file.download_url
                }))
                .sort((a, b) => a.name.localeCompare(b.name)); // 按名称排序
            
            this.app.updateFilesList();
            
            const fileCount = this.app.files.length;
            this.app.showToast(`已加载 ${fileCount} 个 JSON 文件`, 'success');
            
            // 如果没有文件，提示用户
            if (fileCount === 0) {
                this.app.showToast('仓库根目录下未找到 JSON 文件', 'warning');
            }
            
        } catch (error) {
            console.error('加载 JSON 文件列表失败:', error);
            this.app.showToast('加载文件列表失败: ' + error.message, 'error');
            
            // 错误处理，降级到演示模式
            if (error.message.includes('401') || error.message.includes('403')) {
                this.app.isConnected = false;
                this.app.updateConnectionStatus();
                localStorage.removeItem('lunatv_github_token');
            }
            
            await this.app.loadDemoFiles();
        }
    }
    
    /**
     * 获取文件内容
     */
    async getFileContent(filePath) {
        if (!this.app.isConnected || !this.app.githubToken) {
            throw new Error('未连接到 GitHub');
        }
        
        try {
            // 使用 raw 内容 API 直接获取文件内容
            const response = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}/contents/${filePath}`, {
                headers: {
                    'Authorization': `token ${this.app.githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`文件不存在: ${filePath}`);
                } else {
                    throw new Error(`加载文件失败: ${response.status} ${response.statusText}`);
                }
            }
            
            return await response.text();
            
        } catch (error) {
            console.error('获取文件内容失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存文件到 GitHub
     */
    async saveFile() {
        if (!this.app.isConnected || !this.app.githubToken) {
            this.app.showToast('请先连接 GitHub', 'error');
            return;
        }
        
        const content = document.getElementById('editor').value;
        if (!this.app.validateJSON()) {
            this.app.showToast('保存失败: JSON 格式无效', 'error');
            return;
        }
        
        if (!this.app.currentFile) {
            this.app.showToast('请先选择要保存的文件', 'error');
            return;
        }
        
        if (this.app.currentFile.type !== 'github') {
            this.app.showToast('只能保存 GitHub 文件，请选择仓库中的文件', 'warning');
            return;
        }
        
        try {
            this.app.showToast('正在保存到 GitHub...', 'info');
            
            // 获取文件的最新 SHA（防止并发修改冲突）
            const fileInfoResponse = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}/contents/${this.app.currentFile.path}`, {
                headers: {
                    'Authorization': `token ${this.app.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                }
            });
            
            let currentSha = this.app.currentFile.sha;
            if (fileInfoResponse.ok) {
                const fileInfo = await fileInfoResponse.json();
                currentSha = fileInfo.sha;
            }
            
            // 保存文件
            const response = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}/contents/${this.app.currentFile.path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.app.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                },
                body: JSON.stringify({
                    message: `Update ${this.app.currentFile.name} via Luna TV Editor`,
                    content: btoa(unescape(encodeURIComponent(content))), // Base64 编码
                    sha: currentSha,
                    author: {
                        name: 'Luna TV Editor',
                        email: 'noreply@lunatv.editor'
                    },
                    committer: {
                        name: 'Luna TV Editor', 
                        email: 'noreply@lunatv.editor'
                    }
                })
            });
            
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('文件已被其他用户修改，请刷新后重试');
                } else if (response.status === 422) {
                    throw new Error('文件内容验证失败，请检查 JSON 格式');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`保存失败: ${response.status} ${errorData.message || response.statusText}`);
                }
            }
            
            const result = await response.json();
            
            // 更新文件信息
            this.app.currentFile.sha = result.content.sha;
            this.app.currentFile.size = result.content.size;
            
            // 更新文件列表中的信息
            const fileIndex = this.app.files.findIndex(f => f.path === this.app.currentFile.path);
            if (fileIndex !== -1) {
                this.app.files[fileIndex].sha = result.content.sha;
                this.app.files[fileIndex].size = result.content.size;
                this.app.updateFilesList();
            }
            
            this.app.updateSaveStatus(true);
            this.app.showToast(`配置已保存到 GitHub: ${this.app.currentFile.name}`, 'success');
            
            // 记录操作日志
            console.log('文件保存成功:', {
                file: this.app.currentFile.name,
                sha: result.content.sha,
                commit_url: result.commit.html_url
            });
            
        } catch (error) {
            console.error('保存到 GitHub 失败:', error);
            this.app.showToast('保存失败: ' + error.message, 'error');
            
            // 如果是认证错误，重置连接状态
            if (error.message.includes('401') || error.message.includes('403')) {
                this.app.isConnected = false;
                this.app.updateConnectionStatus();
                localStorage.removeItem('lunatv_github_token');
            }
        }
    }
    
    /**
     * 创建新文件
     */
    async createFile(filename, content) {
        if (!this.app.isConnected || !this.app.githubToken) {
            this.app.showToast('请先连接 GitHub', 'error');
            return;
        }
        
        try {
            this.app.showToast('正在创建文件...', 'info');
            
            const response = await fetch(`${this.baseURL}/repos/${this.app.repoOwner}/${this.app.repoName}/contents/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.app.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                },
                body: JSON.stringify({
                    message: `Create ${filename} via Luna TV Editor`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    author: {
                        name: 'Luna TV Editor',
                        email: 'noreply@lunatv.editor'
                    }
                })
            });
            
            if (!response.ok) {
                if (response.status === 422) {
                    throw new Error('文件已存在或名称无效');
                } else {
                    throw new Error(`创建文件失败: ${response.status} ${response.statusText}`);
                }
            }
            
            const result = await response.json();
            
            this.app.showToast(`文件创建成功: ${filename}`, 'success');
            
            // 刷新文件列表
            await this.loadJSONFiles();
            
            return result;
            
        } catch (error) {
            console.error('创建文件失败:', error);
            this.app.showToast('创建文件失败: ' + error.message, 'error');
            throw error;
        }
    }
    
    /**
     * 检查 API 限制
     */
    async checkRateLimit() {
        try {
            const response = await fetch(`${this.baseURL}/rate_limit`, {
                headers: {
                    'Authorization': this.app.githubToken ? `token ${this.app.githubToken}` : '',
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Luna-TV-Editor/2.0'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.rate;
            }
            
        } catch (error) {
            console.error('检查 API 限制失败:', error);
        }
        
        return null;
    }
}

// 创建全局实例
window.GitHubAPI = new GitHubAPI();

// 当主应用初始化后，设置引用
document.addEventListener('DOMContentLoaded', () => {
    // 等待主应用初始化完成
    setTimeout(() => {
        if (window.LunaTVApp) {
            window.GitHubAPI.init(window.LunaTVApp);
            console.log('🐙 GitHub API 模块已初始化');
        }
    }, 100);
});
