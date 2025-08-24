#!/bin/bash

# 🔧 Prompt Pilot 快速修复脚本
# 解决VSCode路径编码和缓存问题

echo "🚀 开始修复 Prompt Pilot 插件..."

# 切换到项目目录
cd /d/githome/aiapp/prompt-pilot

echo "📁 当前目录：$(pwd)"

# 1. 清理编译输出
echo "🧹 清理编译缓存..."
rm -rf out/
rm -rf node_modules/.cache/ 2>/dev/null || true

# 2. 验证关键文件存在
echo "✅ 验证关键文件..."
files=(
    "src/extension.ts"
    "src/webview/PromptPilotPanel.ts"
    "src/services/APIConfigService.ts"
    "media/main.js"
    "media/main.css"
    "package.json"
    "webpack.config.js"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file - 文件缺失！"
    fi
done

# 3. 重新编译
echo "🔨 重新编译..."
npm run compile

if [[ $? -eq 0 ]]; then
    echo "✅ 编译成功！"
else
    echo "❌ 编译失败，尝试重新安装依赖..."
    npm install
    npm run compile
fi

# 4. 检查输出文件
echo "📦 检查编译输出..."
if [[ -f "out/extension.js" ]]; then
    echo "✅ out/extension.js 生成成功"
    echo "📊 文件大小：$(ls -lh out/extension.js | awk '{print $5}')"
else
    echo "❌ out/extension.js 未生成"
fi

echo ""
echo "🎯 修复完成！现在请按照以下步骤测试："
echo "1. 关闭所有VSCode窗口"
echo "2. 重新打开VSCode"
echo "3. 打开项目目录：d:\\githome\\aiapp\\prompt-pilot"
echo "4. 按F5启动调试"
echo "5. 在Extension Development Host中测试插件"
echo ""
echo "📖 详细调试指南请查看：INTEGRATED_PANEL_DEBUG_GUIDE.md"