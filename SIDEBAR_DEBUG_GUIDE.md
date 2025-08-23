# Prompt Pilot 侧边栏功能调试指南

## 🎯 新功能概述

经过配置更新，Prompt Pilot 现在具有独立的侧边栏视图，包含：

### 1. 独立活动栏图标 🚀
- 左侧活动栏显示火箭图标
- 点击后展开专属的 Prompt Pilot 侧边栏
- 不再依赖于"资源管理器"下的嵌套视图

### 2. 两个主要视图
- **题目列表**：显示所有可用的编程题目
- **快速操作**：提供常用功能的快捷入口

### 3. 右键菜单功能
- 题目项支持右键菜单
- 内联按钮支持快速操作

---

## 🔧 准备工作

### 1. 确保环境就绪
```bash
# 检查当前目录
pwd
# 应该显示: d:\githome\aiapp\prompt-pilot

# 确保依赖已安装
npm install

# 编译最新代码
npm run compile
```

### 2. 配置检查
- ✅ package.json 已更新 viewsContainers 配置
- ✅ extension.ts 已添加 QuickActionsProvider
- ✅ ProblemExplorer.ts 已添加 contextValue
- ✅ 菜单配置已添加到 contributes.menus

---

## 🚀 调试步骤

### 步骤 1: 启动调试环境
1. 在 VSCode 中确认打开 `d:\githome\aiapp\prompt-pilot` 目录
2. 按 **F5** 启动调试模式
3. 等待 "Extension Development Host" 窗口打开

### 步骤 2: 验证活动栏图标
在 Extension Development Host 窗口中：

**期望结果：**
- [ ] 左侧活动栏显示火箭图标 🚀
- [ ] 图标位置在文件资源管理器之后
- [ ] 鼠标悬停显示 "Prompt Pilot" 提示

**如果图标未显示：**
1. 检查 package.json 中 viewsContainers 配置
2. 确认插件已正确激活（查看调试控制台）
3. 重新编译并重启调试会话

### 步骤 3: 验证侧边栏视图
点击火箭图标后：

**期望结果：**
- [ ] 侧边栏打开并显示 Prompt Pilot 内容
- [ ] 顶部显示 "题目列表" 视图
- [ ] 下方显示 "快速操作" 视图
- [ ] 题目列表中显示编程题目（如：两数之和）

**如果侧边栏为空或显示错误：**
1. 检查 extension.ts 中树视图注册代码
2. 查看调试控制台是否有错误信息
3. 确认 data/problems 目录中有题目文件

### 步骤 4: 验证题目列表功能
在 "题目列表" 视图中：

**期望结果：**
- [ ] 显示题目名称和难度标识
- [ ] Easy 题目显示绿色圆圈图标
- [ ] 点击题目可以打开主面板
- [ ] 右上角有刷新按钮 🔄

**功能测试：**
1. 点击题目项 → 应该打开主 WebView 面板
2. 点击刷新按钮 → 应该显示 "题目列表已刷新" 消息
3. 右键点击题目 → 应该显示上下文菜单

### 步骤 5: 验证快速操作视图
在 "快速操作" 视图中：

**期望结果：**
- [ ] 显示三个快速操作项：
  - 🚀 打开主面板
  - 🎯 选择题目  
  - 🏆 TOP3 Prompts
- [ ] 点击各项应该执行对应命令

**功能测试：**
1. 点击 "🚀 打开主面板" → 打开 WebView 面板
2. 点击 "🎯 选择题目" → 显示题目选择列表
3. 点击 "🏆 TOP3 Prompts" → 显示题目选择列表

### 步骤 6: 验证菜单功能
右键点击题目列表中的题目：

**期望结果：**
- [ ] 显示内联菜单按钮
- [ ] 菜单包含 "打开主面板" 和 "查看TOP3 Prompts" 选项
- [ ] 点击菜单项执行对应功能

---

## 🔍 故障排除

### 问题 1: 活动栏图标不显示
**可能原因：**
- 插件未正确激活
- viewsContainers 配置错误

**解决方案：**
```bash
# 重新编译
npm run compile

# 检查调试控制台错误信息
# 在原 VSCode 窗口的调试控制台查看
```

### 问题 2: 侧边栏显示为空
**可能原因：**
- 树视图提供器注册失败
- 数据加载问题

**解决方案：**
1. 检查 extension.ts 中的 createTreeView 调用
2. 确认 ProblemExplorer 正确初始化
3. 查看 data/problems 目录是否存在

### 问题 3: 快速操作视图不显示
**可能原因：**
- QuickActionsProvider 注册失败
- 视图配置错误

**解决方案：**
1. 检查 extension.ts 中 QuickActionsProvider 类定义
2. 确认 promptPilotActions 视图正确注册
3. 重启调试会话

### 问题 4: 右键菜单不工作
**可能原因：**
- contextValue 未设置
- 菜单配置错误

**解决方案：**
1. 确认 ProblemItem 设置了 contextValue = 'problem'
2. 检查 package.json 中 menus 配置
3. 验证 when 条件是否正确

---

## 📋 功能验证清单

### 基础功能 ✓/✗
- [ ] 活动栏显示火箭图标
- [ ] 点击图标打开侧边栏
- [ ] 题目列表视图正常显示
- [ ] 快速操作视图正常显示

### 交互功能 ✓/✗
- [ ] 点击题目打开主面板
- [ ] 刷新按钮工作正常
- [ ] 快速操作项响应点击
- [ ] 右键菜单正常显示

### 视觉效果 ✓/✗
- [ ] 难度图标颜色正确（绿/黄/红）
- [ ] 工具提示信息显示
- [ ] 侧边栏布局合理
- [ ] 图标和文本对齐

### 命令功能 ✓/✗
- [ ] prompt-pilot.openPanel 工作
- [ ] prompt-pilot.selectProblem 工作
- [ ] prompt-pilot.viewTopPrompts 工作
- [ ] prompt-pilot.refreshProblems 工作

---

## 🎯 API密钥配置

要完整测试所有功能，需要配置 API 密钥：

### 在 Extension Development Host 窗口中：
1. 打开设置 (`Ctrl+,`)
2. 搜索 "Prompt Pilot"
3. 配置以下参数：
   ```json
   {
     "promptPilot.apiKey": "your-openai-api-key",
     "promptPilot.apiEndpoint": "https://api.openai.com/v1/chat/completions",
     "promptPilot.model": "gpt-3.5-turbo"
   }
   ```

---

## 🔄 调试技巧

### 查看日志
- **扩展日志**：在原 VSCode 窗口的调试控制台
- **WebView 日志**：在 Extension Development Host 中按 F12

### 重新加载
- **重载扩展**：在 Extension Development Host 中按 `Ctrl+R`
- **重启调试**：停止调试会话并重新按 F5

### 检查配置
```bash
# 验证 package.json 语法
npm run compile

# 检查文件结构
ls -la data/problems/
```

---

## 🎉 成功标志

当以下所有项目都正常工作时，侧边栏功能就完全成功了：

1. ✅ 独立的活动栏图标
2. ✅ 完整的侧边栏视图
3. ✅ 题目列表正常显示和交互
4. ✅ 快速操作响应正确
5. ✅ 右键菜单功能完整
6. ✅ 所有命令正确执行
7. ✅ WebView 面板正常打开
8. ✅ API 调用和代码生成工作（需要 API 密钥）

恭喜！您的 Prompt Pilot 插件现在具有完整的侧边栏功能！🎊