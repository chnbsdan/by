# 🖼️ Bing Wallpaper - 必应壁纸

> 每日一图，带你领略世界之美 — 必应壁纸聚合站

[![Vue 3](https://img.shields.io/badge/Vue-3.4-green?logo=vuedotjs)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)](https://vitejs.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)](https://pages.cloudflare.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-blue?logo=githubactions)](https://github.com/features/actions)

一个美观、高性能的必应壁纸展示与下载工具，支持每日自动更新、智能主体识别、多分辨率下载等功能。

## ✨ 特性

### 📱 前端展示
- **Vue 3 + Vite** 构建，极致性能
- **响应式设计** - 移动端竖屏 3:5，桌面端 16:9
- **暗色/亮色主题** - 自适应系统主题
- **智能主体居中** - AI 检测图片主体，自动居中显示
- **图片缩放与拖拽** - 大图预览支持滚轮缩放 + 拖拽平移

### 🖼️ 壁纸管理
- **6000+ 壁纸** - 持续累积，每日更新
- **智能裁剪下载** - 手机壁纸自动裁剪为 9:16 比例
- **多分辨率支持** - 4K / FHD / HD / 手机竖屏
- **搜索功能** - 按日期/关键词搜索壁纸

### 🔧 技术架构
- **Cloudflare Pages** - 全球 CDN 加速
- **Cloudflare Functions** - Serverless API
- **GitHub Actions** - 每日自动抓取壁纸
- **Twikoo** - 独立评论系统

## 🚀 在线体验

- **官网**: [https://by-2ee.pages.dev](https://by-2ee.pages.dev)
- **API 文档**: [https://by-2ee.pages.dev/api](https://by-2ee.pages.dev/api)

## 📸 截图

| 首页 | 预览 | 移动端 |
|------|------|--------|
| ![首页](https://via.placeholder.com/300x200) | ![预览](https://via.placeholder.com/300x200) | ![移动端](https://via.placeholder.com/300x200) |

## 📦 API 接口

所有 API 接口免费开放：

| 接口 | 说明 | 示例 |
|------|------|------|
| `/api/daily` | 获取今日壁纸 | `https://by-2ee.pages.dev/api/daily` |
| `/api/random` | 随机壁纸 | `https://by-2ee.pages.dev/api/random` |
| `/api/image?date=YYYYMMDD` | 指定日期壁纸 | `https://by-2ee.pages.dev/api/image?date=20260813` |
| `/api/list?page=1&size=30` | 壁纸列表（分页） | `https://by-2ee.pages.dev/api/list` |

### API 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `date` | 日期（YYYYMMDD） | `date=20260813` |
| `format` | 图片格式 | `webp` / `jpeg` / `original` |
| `redirect` | 是否重定向到图片 | `true` / `false` |
| `page` | 分页页码 | `page=1` |
| `size` | 每页数量 | `size=30`（最大 100） |

### API 使用示例

```html
<!-- 嵌入当天壁纸 -->
<img src="https://by-2ee.pages.dev/api/daily" alt="今日壁纸" />

<!-- 嵌入随机壁纸 -->
<img src="https://by-2ee.pages.dev/api/random" alt="随机壁纸" />

<!-- JavaScript 调用 -->
fetch('https://by-2ee.pages.dev/api/random')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🛠️ 技术栈

| 前端 | 后端 | 部署 |
|------|------|------|
| Vue 3 | Cloudflare Functions | Cloudflare Pages |
| Vite | Node.js | GitHub Actions |
| Font Awesome | Twikoo | Vercel |

## 📁 项目结构

```
by/
├── functions/                 # Cloudflare Functions API
│   └── api/
│       ├── index.js          # API 入口页面
│       ├── daily.js          # 当日壁纸
│       ├── random.js         # 随机壁纸
│       ├── image.js          # 指定日期壁纸
│       └── list.js           # 壁纸列表
├── public/                    # 静态资源
│   ├── json/
│   │   └── data.json         # 壁纸数据（GitHub Actions 更新）
│   └── comment.html          # 独立评论页面
├── src/                       # Vue 源码
│   ├── App.vue               # 主组件
│   ├── main.js               # 入口文件
│   └── style.css             # 全局样式
├── scripts/
│   └── update-data.ts        # 壁纸抓取脚本
├── index.html                 # 入口 HTML
├── vite.config.js            # Vite 配置
├── package.json              # 依赖管理
└── .github/workflows/
    └── main.yml              # GitHub Actions 定时任务
```

## 🏃 本地开发

### 环境要求
- Node.js 20+
- pnpm 或 npm

### 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/chnbsdan/by.git
cd by

# 2. 安装依赖
npm install
# 或
pnpm install

# 3. 启动开发服务器
npm run dev
# 或
pnpm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```
CF构建配置

构建命令:npm run build

构建输出:dist

根目录:

构建注释:


### 更新壁纸数据

```bash
# 手动运行抓取脚本
npm run update-data
# 或
pnpm run update-data
```

## 🔄 自动化流程

```mermaid
graph LR
    A[GitHub Actions] -->|每日定时| B[抓取必应壁纸]
    B --> C[更新 data.json]
    C --> D[提交到 GitHub]
    D --> E[Cloudflare Pages 自动部署]
    E --> F[网站更新]
```

## 🎨 特色功能详解

### 智能主体居中

浏览图片时，系统会自动检测图片中的人物或物体位置，并将其居中显示，避免人物在边缘时被裁切。

### 手机壁纸智能裁剪

下载手机壁纸时，自动从原图中心裁剪出 9:16 比例，完美适配手机屏幕。

### 评论系统

独立加载的 Twikoo 评论系统，不影响主页面性能。

## 📄 许可证

MIT License

## 🙏 致谢

- 壁纸来源于 [Bing](https://www.bing.com)
- 评论系统 [Twikoo](https://twikoo.js.org/)
- 部署平台 [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 📊 统计

![GitHub stars](https://img.shields.io/github/stars/chnbsdan/by)
![GitHub forks](https://img.shields.io/github/forks/chnbsdan/by)
![GitHub issues](https://img.shields.io/github/issues/chnbsdan/by)
![GitHub last commit](https://img.shields.io/github/last-commit/chnbsdan/by)

---

**Made with ❤️ by [小史先生](https://github.com/chnbsdan)**

[⬆ 回到顶部](#-bing-wallpaper---必应壁纸)
