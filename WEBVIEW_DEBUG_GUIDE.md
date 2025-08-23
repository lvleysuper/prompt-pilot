# WebView 加载问题调试指南

## 🔍 问题诊断

用户反馈：插件"打开主界面"一直显示加载状态，无法正常操作。

## 🎯 可能原因分析

### 1. JavaScript 执行错误
- DOM 元素获取失败
- 事件监听器设置失败
- 扩展消息通信问题

### 2. 资源加载问题
- CSS 文件加载失败
- JavaScript 文件加载失败
- 路径配置错误

### 3. WebView 配置问题
- CSP (内容安全策略) 配置过严
- nonce 值不匹配
- 资源 URI 生成错误

---

## 🔧 调试步骤

### 步骤 1: 检查控制台错误
1. 在 Extension Development Host 窗口中按 `F12` 打开开发者工具
2. 切换到 `Console` 标签页
3. 查看是否有 JavaScript 错误或资源加载失败

**常见错误类型：**
- `Cannot read property 'addEventListener' of null` - DOM 元素未找到
- `Refused to load` - CSP 阻止资源加载
- `Uncaught ReferenceError` - 变量或函数未定义

### 步骤 2: 验证资源加载
在开发者工具的 `Network` 标签页中检查：
- [ ] main.css 是否成功加载
- [ ] vscode.css 是否成功加载  
- [ ] reset.css 是否成功加载
- [ ] main.js 是否成功加载

**如果资源加载失败：**
1. 检查文件是否存在于 `media/` 目录
2. 验证 WebView URI 生成是否正确
3. 确认 CSP 配置允许资源加载

### 步骤 3: 检查 DOM 结构
在 `Elements` 标签页中验证：
- [ ] HTML 结构是否完整渲染
- [ ] 所有必需的 DOM 元素是否存在
- [ ] 元素 ID 是否正确匹配 JavaScript 中的引用

### 步骤 4: 验证 JavaScript 初始化
在 `Console` 中手动执行：
```javascript
// 检查关键 DOM 元素
console.log('problemList:', document.getElementById('problemList'));
console.log('welcomeScreen:', document.getElementById('welcomeScreen'));
console.log('loadingOverlay:', document.getElementById('loadingOverlay'));

// 检查 VSCode API
console.log('vscode API:', typeof acquireVsCodeApi);
```

### 步骤 5: 测试扩展通信
在 `Console` 中测试消息通信：
```javascript
// 手动发送消息到扩展
const vscode = acquireVsCodeApi();
vscode.postMessage({
    command: 'loadProblems'
});
```

---

## 🛠️ 修复方案

### 方案 1: 增强错误处理

在 main.js 中添加更详细的错误处理和调试信息：

```javascript
// 增强的初始化函数
function init() {
    console.log('🚀 Prompt Pilot WebView 正在初始化...');
    
    try {
        // 验证关键 DOM 元素
        const requiredElements = [
            'problemList', 'problemDetails', 'welcomeScreen', 
            'loadingOverlay', 'errorMessage'
        ];
        
        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`关键 DOM 元素未找到: ${elementId}`);
            }
            console.log(`✅ 找到元素: ${elementId}`);
        }
        
        setupEventListeners();
        loadProblems();
        console.log('🎉 初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showError(`初始化失败: ${error.message}`);
    }
}
```

### 方案 2: 放宽 CSP 配置

修改 WebView 的内容安全策略：

```typescript
// 在 PromptPilotPanel.ts 中修改 CSP
const csp = `default-src 'none'; 
             style-src ${webview.cspSource} 'unsafe-inline'; 
             script-src 'nonce-${nonce}' 'unsafe-eval';
             img-src ${webview.cspSource} data:;`;
```

### 方案 3: 简化资源加载

创建内联样式和脚本以避免资源加载问题：

```typescript
// 将关键 CSS 内联到 HTML 中
const inlineStyles = `
<style>
    .loading { text-align: center; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    /* 其他关键样式 */
</style>
`;
```

---

## 🧪 测试验证清单

### 基础功能测试 ✓/✗
- [ ] WebView 面板能够打开
- [ ] 页面不显示空白或加载状态
- [ ] 控制台无 JavaScript 错误
- [ ] 所有资源文件正常加载

### 界面元素测试 ✓/✗
- [ ] 标题和描述正确显示
- [ ] 欢迎界面正常渲染
- [ ] 侧边栏题目列表显示
- [ ] 按钮和输入框可交互

### 功能交互测试 ✓/✗
- [ ] 题目列表加载完成
- [ ] 点击题目能够切换内容
- [ ] 错误消息能够正常显示
- [ ] 加载动画能够正常隐藏

### 通信测试 ✓/✗
- [ ] WebView 能够接收扩展消息
- [ ] WebView 能够发送消息到扩展
- [ ] 消息处理函数正常工作
- [ ] 数据能够正确传递

---

## 🚑 紧急修复代码

如果需要立即修复，可以使用以下临时代码：

```javascript
// 在 main.js 开头添加全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '页面加载出错: ' + e.error.message;
        errorDiv.style.display = 'block';
    }
});

// 添加资源加载失败处理
window.addEventListener('load', function() {
    console.log('页面加载完成');
    // 检查关键元素是否存在
    const problemList = document.getElementById('problemList');
    if (problemList && problemList.innerHTML.includes('加载中')) {
        setTimeout(() => {
            if (problemList.innerHTML.includes('加载中')) {
                problemList.innerHTML = '<div class="error">题目加载失败，请刷新重试</div>';
            }
        }, 5000); // 5秒后如果还在加载中就显示错误
    }
});
```

---

## 📋 调试检查表

### 环境检查 ✓/✗
- [ ] VSCode 版本 >= 1.103.0
- [ ] Node.js 环境正常
- [ ] 插件代码已编译 (`npm run compile`)
- [ ] 媒体文件存在且完整

### 配置检查 ✓/✗
- [ ] package.json 配置正确
- [ ] WebView 权限设置合理
- [ ] 文件路径映射正确
- [ ] CSP 策略不过于严格

### 代码检查 ✓/✗
- [ ] HTML 结构完整
- [ ] JavaScript 语法正确
- [ ] 事件监听器正确绑定
- [ ] 错误处理机制完善

### 调试技巧 ✓/✗
- [ ] 使用 console.log 追踪执行流程
- [ ] 利用开发者工具检查网络请求
- [ ] 在关键位置设置断点
- [ ] 验证数据传递的完整性

---

## 🎯 解决优先级

1. **高优先级**: 修复 JavaScript 初始化错误
2. **中优先级**: 优化资源加载和错误处理
3. **低优先级**: 改进用户体验和性能

按照此调试指南逐步排查，通常能够快速定位和解决 WebView 加载问题！