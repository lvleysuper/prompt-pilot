# Prompt Pilot API 配置指南

## 🔑 API 密钥配置

### 支持的 AI 服务

#### 1. OpenAI API（推荐）
**配置步骤**：
1. 获取 OpenAI API 密钥：
   - 访问 [OpenAI Platform](https://platform.openai.com/)
   - 注册/登录账户
   - 创建 API 密钥

2. 在 VSCode 中配置：
   - 按 `Ctrl + Shift + P` 打开命令面板
   - 输入 "Preferences: Open Settings (JSON)"
   - 添加以下配置：

```json
{
    "prompt-pilot.openai.apiKey": "sk-your-openai-api-key-here",
    "prompt-pilot.openai.model": "gpt-3.5-turbo",
    "prompt-pilot.openai.baseUrl": "https://api.openai.com"
}
```

#### 2. Azure OpenAI
**配置步骤**：
```json
{
    "prompt-pilot.azure.apiKey": "your-azure-api-key",
    "prompt-pilot.azure.endpoint": "https://your-resource.openai.azure.com",
    "prompt-pilot.azure.deploymentName": "your-deployment-name",
    "prompt-pilot.azure.apiVersion": "2023-12-01-preview"
}
```

#### 3. 其他兼容 OpenAI 的服务
```json
{
    "prompt-pilot.openai.apiKey": "your-api-key",
    "prompt-pilot.openai.model": "gpt-3.5-turbo",
    "prompt-pilot.openai.baseUrl": "https://your-service-endpoint.com"
}
```

## 🚀 快速配置（开发测试）

如果您想快速测试功能，可以使用以下默认配置：

### 方法1：通过VSCode设置界面
1. 按 `Ctrl + ,` 打开设置
2. 搜索 "prompt-pilot"
3. 在 "Openai: Api Key" 字段中输入您的API密钥

### 方法2：通过命令面板
1. 按 `Ctrl + Shift + P`
2. 输入 "Prompt Pilot: Configure API Key"
3. 按照提示输入密钥

### 方法3：手动编辑配置文件
打开用户设置文件（settings.json）并添加：
```json
{
    "prompt-pilot.openai.apiKey": "sk-your-key-here"
}
```

## ✅ 配置验证清单

### 基础验证
- [ ] API密钥已正确配置
- [ ] 模型名称正确（如 gpt-3.5-turbo）
- [ ] 基础URL正确（如使用自定义服务）
- [ ] 网络连接正常

### 功能验证
- [ ] 插件可以连接到AI服务
- [ ] 可以生成代码
- [ ] 可以分析Prompt
- [ ] 错误信息清晰可读

## 🧪 测试步骤

1. **重新启动插件**：
   - 配置完成后，按 `F5` 重启调试
   - 或重新加载Extension Development Host窗口

2. **测试基础连接**：
   - 打开Prompt Pilot主面板
   - 选择一个题目
   - 输入简单的Prompt，如："请帮我解决这个问题"
   - 点击"生成代码"按钮

3. **检查响应**：
   - 应该看到"正在生成代码..."的加载提示
   - 几秒后应该显示生成的代码
   - 如果失败，会显示具体错误信息

## 🛠️ 故障排除

### 常见错误1：API密钥无效
**错误信息**：`Invalid API key` 或 `Unauthorized`
**解决方案**：
- 检查API密钥是否正确复制
- 确认API密钥有效且未过期
- 检查账户余额是否充足

### 常见错误2：网络连接问题
**错误信息**：`Network error` 或 `ECONNREFUSED`
**解决方案**：
- 检查网络连接
- 确认防火墙设置
- 检查代理配置

### 常见错误3：模型不存在
**错误信息**：`Model not found`
**解决方案**：
- 检查模型名称是否正确
- 确认您的账户有权访问该模型
- 尝试使用 `gpt-3.5-turbo` 作为默认模型

### 常见错误4：配额超限
**错误信息**：`Rate limit exceeded` 或 `Quota exceeded`
**解决方案**：
- 等待一段时间后重试
- 检查API使用配额
- 考虑升级账户计划

## 📊 配置文件示例

### 完整配置示例
```json
{
    // OpenAI 配置
    "prompt-pilot.openai.apiKey": "sk-your-openai-key",
    "prompt-pilot.openai.model": "gpt-3.5-turbo",
    "prompt-pilot.openai.baseUrl": "https://api.openai.com",
    "prompt-pilot.openai.maxTokens": 2048,
    "prompt-pilot.openai.temperature": 0.7,

    // Azure OpenAI 配置（可选）
    "prompt-pilot.azure.apiKey": "your-azure-key",
    "prompt-pilot.azure.endpoint": "https://your-resource.openai.azure.com",
    "prompt-pilot.azure.deploymentName": "gpt-35-turbo",
    "prompt-pilot.azure.apiVersion": "2023-12-01-preview",

    // 通用设置
    "prompt-pilot.preferredProvider": "openai", // 或 "azure"
    "prompt-pilot.timeout": 30000,
    "prompt-pilot.retryAttempts": 3
}
```

### 最小配置（仅OpenAI）
```json
{
    "prompt-pilot.openai.apiKey": "sk-your-api-key-here"
}
```

## 🔄 重新测试流程

配置完成后，按以下顺序重新测试：

1. **保存配置**：确保设置已保存
2. **重启调试**：按 `F5` 重新启动插件
3. **打开主面板**：点击侧边栏的Prompt Pilot图标
4. **选择题目**：从题目列表中选择一个
5. **测试生成**：
   - 输入Prompt：`请用TypeScript解决这个问题，要求代码简洁易读`
   - 点击"生成代码"
   - 观察是否正常生成代码

## 📝 调试日志解读

### 成功连接的日志
```
处理WebView消息: generateCode
正在生成代码...
API请求成功
代码生成完成
```

### 连接失败的日志
```
处理WebView消息: generateCode
API请求失败: [具体错误信息]
```

## 🎯 下一步计划

API配置完成并验证成功后，您可以：
1. 测试所有核心功能（生成代码、分析Prompt、运行测试）
2. 尝试不同类型的Prompt
3. 查看TOP3优秀Prompt示例
4. 完善插件的其他功能

---

**💡 提示**：如果您暂时没有API密钥，我可以帮您设置一个模拟模式，这样可以测试插件的其他功能而不需要真实的API调用。