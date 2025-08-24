# 🚀 集成配置面板调试指南

## 📋 问题分析

### 当前错误
```
Error: 无法读取文件'\d%3A\githome\aiapp\prompt-pilot\src\webview\PromptPilotPanel.ts' 
(Error: 无法解析不存在的文件 '\d%3A\githome\aiapp\prompt-pilot\src\webview\PromptPilotPanel.ts')
```

### 错误原因
- 文件路径被URL编码：`\d%3A\` 实际应该是 `d:\`
- 可能是VSCode内部路径解析问题或编译缓存问题
- WebView资源加载时的路径转换错误

## 🔧 快速修复步骤

### 1. 立即修复方案（2分钟）
```bash
# 切换到项目目录
cd /d/githome/aiapp/prompt-pilot

# 清理编译缓存
rm -rf out/
rm -rf node_modules/.cache/

# 重新编译
npm run compile

# 如果编译失败，尝试清理node_modules
rm -rf node_modules/
npm install
npm run compile
```

### 2. VSCode重启方案（1分钟）
1. 关闭所有VSCode窗口
2. 重新打开VSCode
3. 打开插件项目目录
4. 按F5启动调试

### 3. 路径检查方案（3分钟）
检查以下文件中的路径引用：
- `webpack.config.js` - 输出路径配置
- `package.json` - 脚本路径
- `.vscodeignore` - 忽略文件路径

## 🏗️ 完整调试准备工作

### 步骤1：环境检查
```bash
# 检查Node.js版本
node --version  # 建议 >= 16.0.0

# 检查npm版本
npm --version

# 检查项目依赖
npm ls --depth=0
```

### 步骤2：项目结构验证
确认以下文件存在且路径正确：
```
prompt-pilot/
├── src/
│   ├── extension.ts ✅
│   ├── webview/
│   │   └── PromptPilotPanel.ts ✅
│   └── services/
│       └── APIConfigService.ts ✅
├── media/
│   ├── main.js ✅
│   └── main.css ✅
├── package.json ✅
└── webpack.config.js ✅
```

### 步骤3：编译验证
```bash
# 清理并重新编译
npm run compile

# 检查编译输出
ls -la out/

# 预期看到：extension.js 文件
```

## 🐛 VSCode调试步骤

### 调试运行步骤
1. **打开项目**：在VSCode中打开 `d:\githome\aiapp\prompt-pilot` 目录
2. **编译确认**：运行 `npm run compile` 确保编译成功
3. **启动调试**：按 `F5` 启动调试模式
4. **测试环境**：在Extension Development Host窗口中测试
5. **查看日志**：在调试控制台查看输出

### 错误查看方法
1. **WebView前端错误**：
   - 在Extension Development Host窗口按F12
   - 查看Console标签页的红色错误信息
   - 关注Network标签页的资源加载失败

2. **扩展后端错误**：
   - 在原VSCode窗口按Ctrl+Shift+Y
   - 选择"扩展开发宿主"输出频道
   - 查看详细错误日志

3. **替代调试方法**：
   - 帮助 → 切换开发人员工具
   - 快捷键：Ctrl+Shift+I 或 Ctrl+Shift+J
   - 命令面板：输入 "Toggle Developer Tools"

## ✅ 集成配置面板功能验证清单

### 主页面加载验证（5分钟）
- [ ] 插件启动后主页面能直接打开，无需API配置
- [ ] 页面左侧显示配置面板区域
- [ ] 页面右侧显示欢迎屏幕或题目详情
- [ ] 无错误提示，无加载卡顿

### 配置面板功能验证（10分钟）
- [ ] **API类型选择**：
  - [ ] 下拉框显示7种API类型
  - [ ] 选择不同类型时，URL和模型ID自动填充默认值
  - [ ] 自定义选项可手动输入

- [ ] **配置字段验证**：
  - [ ] API Key输入框（密码格式）
  - [ ] API URL输入框（预填默认值）
  - [ ] 模型ID输入框（预填默认值）

- [ ] **操作按钮验证**：
  - [ ] "保存配置"按钮可点击
  - [ ] "测试连接"按钮可点击
  - [ ] 按钮点击后有加载状态显示

### 配置保存与测试验证（10分钟）
- [ ] **保存配置**：
  - [ ] 填写完整配置信息后点击保存
  - [ ] 显示"配置保存成功"提示
  - [ ] 重新打开插件配置信息保持

- [ ] **测试连接**：
  - [ ] 配置正确API信息后点击测试
  - [ ] 显示测试进度（正在测试API连接...）
  - [ ] 连接成功显示绿色成功信息
  - [ ] 连接失败显示红色错误信息

### 题目操作验证（5分钟）
- [ ] 左侧题目列表正常显示
- [ ] 点击题目可正常加载详情
- [ ] "刷新题目"按钮工作正常
- [ ] "TOP3 Prompts"按钮在选中题目后可用

### 代码生成验证（10分钟）
- [ ] 选择题目并配置API后
- [ ] 输入Prompt可以正常生成代码
- [ ] 生成的代码正确显示
- [ ] 运行测试功能正常工作

## 🚨 常见问题排查

### 问题1：路径编码错误
**症状**：文件路径包含 `%3A` 等URL编码
**解决方案**：
```bash
# 删除VSCode工作区设置
rm -rf .vscode/settings.json

