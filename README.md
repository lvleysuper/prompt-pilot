# Prompt Pilot - VSCode Extension

🚀 **提升团队Prompt能力的VSCode插件**

Prompt Pilot是一个专为提升编程团队Prompt技能而设计的VSCode插件。通过精选的编程题目、AI代码生成和优秀Prompt学习，帮助开发者掌握与AI协作的最佳实践。

## ✨ 主要功能

### 🎯 1. 题目练习系统
- **精选算法题目**：涵盖数组、链表、栈、字符串等核心数据结构
- **难度分级**：Easy、Medium、Hard三个难度等级
- **智能提示**：每个题目都包含解题提示和技巧指导

### 🤖 2. AI代码生成
- **Prompt输入**：支持自由编写和提交Prompt
- **实时生成**：基于用户Prompt调用大模型生成高质量代码
- **代码预览**：生成的代码支持语法高亮和格式化显示
- **一键接受**：满意的代码可一键导入到新文件中

### 📊 3. 自动化测试
- **即时验证**：自动运行预设测试用例验证代码正确性
- **详细报告**：显示每个测试用例的执行结果和耗时
- **错误诊断**：提供详细的错误信息和调试建议

### 🏆 4. 优秀Prompt学习
- **TOP3展示**：查看每个题目的最优Prompt排行榜
- **技巧解析**：深入分析优秀Prompt的结构和技巧
- **实用指导**：提供具体的Prompt编写建议和最佳实践

### 📈 5. Prompt质量分析
- **智能评分**：AI自动分析Prompt质量并给出0-100分评分
- **改进建议**：提供具体的Prompt优化建议
- **学习反馈**：帮助用户逐步提升Prompt编写技能

## 🚀 快速开始

### 安装要求
- **VSCode**: 1.103.0 或更高版本
- **Node.js**: 14.x 或更高版本
- **TypeScript**: 支持TS代码执行（推荐安装ts-node）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd prompt-pilot
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译插件**
   ```bash
   npm run compile
   ```

4. **调试运行**
   - 在VSCode中打开项目
   - 按F5启动调试模式
   - 在新窗口中测试插件功能

### 配置设置

在VSCode设置中配置以下参数：

```json
{
  "promptPilot.apiKey": "your-llm-api-key",
  "promptPilot.apiEndpoint": "https://api.openai.com/v1/chat/completions",
  "promptPilot.model": "gpt-3.5-turbo"
}
```

## 📖 使用指南

### 1. 开始使用

**方式一：命令面板**
- 按 `Ctrl+Shift+P` 打开命令面板
- 输入 "Prompt Pilot" 选择相关命令
- 选择 "打开 Prompt Pilot" 启动主界面

**方式二：侧边栏**
- 点击活动栏中的火箭图标
- 在Prompt Pilot面板中选择题目

### 2. 解题流程

1. **选择题目**：从侧边栏选择感兴趣的算法题目
2. **阅读描述**：仔细阅读题目要求和示例
3. **编写Prompt**：在输入框中编写清晰的Prompt
4. **生成代码**：点击"生成代码"按钮调用AI
5. **运行测试**：点击"运行测试"验证代码正确性
6. **接受代码**：满意后点击"接受代码"导入到文件

### 3. 学习优秀Prompt

- 选择题目后点击"查看TOP3 Prompts"
- 学习优秀Prompt的写作结构和技巧
- 参考专家解析提升自己的Prompt技能

### 4. 快捷键

- `Ctrl+Enter`: 快速生成代码
- `Esc`: 关闭错误提示

## 🛠️ 开发指南

### 项目结构

```
prompt-pilot/
├── src/
│   ├── extension.ts          # 插件入口文件
│   ├── models/               # 数据模型
│   │   ├── Problem.ts        # 题目数据接口
│   │   └── ProblemExplorer.ts # 题目管理器
│   ├── services/             # 服务层
│   │   └── LLMService.ts     # 大模型API服务
│   ├── test-runner/          # 测试执行器
│   │   └── TestRunner.ts     # 代码测试运行器
│   └── webview/              # 界面组件
│       └── PromptPilotPanel.ts # 主界面面板
├── media/                    # 静态资源
│   ├── main.css             # 主样式文件
│   ├── main.js              # 前端交互脚本
│   ├── reset.css            # 样式重置
│   └── vscode.css           # VSCode主题适配
├── data/                     # 数据文件
│   ├── problems/            # 题目数据
│   └── templates/           # 代码模板
└── package.json             # 插件配置
```

### 添加新题目

1. 在 `data/problems/` 目录下创建JSON文件
2. 按照现有格式定义题目数据
3. 包含题目描述、测试用例、TOP3 Prompts等信息

### 扩展功能

- **支持更多语言**：修改TestRunner支持Python、Java等
- **增加题目类型**：扩展算法类别和难度
- **优化UI体验**：改进界面设计和交互流程

## 🤝 贡献指南

欢迎为Prompt Pilot贡献代码和想法！

1. **Fork本项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

### 贡献类型

- 🐛 **Bug修复**：修复已知问题
- ✨ **新功能**：添加新的功能特性
- 📚 **文档改进**：完善文档和示例
- 🎨 **UI优化**：改进用户界面和体验
- 📝 **题目贡献**：添加新的练习题目
- 🏆 **Prompt贡献**：分享优秀的Prompt示例

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为Prompt Pilot项目做出贡献的开发者和用户！

---

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

- 🐛 **提交Issue**：在GitHub上报告Bug或请求功能
- 💬 **讨论交流**：参与社区讨论分享经验
- ⭐ **给个Star**：如果觉得有用请给项目点个星

让我们一起打造更优秀的Prompt协作环境！🚀
