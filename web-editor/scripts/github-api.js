/**
 * Luna TV 配置编辑器 - GitHub API 集成
 * 提供与 GitHub API 的交互功能
 */

class GitHubAPI {
    constructor() {
        this.token = null;
        this.owner = 'hafrey1';
        this.repo = 'LunaTV-config';
        this.filename = 'luna-tv-config.json';
        this.baseURL = 'https://api.github.com';
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    /**
     * 设置认证令牌
     */
    setToken(token) {
        this.token = token;
        // 保存到加密存储中
        Utils.setStorage('github_token', token, true);
        Utils.setStorage('token_timestamp', Date.now());
    }

    /**
     * 获取存储的令牌
     */
    getStoredToken() {
        const timestamp = Utils.getStorage('token_timestamp');
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        
        if (timestamp && (Date.now() - timestamp) < maxAge) {
            return Utils.getStorage('github_token', true);
        }
        
        // 令牌过期，清除
        this.clearToken();
        return null;
    }

    /**
     * 清除令牌
     */
    clearToken() {
        this.token = null;
        Utils.removeStorage('github_token');
        Utils.removeStorage('token_timestamp');
    }

    /**
     * 检查是否已认证
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * 通用 API 请求方法
     */
    async request(endpoint, options = {}) {
        if (!this.token) {
            throw new Error('GitHub Token 未设置');
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        let lastError;
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                console.log(`GitHub API 请求 (尝试 ${attempt}):`, url);
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    const error = await this.handleAPIError(response);
                    throw error;
                }

                const data = await response.json();
                console.log('GitHub API 响应成功:', data);
                return data;
            } catch (error) {
                lastError = error;
                console.error(`GitHub API 请求失败 (尝试 ${attempt}):`, error);
                
                // 如果是认证错误，不重试
                if (error.status === 401 || error.status === 403) {
                    break;
                }
                
                // 如果不是最后一次尝试，等待后重试
                if (attempt < this.retryCount) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * 处理 API 错误
     */
    async handleAPIError(response) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData;
        
        try {
            errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // 忽略解析错误
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;

        // 处理特定错误类型
        switch (response.status) {
            case 401:
                error.message = 'GitHub Token 无效或已过期，请检查权限设置';
                break;
            case 403:
                if (errorMessage.includes('rate limit')) {
                    error.message = 'API 调用频率限制，请稍后再试';
                } else {
                    error.message = 'GitHub Token 权限不足，请确保具有 repo 权限';
                }
                break;
            case 404:
                error.message = '文件或仓库未找到，请检查仓库设置';
                break;
            case 422:
                error.message = '请求参数错误: ' + errorMessage;
                break;
        }

        return error;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 验证 Token
     */
    async validateToken() {
        try {
            const user = await this.request('/user');
            console.log('Token 验证成功:', user.login);
            return { valid: true, user };
        } catch (error) {
            console.error('Token 验证失败:', error);
            return { valid: false, error: error.message };
        }
    }

    /**
     * 获取文件内容
     */
    async getFileContent(path = null) {
        const filePath = path || this.filename;
        try {
            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${filePath}`);
            
            if (response.type !== 'file') {
                throw new Error('路径不是文件');
            }

            // GitHub API 返回 base64 编码的内容
            const content = atob(response.content.replace(/\s/g, ''));
            
            return {
                content,
                sha: response.sha,
                size: response.size,
                path: response.path,
                url: response.html_url
            };
        } catch (error) {
            if (error.status === 404) {
                throw new Error(`文件 ${filePath} 不存在`);
            }
            throw error;
        }
    }

    /**
     * 更新文件内容
     */
    async updateFileContent(content, message = null, path = null) {
        const filePath = path || this.filename;
        const commitMessage = message || `更新 ${filePath} - ${Utils.formatDate()}`;
        
        try {
            // 首先获取当前文件的 SHA
            const currentFile = await this.getFileContent(filePath);
            
            // 准备更新数据
            const updateData = {
                message: commitMessage,
                content: btoa(unescape(encodeURIComponent(content))), // 转换为 base64
                sha: currentFile.sha,
                branch: 'main'
            };

            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${filePath}`, {
                method: 'PUT',
                body: updateData
            });

            console.log('文件更新成功:', response);
            return {
                success: true,
                commit: response.commit,
                content: response.content,
                message: '文件保存成功'
            };
        } catch (error) {
            console.error('文件更新失败:', error);
            throw error;
        }
    }

    /**
     * 创建新文件
     */
    async createFile(content, path, message = null) {
        const commitMessage = message || `创建 ${path} - ${Utils.formatDate()}`;
        
        try {
            const createData = {
                message: commitMessage,
                content: btoa(unescape(encodeURIComponent(content))), // 转换为 base64
                branch: 'main'
            };

            const response = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
                method: 'PUT',
                body: createData
            });

            console.log('文件创建成功:', response);
            return {
                success: true,
                commit: response.commit,
                content: response.content,
                message: '文件创建成功'
            };
        } catch (error) {
            console.error('文件创建失败:', error);
            throw error;
        }
    }

    /**
     * 获取仓库信息
     */
    async getRepositoryInfo() {
        try {
            const repo = await this.request(`/repos/${this.owner}/${this.repo}`);
            return {
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                url: repo.html_url,
                defaultBranch: repo.default_branch,
                updatedAt: repo.updated_at
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取提交历史
     */
    async getCommitHistory(path = null, limit = 10) {
        try {
            const params = new URLSearchParams({
                per_page: limit.toString()
            });
            
            if (path) {
                params.append('path', path);
            }

            const commits = await this.request(`/repos/${this.owner}/${this.repo}/commits?${params}`);
            
            return commits.map(commit => ({
                sha: commit.sha.substring(0, 7),
                message: commit.commit.message,
                author: commit.commit.author.name,
                date: commit.commit.author.date,
                url: commit.html_url
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * 搜索文件
     */
    async searchFiles(query) {
        try {
            const searchParams = new URLSearchParams({
                q: `${query} repo:${this.owner}/${this.repo}`
            });

            const results = await this.request(`/search/code?${searchParams}`);
            
            return results.items.map(item => ({
                name: item.name,
                path: item.path,
                url: item.html_url,
                score: item.score
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取分支列表
     */
    async getBranches() {
        try {
            const branches = await this.request(`/repos/${this.owner}/${this.repo}/branches`);
            return branches.map(branch => ({
                name: branch.name,
                protected: branch.protected,
                commit: {
                    sha: branch.commit.sha.substring(0, 7),
                    url: branch.commit.url
                }
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取 API 速率限制信息
     */
    async getRateLimit() {
        try {
            return await this.request('/rate_limit');
        } catch (error) {
            throw error;
        }
    }

    /**
     * 检查仓库权限
     */
    async checkPermissions() {
        try {
            const repo = await this.request(`/repos/${this.owner}/${this.repo}`);
            return {
                canRead: true,
                canWrite: repo.permissions?.push || repo.permissions?.admin || false,
                canAdmin: repo.permissions?.admin || false
            };
        } catch (error) {
            if (error.status === 403 || error.status === 404) {
                return {
                    canRead: false,
                    canWrite: false,
                    canAdmin: false
                };
            }
            throw error;
        }
    }
}

// 导出到全局作用域
window.GitHubAPI = GitHubAPI;
