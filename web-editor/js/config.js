/**
 * Luna TV 配置编辑器 - 应用配置
 * @author hafrey1
 * @version 1.0.0
 */

const CONFIG = {
    // 应用信息
    APP: {
        NAME: 'Luna TV 配置编辑器',
        VERSION: '1.0.0',
        AUTHOR: 'hafrey1',
        GITHUB_REPO: 'hafrey1/LunaTV-config',
        WEBSITE: 'hafrey1.github.io/LunaTV-config'
    },
    
    // GitHub API配置
    GITHUB: {
        API_BASE: 'https://api.github.com',
        RAW_BASE: 'https://raw.githubusercontent.com',
        DEFAULT_OWNER: 'hafrey1',
        DEFAULT_REPO: 'LunaTV-config',
        DEFAULT_FILES: {
            'luna-tv-config.json': '主配置文件（包含所有源）',
            'jinhuang.json': '无黄配置文件（过滤成人内容）'
        },
        BRANCH: 'main',
        COMMIT_MESSAGE_PREFIX: '[Web Editor]'
    },
    
    // Monaco编辑器配置
    MONACO: {
        CDN: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min',
        THEME_DARK: 'vs-dark',
        THEME_LIGHT: 'vs',
        LANGUAGE: 'json',
        OPTIONS: {
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: '\'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace',
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            bracketMatching: 'always',
            renderIndentGuides: true,
            renderWhitespace: 'selection',
            contextmenu: true,
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            mouseWheelZoom: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: true
            }
        }
    },
    
    // 本地存储键名
    STORAGE: {
        GITHUB_TOKEN: 'lunatv_github_token',
        THEME: 'lunatv_theme',
        EDITOR_SETTINGS: 'lunatv_editor_settings',
        LAST_CONFIG: 'lunatv_last_config',
        HISTORY: 'lunatv_config_history',
        REPO_INFO: 'lunatv_repo_info',
        AUTO_SAVE: 'lunatv_auto_save'
    },
    
    // 应用设置
    SETTINGS: {
        // 主题设置
        DEFAULT_THEME: 'theme-dark',
        AVAILABLE_THEMES: {
            'theme-dark': '深色主题',
            'theme-light': '浅色主题',
            'theme-high-contrast': '高对比度',
            'theme-blue': '蓝色主题',
            'theme-purple': '紫色主题',
            'theme-green': '绿色主题'
        },
        
        // 编辑器设置
        EDITOR: {
            MIN_FONT_SIZE: 10,
            MAX_FONT_SIZE: 24,
            DEFAULT_FONT_SIZE: 14,
            TAB_SIZES: [2, 4, 8],
            DEFAULT_TAB_SIZE: 2
        },
        
        // 自动保存设置
        AUTO_SAVE: {
            DEFAULT_INTERVAL: 0, // 0 = 禁用
            INTERVALS: {
                0: '禁用',
                30: '30秒',
                60: '1分钟',
                300: '5分钟',
                600: '10分钟'
            }
        },
        
        // 历史记录设置
        HISTORY: {
            DEFAULT_SIZE: 10,
            MIN_SIZE: 5,
            MAX_SIZE: 50
        },
        
        // Token设置
        TOKEN: {
            EXPIRE_DAYS: 7,
            ENCRYPT_KEY: 'lunatv_secret_2023'
        }
    },
    
    // 快捷键配置
    SHORTCUTS: {
        SAVE: 'Ctrl+S',
        LOAD: 'Ctrl+O',
        UPLOAD: 'Ctrl+U',
        DOWNLOAD: 'Ctrl+D',
        FIND: 'Ctrl+F',
        REPLACE: 'Ctrl+H',
        FORMAT: 'Ctrl+Shift+F',
        VALIDATE: 'Ctrl+Shift+V',
        NEW_FILE: 'Ctrl+N',
        TOGGLE_THEME: 'Ctrl+Shift+T',
        TOGGLE_PANEL: 'Ctrl+Shift+P'
    },
    
    // 通知设置
    NOTIFICATIONS: {
        DEFAULT_DURATION: 5000,
        MAX_NOTIFICATIONS: 5,
        TYPES: {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info'
        },
        ICONS: {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }
    },
    
    // 验证设置
    VALIDATION: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        SUPPORTED_FORMATS: ['.json'],
        JSON_SCHEMA: {
            type: 'object',
            required: ['sites'],
            properties: {
                sites: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['key', 'name', 'api'],
                        properties: {
                            key: { type: 'string' },
                            name: { type: 'string' },
                            api: { type: 'string', format: 'uri' },
                            type: { type: 'number' },
                            searchable: { type: 'number' },
                            quickSearch: { type: 'number' },
                            filterable: { type: 'number' }
                        }
                    }
                }
            }
        }
    },
    
    // 错误消息
    MESSAGES: {
        ERRORS: {
            NETWORK: '网络连接失败，请检查网络设置',
            GITHUB_TOKEN: 'GitHub Token无效或已过期',
            GITHUB_API: 'GitHub API请求失败',
            FILE_NOT_FOUND: '文件不存在或路径错误',
            INVALID_JSON: 'JSON格式无效',
            FILE_TOO_LARGE: '文件大小超过限制',
            UNSUPPORTED_FORMAT: '不支持的文件格式',
            SAVE_FAILED: '保存失败',
            LOAD_FAILED: '加载失败',
            VALIDATION_FAILED: '配置验证失败'
        },
        
        SUCCESS: {
            SAVED: '配置已成功保存到GitHub',
            LOADED: '配置已成功从GitHub加载',
            FORMATTED: 'JSON格式化完成',
            VALIDATED: 'JSON验证通过',
            UPLOADED: '文件上传成功',
            DOWNLOADED: '文件下载成功',
            SETTINGS_SAVED: '设置已保存'
        },
        
        INFO: {
            LOADING: '正在加载...',
            SAVING: '正在保存...',
            VALIDATING: '正在验证...',
            FORMATTING: '正在格式化...',
            CONNECTING: '正在连接GitHub...'
        }
    },
    
    // API端点
    API: {
        GITHUB_USER: '/user',
        GITHUB_REPO: '/repos/{owner}/{repo}',
        GITHUB_CONTENTS: '/repos/{owner}/{repo}/contents/{path}',
        GITHUB_COMMITS: '/repos/{owner}/{repo}/commits',
        RATE_LIMIT: '/rate_limit'
    },
    
    // 正则表达式
    REGEX: {
        GITHUB_TOKEN: /^ghp_[A-Za-z0-9]{36}$/,
        REPO_NAME: /^[A-Za-z0-9._-]+$/,
        USERNAME: /^[A-Za-z0-9._-]+$/,
        URL: /^https?:\/\/.+/
    },
    
    // 开发模式设置
    DEV: {
        DEBUG: false,
        LOG_LEVEL: 'info', // debug, info, warn, error
        MOCK_API: false
    }
};

// 冻结配置对象，防止意外修改
Object.freeze(CONFIG);

// 导出配置（支持不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof define === 'function' && define.amd) {
    define([], () => CONFIG);
} else {
    window.CONFIG = CONFIG;
}
