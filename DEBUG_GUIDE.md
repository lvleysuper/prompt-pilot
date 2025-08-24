# Prompt Pilot VSCode 插件调试指南

## 📋 准备工作清单

### 1. 环境检查
- [ ] VSCode版本 >= 1.103.0
- [ ] Node.js版本 >= 14.x
- [ ] npm或yarn已安装
- [ ] Git已安装（可选）

### 2. 项目状态检查
- [ ] 项目目录: `d:\githome\aiapp\prompt-pilot`
- [ ] 依赖已安装: `npm install`
- [ ] 代码已编译: `npm run compile`
- [ ] 无编译错误

## 🚀 调试步骤

### 步骤1: 启动调试模式
1. 在VSCode中打开插件项目目录
2. 按 `F5` 启动调试模式
3. 等待Extension Development Host窗口打开

### 步骤2: 激活插件
1. 在Extension Development Host窗口中，点击左侧活动栏的 🚀 Prompt Pilot 图标
2. 观察是否出现侧边栏视图
3. 检查是否显示"题目列表"和"快速操作"两个子视图

### 步骤3: 测试主面板
1. 点击"打开主面板"按钮
2. 观察页面左上角是否出现蓝色调试信息提示
3. 检查WebView是否正常加载

### 步骤4: 开发者工具调试
如果需要查看WebView详细错误：

**方法A: 菜单方式**
- 在Extension Development Host窗口中
- 点击 **帮助** → **切换开发人员工具**

**方法B: 快捷键方式**
- 使用 `Ctrl + Shift + I`
- 或按 `F1` 输入 "Toggle Developer Tools"

**方法C: 备用调试页面**
- 直接在浏览器中打开: `d:\githome\aiapp\prompt-pilot\debug-webview.html`

## 🔑 API密钥配置

### OpenAI API配置
1. 在VSCode中按 `Ctrl + Shift + P`
2. 输入 "Preferences: Open Settings (JSON)"
3. 添加以下配置：
```json
{
    "prompt-pilot.openai.apiKey": "你的OpenAI API密钥",
    "prompt-pilot.openai.model": "gpt-3.5-turbo",
    "prompt-pilot.openai.baseUrl": "https://api.openai.com"
}
```

### Azure OpenAI配置
```json
{
    "prompt-pilot.azure.apiKey": "你的Azure API密钥",
    "prompt-pilot.azure.endpoint": "https://your-resource.openai.azure.com",
    "prompt-pilot.azure.deploymentName": "your-deployment-name"
}
```

## ✅ 功能验证清单

### 基础功能验证
- [ ] 左侧活动栏显示Prompt Pilot图标
- [ ] 侧边栏显示题目列表
- [ ] 侧边栏显示快速操作菜单
- [ ] 主面板可以正常打开
- [ ] WebView调试信息正常显示
- [ ] API密钥配置状态正确显示（真实模式/模拟模式）

### 题目管理验证
- [ ] 题目列表可以正常显示
- [ ] 点击题目可以切换选中状态
- [ ] 题目详情可以正常加载
- [ ] 难度标签颜色正确显示

### Prompt功能验证（模拟模式）
- [ ] Prompt输入框可以正常输入
- [ ] 生成代码按钮状态正确更新
- [ ] 分析Prompt按钮功能正常
- [ ] 模拟模式提示正常显示

### 代码生成验证（模拟模式）
- [ ] 输入Prompt后可以生成示例代码
- [ ] 生成的代码格式正确
- [ ] 代码说明正常显示
- [ ] 模拟模式标识清晰可见
- [ ] 接受代码功能正常

### 测试功能验证
- [ ] 运行测试按钮可以点击
- [ ] 测试结果正确显示
- [ ] 通过/失败状态正确标识
- [ ] 错误信息详细显示

## 🐛 故障排除指南

### 常见问题1: WebView加载失败
**症状**: 点击"打开主面板"后一直显示加载状态

**排查步骤**:
1. 检查浏览器控制台是否有JavaScript错误
2. 查看VSCode输出面板的"扩展开发宿主"日志
3. 确认main.js文件是否正确加载
4. 检查CSP(内容安全策略)设置

**解决方案**:
- 重新编译: `npm run compile`
- 重启调试: 关闭Extension Development Host，重新按F5
- 检查WebView HTML结构是否完整

### 常见问题2: 开发者工具无法打开
**症状**: 按F12没有反应

**解决方案**:
1. 使用菜单: 帮助 → 切换开发人员工具
2. 使用快捷键: `Ctrl + Shift + I`
3. 使用命令面板: `F1` → "Toggle Developer Tools"
4. 使用备用调试页面进行调试

### 常见问题3: API调用失败
**症状**: 生成代码或分析Prompt时出错

**排查步骤**:
1. 检查API密钥是否正确配置
2. 确认网络连接是否正常
3. 查看API调用日志
4. 检查API配额是否用完

### 常见问题4: WebView状态检查
**症状**: 控制台显示 "webview not ready"

**排查步骤**:
1. 检查WebView面板是否正常创建
2. 查看是否有初始化确认消息
3. 确认前端与后端通信正常

**解决方案**:
- 检查日志中是否有 "WebView 已就绪" 信息
- 确认有 "📤 发送初始化确认给扩展" 日志
- 如果没有，重新编译和重启调试

### 常见问题4: 题目列表为空
**症状**: 侧边栏题目列表不显示内容

**排查步骤**:
1. 检查ProblemExplorer服务是否正常初始化
2. 查看题目数据加载日志
3. 确认示例数据是否正确创建

## 📊 调试信息解读

### 控制台日志类型
- `🚀` - 初始化相关
- `✅` - 成功操作
- `⚠️` - 警告信息
- `❌` - 错误信息
- `🔍` - 调试信息

### 重要日志示例
```
🚀 Prompt Pilot WebView 正在初始化...
✅ 找到元素: problemList
✅ 找到元素: problemDetails
✅ generateCodeBtn 事件监听器已设置
WebView 面板创建中...
WebView 已就绪
📤 发送初始化确认给扩展
📨 收到扩展消息: webviewReady
🎉 WebView 已就绪，发送初始化确认
🎉 初始化完成
```

### 错误日志解读
- "元素未找到" - DOM结构可能有问题
- "初始化失败" - JavaScript执行错误
- "API调用失败" - 网络或配置问题

## 🔄 重新启动调试流程

如果遇到问题需要重新开始：

1. **关闭所有相关窗口**
   - Extension Development Host窗口
   - 开发者工具窗口

2. **重新编译**
   ```bash
   cd "d:\githome\aiapp\prompt-pilot"
   npm run compile
   ```

3. **重新启动调试**
   - 按 `F5` 重新启动
   - 等待新的Extension Development Host窗口打开

4. **验证基础功能**
   - 检查左侧图标是否显示
   - 测试主面板是否正常打开

## 📝 调试日志记录

建议在调试过程中记录以下信息：
- 操作步骤
- 出现的错误信息
- 控制台日志输出
- 解决方案和效果

这有助于快速定位和解决类似问题。