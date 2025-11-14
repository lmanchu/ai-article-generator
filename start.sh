#!/bin/bash

# Article Generator 快速啟動腳本

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║       📝  Lman 風格科技新聞文章生成器  📝                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未安裝 Node.js"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 檢查 Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ 錯誤: Ollama 服務未運行"
    echo "請先啟動 Ollama: brew services start ollama"
    exit 1
fi

echo "✅ Ollama 服務運行中"

# 檢查模型
if ! curl -s http://localhost:11434/api/tags | grep -q "gpt-oss:20b"; then
    echo "⚠️  警告: 未找到推薦模型 gpt-oss:20b"
    echo "建議執行: ollama pull gpt-oss:20b"
    echo ""
    read -p "是否繼續? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ 模型 gpt-oss:20b 已安裝"
fi

echo ""
echo "🚀 啟動文章生成器..."
echo ""

# 啟動主程式
node index.js
