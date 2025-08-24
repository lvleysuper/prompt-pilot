# 🔍 VSCode插件错误信息查看详细指南

## 🎯 目标
帮助您快速定位和查看Prompt Pilot插件中的具体错误信息，包括WebView加载问题、JavaScript执行错误和扩展通信错误。

---

## 📍 错误信息查看位置

### 1. WebView前端错误（最重要）

**步骤：**
1. 在 Extension Development Host 窗口中，按 **`F12`** 打开开发者工具
2. 点击 **`Console`** 标签页
3. 查看红色错误信息和警告

**预期看到的调试信息：**
```
🎉 页面加载完成
🚀 Prompt Pilot WebView 正在初始化...
✅ 找到元素: problemList
✅ 找到元素: problemDetails
✅ 找到元素: welcomeScreen
...
🎉 初始化完成
```

**常见错误类型：**
- `❌ 初始化失败: Cannot read property 'addEventListener' of null`
- `⚠️ 元素未找到: problemList`
- `❌ 全局错误: ReferenceError: xxx is not defined`

### 2. 扩展后端错误

**步骤：**
1. 在**原VSCode窗口**（不是Extension Development Host）
2. 打开 **`查看` → `输出`** 面板
3. 在下拉菜单中选择 **`扩展开发宿主`**
4. 查看扩展激活和运行时的错误信息

**或者使用调试控制台：**
1. 在原VSCode窗口按 **`Ctrl+Shift+Y`** 打开调试控制台
2. 查看扩展相关的错误和日志

### 3. 网络资源加载错误

**步骤：**
1. 在Extension Development Host窗口按 `F12`
2. 切换到 **`Network`** 标签页
3. 刷新页面（`Ctrl+R`）
4. 查看是否有红色的失败请求

**检查项目：**
- main.js - JavaScript文件
- main.css - 主样式文件
- reset.css - 重置样式
- vscode.css - VSCode主题样式

---

## 🔧 具体查看步骤

### 步骤1: 启动调试并打开开发者工具

1. **启动插件调试**
   ```bash
   # 确保在正确目录
   cd d:\githome\aiapp\prompt-pilot
   
   # 编译代码
   npm run compile
   
   # 按F5启动调试
   ```

2. **在Extension Development Host窗口中**
   - 按 `F12` 打开开发者工具
   - 点击Console标签页
   - **重要：保持开发者工具打开状态**

### 步骤2: 触发插件功能并观察错误

1. **方式1：通过侧边栏**
   - 点击左侧活动栏的火箭图标 🚀
   - 观察控制台输出

2. **方式2：通过命令面板**
   - 按 `Ctrl+Shift+P`
   - 输入 "Prompt Pilot"
   - 选择 "打开 Prompt Pilot"
   - 观察控制台输出

3. **方式3：通过快速操作**
   - 在侧边栏点击 "🚀 打开主面板"
   - 观察控制台输出

### 步骤3: 收集完整错误信息

**在Console中查看：**
- 红色错误信息（Error）
- 黄色警告信息（Warning）
- 蓝色信息日志（Info）

**复制完整错误信息：**
1. 右键点击错误信息
2. 选择 "Copy message" 或 "Copy stack trace"
3. 粘贴到文本编辑器中保存

---

## 🎯 关键检查命令

### 在开发者工具Console中手动执行：

```javascript
// 1. 检查页面基础状态
console.log('页面就绪状态:', document.readyState);
console.log('页面标题:', document.title);

// 2. 检查关键DOM元素
console.log('problemList元素:', document.getElementById('problemList'));
console.log('welcomeScreen元素:', document.getElementById('welcomeScreen'));
console.log('loadingOverlay元素:', document.getElementById('loadingOverlay'));
console.log('errorMessage元素:', document.getElementById('errorMessage'));

// 3. 检查VSCode API
console.log('VSCode API可用:', typeof acquireVsCodeApi);

// 4. 手动测试扩展通信
try {
    const vscode = acquireVsCodeApi();
    console.log('VSCode API已获取:', vscode);
    vscode.postMessage({ command: 'loadProblems' });
    console.log('已发送loadProblems消息');
} catch (error) {
    console.error('VSCode API调用失败:', error);
}

// 5. 检查样式加载
console.log('computed styles:', getComputedStyle(document.body));
```

