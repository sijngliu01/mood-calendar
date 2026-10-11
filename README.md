# 心情日历 PWA

可安装、可离线使用的个人心情记录应用。

## 本地运行

```bash
npm install
npm run dev
```

生产构建及预览：

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
```

## 安装

- Android / 桌面 Chrome：点击应用右上角的「安装」。
- iPhone / iPad Safari：点击分享按钮，选择「添加到主屏幕」。
- PWA 必须部署在 HTTPS 地址；`localhost` 可用于本地测试。

## 数据

- 记录、标签和设置保存在浏览器 IndexedDB。
- 图片压缩后以 Blob 保存，不会写入 `localStorage`。
- Service Worker 缓存应用外壳，首次访问后可离线打开。
- 数据仅存在当前浏览器；清除网站数据、卸载应用或更换设备可能导致数据丢失。

## 校验

```bash
npm run lint
npm run build
```
