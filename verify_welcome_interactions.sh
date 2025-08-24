#!/bin/bash

# 欢迎界面交互功能验证脚本

echo "🚀 开始验证欢迎界面交互功能..."
echo "====================================="

# 1. 检查项目编译
echo "📦 编译项目..."
cd "$(dirname "$0")"
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ 项目编译成功"
else
    echo "❌ 项目编译失败，请检查代码"
    exit 1
fi

echo ""

# 2. 检查关键文件
echo "📁 检查关键文件..."

files=(
    "media/main.js"
    "media/main.css"
    "src/webview/PromptPilotPanel.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""

# 3. 检查JavaScript关键函数
echo "🔍 检查JavaScript关键函数..."

js_functions=(
    "setupWelcomeScreenInteractions"
    "handleFeatureClick"
    "handleProblemSelection"
    "handleCodeGeneration"
    "handleTestExecution"
    "handleTopPrompts"
)

for func in "${js_functions[@]}"; do
    if grep -q "function $func" media/main.js; then
        echo "✅ 函数 $func 已定义"
    else
        echo "❌ 函数 $func 未找到"
    fi
done

echo ""

# 4. 检查CSS样式
echo "🎨 检查CSS样式..."

css_styles=(
    ".feature:hover"
    ".feature:active" 
    ".feature::before"
    "cursor: pointer"
    "transition:"
)

for style in "${css_styles[@]}"; do
    if grep -q "$style" media/main.css; then
        echo "✅ 样式 $style 已定义"
    else
        echo "⚠️ 样式 $style 未找到"
    fi
done

echo ""

# 5. 生成验证报告
echo "📊 生成验证报告..."
echo "====================================="
echo "验证完成时间: $(date)"
echo ""
echo "🎯 主要改进内容:"
echo "  1. 欢迎界面功能模块现在可以点击"
echo "  2. 精选题目 - 自动加载和选择题目"
echo "  3. AI代码生成 - 智能填充示例Prompt"
echo "  4. 即时测试 - 前置条件检查"
echo "  5. 学习优秀Prompt - 查看TOP3示例"
echo ""
echo "💡 使用提示:"
echo "  - 按F5启动调试模式"
echo "  - 在Extension Development Host中测试"
echo "  - 按Ctrl+Shift+P打开命令面板"
echo "  - 选择'Prompt Pilot: 开始练习'"
echo ""
echo "🔧 如有问题:"
echo "  - 检查调试指南: WELCOME_INTERACTION_TEST_GUIDE.md"
echo "  - 查看浏览器控制台(F12)的错误信息"
echo "  - 检查扩展开发宿主的输出日志"
echo ""
echo "✅ 验证脚本执行完成！"