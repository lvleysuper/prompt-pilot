# 🚀 Prompt Pilot API 配置功能 - 快速测试指南

## 🎯 立即开始测试

### 第一步：重新启动调试
```bash
# 按 F5 重新启动插件调试
# 等待 Extension Development Host 窗口打开
```

### 第二步：验证新功能界面
1. **检查侧边栏**：
   - 点击左侧活动栏的 🚀 Prompt Pilot 图标
   - 在 "快速操作" 区域确认新增了：
     - ⚙️ 配置 API
     - ✅ 验证 API  
     - 📊 API 状态

2. **检查命令面板**：
   - 按 `Ctrl + Shift + P`
   - 输入 "Prompt Pilot"
   - 确认新增了以下命令：
     - `Prompt Pilot: 配置 API 设置`
     - `Prompt Pilot: 验证 API 连接`
     - `Prompt Pilot: 查看 API 状态`

### 第三步：测试配置向导
1. **启动配置向导**：
   - 点击侧边栏的 "⚙️ 配置 API" 按钮
   - 或使用命令 `Prompt Pilot: 配置 API 设置`

2. **选择提供商**：
   - 应该看到两个选项：
     - 🌐 OpenAI（使用OpenAI官方API）
     - ☁️ Azure OpenAI（使用Azure OpenAI服务）

3. **测试 OpenAI 配置**（如果您有 OpenAI API 密钥）：
   - 选择 "OpenAI"
   - 输入您的 API 密钥（sk-...）
   - 观察自动验证过程
   - 应该显示验证成功或失败信息

### 第四步：测试设置页面
1. **打开设置**：
   - 按 `Ctrl + ,` 打开设置
   - 搜索 "prompt-pilot"

2. **验证配置项**：
   确认看到以下配置项：
   ```
   ✅ Prompt-pilot › Openai: Api Key
   ✅ Prompt-pilot › Openai: Model (下拉菜单)
   ✅ Prompt-pilot › Openai: Base Url
   ✅ Prompt-pilot › Openai: Max Tokens
   ✅ Prompt-pilot › Openai: Temperature
   ✅ Prompt-pilot › Azure: Api Key
   ✅ Prompt-pilot › Azure: Endpoint
   ✅ Prompt-pilot › Azure: Deployment Name
   ✅ Prompt-pilot › Azure: Api Version
   ✅ Prompt-pilot › Provider (下拉菜单: openai/azure)
   ✅ Prompt-pilot › Timeout
   ✅ Prompt-pilot › Retry Attempts
   ✅ Prompt-pilot › Enable Debug Logs
   ```

### 第五步：测试状态查看
1. **查看 API 状态**：
   - 点击侧边栏的 "📊 API 状态" 按钮
   - 应该显示详细的配置状态信息

2. **验证信息完整性**：
   - 当前提供商
   - 配置状态（已配置/未配置）
   - 详细的配置信息
   - 操作按钮（打开配置、验证连接）

### 第六步：测试 API 验证
1. **执行验证**：
   - 点击 "✅ 验证 API" 按钮
   - 观察进度条显示

2. **验证结果**：
   - **有效配置**：应显示成功消息和详细信息
   - **无效配置**：应显示错误信息和解决建议

### 第七步：测试集成功能
1. **测试代码生成**：
   - 打开主面板，选择题目
   - 输入 Prompt，点击 "生成代码"
   - **有 API 配置**：应该调用真实 AI 服务
   - **无 API 配置**：应该显示模拟结果

2. **验证模式切换**：
   - 观察生成结果中的模式标识
   - 真实模式：不显示模拟标识
   - 模拟模式：显示 "🧪 模拟模式响应"

## ⚡ 快速验证清单

### ✅ 基础功能验证（5分钟）
- [ ] 侧边栏显示新的 API 相关按钮
- [ ] 命令面板包含新的 API 命令
- [ ] 设置页面显示所有配置项
- [ ] 配置向导可以正常启动

### ✅ 配置功能验证（10分钟）
- [ ] 可以选择 OpenAI 或 Azure 提供商
- [ ] 配置向导有输入验证
- [ ] 配置可以正确保存
- [ ] API 状态查看功能正常

### ✅ 验证功能测试（5分钟）
- [ ] API 验证命令可以执行
- [ ] 显示验证进度条
- [ ] 验证结果有详细反馈
- [ ] 错误处理有合理建议

### ✅ 集成功能测试（10分钟）
- [ ] LLM 服务模式正确切换
- [ ] WebView 界面正确显示模式
- [ ] 代码生成功能正常工作
- [ ] 模拟模式降级机制有效

## 🐛 常见问题解决

### 问题1：侧边栏按钮不显示
**解决方案**：
- 重新编译：`npm run compile`
- 重新启动调试：按 `F5`
- 检查是否在正确的视图中

### 问题2：命令无法执行
**解决方案**：
- 检查调试控制台错误信息
- 确认插件正确激活
- 重新加载扩展开发宿主窗口

### 问题3：配置不生效
**解决方案**：
- 检查配置是否保存成功
- 重新启动插件
- 手动刷新配置状态

### 问题4：API 验证失败
**检查事项**：
- API 密钥格式是否正确
- 网络连接是否正常
- 查看输出面板的详细日志

## 📊 预期结果

### 成功指标
- ✅ 所有新增按钮和命令都可用
- ✅ 配置向导引导流程顺畅
- ✅ API 验证提供准确反馈
- ✅ 模式切换自动且正确
- ✅ 错误处理友好且有用

### 性能表现
- ⚡ 配置页面打开 < 2秒
- ⚡ API 验证完成 < 5秒
- ⚡ 状态查询响应 < 1秒
- ⚡ 模式切换即时生效

---

**🎉 如果以上测试都通过，说明 API 配置功能已成功实现！**

现在您可以：
1. 配置真实的 AI 服务提供商
2. 享受真实的 AI 代码生成
3. 获得准确的 Prompt 分析
4. 随时监控 API 连接状态