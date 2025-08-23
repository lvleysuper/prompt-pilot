# Prompt Pilot 安装和使用指南

## 📦 安装步骤

### 方式一：开发模式安装（推荐用于测试）

1. **环境准备**
   ```bash
   # 确保已安装Node.js (v14+)
   node --version
   
   # 确保已安装npm
   npm --version
   ```

2. **克隆并安装**
   ```bash
   # 进入工作目录
   cd d:\\githome\\aiapp\\prompt-pilot
   
   # 安装依赖
   npm install
   
   # 编译插件
   npm run compile
   ```

3. **在VSCode中调试**
   - 使用VSCode打开 `prompt-pilot` 目录
   - 按 `F5` 启动调试模式
   - 在新弹出的VSCode窗口中测试插件

### 方式二：打包安装

1. **打包插件**
   ```bash
   # 安装vsce工具
   npm install -g vsce
   
   # 打包插件
   vsce package
   ```

2. **安装插件**
   ```bash
   # 安装生成的.vsix文件
   code --install-extension prompt-pilot-0.0.1.vsix
   ```

## ⚙️ 配置设置

### 1. API配置

在VSCode设置中添加以下配置：

**文件位置**：`.vscode/settings.json` 或全局设置

```json
{
  \"promptPilot.apiKey\": \"your-openai-api-key\",
  \"promptPilot.apiEndpoint\": \"https://api.openai.com/v1/chat/completions\",
  \"promptPilot.model\": \"gpt-3.5-turbo\"
}
```

**支持的API服务**：
- OpenAI GPT (默认)
- Azure OpenAI
- 其他兼容OpenAI格式的API

### 2. 环境配置

**Node.js和TypeScript**：
```bash
# 安装TypeScript编译器
npm install -g typescript

# 安装ts-node用于代码执行
npm install -g ts-node

# 验证安装
node --version
tsc --version
ts-node --version
```

## 🚀 使用教程

### 第一步：启动插件

**方法1：命令面板**
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
2. 输入 \"Prompt Pilot\"
3. 选择 \"打开 Prompt Pilot\"

**方法2：活动栏**
1. 点击活动栏中的火箭图标 🚀
2. 在侧边栏中选择题目

### 第二步：选择练习题目

1. 在侧边栏中浏览可用题目
2. 题目按难度分类：
   - 🟢 **Easy**: 适合初学者
   - 🟡 **Medium**: 中等难度
   - 🔴 **Hard**: 高难度挑战
3. 点击题目名称加载详情

### 第三步：编写Prompt

1. 阅读题目描述和要求
2. 在Prompt输入框中编写指令
3. 参考提示和最佳实践

**优秀Prompt示例**：
```
请实现一个函数来解决两数之和问题。要求：
1) 给定数组和目标值，返回两个数的索引
2) 使用哈希表优化查找，时间复杂度O(n)
3) 处理边界情况（空数组、无解等）
4) 提供清晰的变量命名和注释
```

### 第四步：生成和测试代码

1. **生成代码**：点击\"生成代码\"按钮
2. **预览结果**：查看AI生成的代码和说明
3. **运行测试**：点击\"运行测试\"验证正确性
4. **接受代码**：满意后点击\"接受代码\"导入到新文件

### 第五步：学习优秀Prompt

1. 点击 \"查看TOP3 Prompts\"
2. 学习优秀Prompt的写作结构
3. 查看专家分析和技巧解析
4. 应用到自己的Prompt写作中

## 📊 功能详解

### Prompt质量分析

插件会自动分析您的Prompt质量：
- **评分**：0-100分的质量评分
- **反馈**：详细的改进建议
- **结构分析**：Prompt结构优化建议

### 测试结果解读

- ✅ **通过**：绿色标记，测试成功
- ❌ **失败**：红色标记，显示错误信息
- ⏱️ **执行时间**：代码运行耗时
- 📝 **错误详情**：详细的错误诊断

### 快捷操作

- `Ctrl+Enter`：快速生成代码
- `Esc`：关闭错误提示
- `F5`：刷新题目列表

## 🔧 故障排除

### 常见问题

**1. API调用失败**
```
错误：API错误: 401 - Invalid API key
解决：检查API密钥配置是否正确
```

**2. 代码执行失败**
```
错误：ts-node: command not found
解决：安装TypeScript运行环境
npm install -g ts-node
```

**3. 插件无法启动**
```
错误：Extension activation failed
解决：重新编译插件
npm run compile
```

### 环境检查

运行以下命令检查环境：
```bash
# 检查Node.js
node --version

# 检查TypeScript
tsc --version

# 检查ts-node
ts-node --version

# 测试API连接
curl -H \"Authorization: Bearer your-api-key\" \\nhttps://api.openai.com/v1/models
```

### 调试模式

1. 在VSCode中打开插件项目
2. 按F5启动调试模式
3. 查看调试控制台输出
4. 使用开发者工具调试WebView

## 📈 最佳实践

### Prompt编写技巧

1. **明确目标**：清楚描述要解决的问题
2. **具体要求**：包含性能、边界条件等约束
3. **技术细节**：指定算法、数据结构偏好
4. **代码质量**：要求注释、命名规范等
5. **输出格式**：明确期望的代码格式

### 学习路径

1. **初级**：从Easy题目开始，学习基础Prompt结构
2. **中级**：挑战Medium题目，掌握复杂场景描述
3. **高级**：尝试Hard题目，优化Prompt效果
4. **专家**：分析TOP3 Prompts，总结最佳实践

### 团队协作

1. **分享优秀Prompt**：与团队成员交流经验
2. **建立标准**：制定团队Prompt编写规范
3. **持续改进**：基于反馈优化Prompt质量
4. **知识积累**：建立Prompt知识库

---

**🎉 恭喜！您已准备好开始Prompt技能提升之旅！**

如有问题，请查看README.md或提交Issue获取支持。", "original_text": "# Prompt Pilot 安装和使用指南

## 📦 安装步骤

### 方式一：开发模式安装（推荐用于测试）

1. **环境准备**
   ```bash
   # 确保已安装Node.js (v14+)
   node --version
   
   # 确保已安装npm
   npm --version
   ```

2. **克隆并安装**
   ```bash
   # 进入工作目录
   cd d:\\githome\\aiapp\\prompt-pilot
   
   # 安装依赖
   npm install
   
   # 编译插件
   npm run compile
   ```

3. **在VSCode中调试**
   - 使用VSCode打开 `prompt-pilot` 目录
   - 按 `F5` 启动调试模式
   - 在新弹出的VSCode窗口中测试插件

### 方式二：打包安装

1. **打包插件**
   ```bash
   # 安装vsce工具
   npm install -g vsce
   
   # 打包插件
   vsce package
   ```

2. **安装插件**
   ```bash
   # 安装生成的.vsix文件
   code --install-extension prompt-pilot-0.0.1.vsix
   ```"}]