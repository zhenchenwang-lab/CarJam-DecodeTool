# Play List Decoder

纯静态的 Car Jam `play_list` 解码页。浏览器内完成 Base64URL、7-bit 和两段拼接解析，不上传日志。

## 本地运行

```bash
npm install
npm run dev
```

## GitHub Pages

将此目录作为独立 GitHub 仓库根目录后推送到 `main`。在仓库 **Settings → Pages** 中把 Source 设为 **GitHub Actions**；工作流会发布 `dist/client`。

默认对应项目站点 `https://<owner>.github.io/<repo>/`。如果仓库名为 `<owner>.github.io`，请删除工作流中的 `NEXT_PUBLIC_ASSET_PREFIX` 环境变量。
