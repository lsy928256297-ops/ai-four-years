# AI 这四年 · 口播稿（活码页面）

- 线上地址：https://lsy928256297-ops.github.io/ai-four-years/
- 二维码指向上面这个固定地址，内容升级后地址不变。

## 怎么升级内容
1. 编辑 `data.js`（文案 / 年份 / 标题 / 版本号 / 更新时间）。
2. 想调配色、间距、质感：改 `styles.css`。
3. 想加新模块：改 `index.html` + `app.js`。
4. 执行 `bash ../scripts/publish.sh "v1.1 文案微调"`，约 1 分钟生效。

## 本地预览
在 `site/` 目录执行 `python3 -m http.server 8080`，浏览器打开 http://127.0.0.1:8080