### 在原VSCode调试控制台中查看：

```javascript
// 查看扩展激活状态
console.log('扩展激活状态');

// 查看问题数据加载
console.log('问题数据:', problemExplorer.getProblems());
```

---

## 📋 错误信息分类与解决方案

### 🔴 JavaScript执行错误

**错误特征：**
```
❌ 全局错误: TypeError: Cannot read property 'addEventListener' of null
❌ 初始化失败: ReferenceError: xxx is not defined
```

**解决步骤：**
1. 确认所有DOM元素是否正确加载
2. 检查元素ID拼写是否正确
3. 验证JavaScript语法是否有误

### 🟡 资源加载错误

**错误特征：**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
Refused to load the stylesheet because it violates the CSP
```

**解决步骤：**
1. 检查Network标签页中失败的请求
2. 验证文件路径是否正确
3. 检查CSP配置是否过于严格

### 🟠 扩展通信错误

**错误特征：**
```
WebView消息发送失败
扩展命令未注册
```

**解决步骤：**
1. 检查扩展是否正确激活
2. 验证消息处理器是否正确注册
3. 确认命令ID是否匹配

### 🔵 数据加载错误

**错误特征：**
```
问题数据加载失败
API调用超时
```

**解决步骤：**
1. 检查data/problems目录是否存在
2. 验证JSON文件格式是否正确
3. 确认网络连接是否正常

---

## 🚑 紧急调试技巧

### 1. 强制显示界面（绕过加载问题）

```javascript
// 在Console中执行
const loadingOverlay = document.getElementById('loadingOverlay');
if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
}

const welcomeScreen = document.getElementById('welcomeScreen');
if (welcomeScreen) {
    welcomeScreen.style.display = 'block';
}

console.log('强制显示界面完成');
```

### 2. 手动触发初始化

```javascript
// 如果自动初始化失败，手动执行
if (typeof init === 'function') {
    init();
} else {
    console.error('init函数未定义');
}
```

### 3. 检查全局变量

```javascript
// 查看全局作用域中的变量
console.log('window对象:', Object.keys(window));
console.log('全局函数:', Object.getOwnPropertyNames(window).filter(name => typeof window[name] === 'function'));
```

---

## 📊 错误信息收集清单

收集以下信息有助于快速定位问题：

### ✅ 基础信息
- [ ] VSCode版本：`Help → About`
- [ ] Node.js版本：`node --version`
- [ ] 插件编译状态：`npm run compile`输出

### ✅ 错误信息
- [ ] Console中的完整错误堆栈
- [ ] Network标签页中的失败请求
- [ ] 调试控制台中的扩展错误
- [ ] 具体的错误复现步骤

### ✅ 环境状态
- [ ] 开发者工具是否正常打开
- [ ] 插件是否出现在侧边栏
- [ ] 命令面板中是否有插件命令
- [ ] WebView窗口是否能正常打开

---

## 🎯 预期正常输出示例

**成功的Console输出应该包含：**
```
🎉 页面加载完成
🚀 Prompt Pilot WebView 正在初始化...
✅ 找到元素: problemList
✅ 找到元素: problemDetails  
✅ 找到元素: welcomeScreen
✅ 找到元素: loadingOverlay
✅ 找到元素: errorMessage
...
设置事件监听器...
✅ analyzePromptBtn 事件监听器已设置
✅ generateCodeBtn 事件监听器已设置
✅ 扩展消息监听器已设置
🎉 初始化完成
```

---

## 📞 获取帮助

如果按照以上步骤仍无法解决问题，请提供：

1. **完整的Console错误信息**（包括堆栈跟踪）
2. **Network标签页的截图**（显示资源加载状态）
3. **具体的操作步骤**（如何触发的错误）
4. **环境信息**（VSCode版本、操作系统等）

这样可以更快速地定位和解决问题！🔧