# 重启VSCode并重新打开项目
```

### 问题2：WebView资源加载失败
**症状**：配置面板空白或样式丢失
**解决方案**：
1. 检查 `media/` 目录下文件是否存在
2. 验证 `PromptPilotPanel.ts` 中的资源URI生成
3. 在开发者工具Network中查看具体失败的资源

### 问题3：配置保存失败
**症状**：点击保存后无反应或报错
**解决方案**：
1. 检查VSCode配置权限
2. 验证配置格式是否正确
3. 查看调试控制台具体错误信息

### 问题4：API测试连接失败
**症状**：所有API配置都测试失败
**解决方案**：
1. 检查网络连接
2. 验证API密钥格式
3. 确认API URL地址正确
4. 查看具体的错误消息

## 📝 调试日志记录

### 关键日志位置
1. **扩展后端日志**：VSCode调试控制台 → 扩展开发宿主
2. **WebView前端日志**：Extension Development Host → F12 → Console
3. **网络请求日志**：F12 → Network标签页

### 重要日志关键词
```
✅ 正常日志：
- "WebView 已就绪"
- "配置保存成功"
- "API连接成功"

❌ 错误日志：
- "无法读取文件"
- "路径解析失败"
- "配置保存失败"
- "API连接失败"
```

## 🔄 测试循环

### 快速验证循环（每轮5分钟）
1. 修改代码
2. 运行 `npm run compile`
3. 刷新Extension Development Host（Ctrl+R）
4. 测试修改的功能
5. 记录结果并继续

### 完整验证循环（每轮15分钟）
1. 完整重启调试（关闭再按F5）
2. 按照功能验证清单逐项测试
3. 记录所有发现的问题
4. 修复问题并重新测试

## 🎯 成功标准

插件调试成功的标准：
- ✅ 主页面可以直接打开，无API配置依赖
- ✅ 配置面板完整显示，所有字段可编辑
- ✅ 配置保存和测试连接功能正常
- ✅ 题目选择和代码生成功能正常
- ✅ 所有操作可在主页面内完成

## 📞 故障升级

如果按照本指南操作后问题仍未解决：
1. 收集完整的错误日志
2. 记录具体的复现步骤
3. 提供环境信息（Node.js版本、VSCode版本等）
4. 考虑回退到上一个稳定版本

---

💡 **提示**：调试过程中保持耐心，大部分问题都是路径或缓存相关，通过清理和重新编译通常可以解决。