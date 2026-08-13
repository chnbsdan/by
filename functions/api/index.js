export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;

  let totalCount = '--';
  let todayDate = '--';
  try {
    // ★★★ 修复：public 是静态资源根目录，访问路径不需要加 /public ★★★
    const dataUrl = `${base}/json/data.json`;
    const res = await fetch(dataUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CloudflarePages-Function'
      }
    });
    if (res.ok) {
      const data = await res.json();
      totalCount = data.length || 0;
      if (data.length > 0) {
        data.sort((a, b) => b.startdate.localeCompare(a.startdate));
        todayDate = data[0].startdate || '--';
      }
    } else {
      console.error('data.json 加载失败:', res.status);
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>必应壁纸 API</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    :root {
      --bg-primary: #08080f;
      --bg-secondary: #12121f;
      --bg-card: rgba(255,255,255,0.04);
      --bg-card-hover: rgba(255,255,255,0.08);
      --bg-code: rgba(255,255,255,0.05);
      --text-primary: #f0f0f5;
      --text-secondary: rgba(255,255,255,0.6);
      --text-muted: rgba(255,255,255,0.3);
      --border-color: rgba(255,255,255,0.06);
      --border-hover: rgba(79,195,247,0.3);
      --shadow: 0 8px 32px rgba(0,0,0,0.45);
      --accent: #4fc3f7;
      --accent-glow: rgba(79,195,247,0.12);
      --gradient-start: #4fc3f7;
      --gradient-end: #00e5ff;
      --radius: 16px;
      --radius-sm: 10px;
      --transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    [data-theme="light"] {
      --bg-primary: #faf0e6;
      --bg-secondary: #ffffff;
      --bg-card: rgba(255,248,240,0.7);
      --bg-card-hover: rgba(255,248,240,0.95);
      --bg-code: rgba(0,0,0,0.04);
      --text-primary: #2d1f14;
      --text-secondary: rgba(45,31,20,0.55);
      --text-muted: rgba(45,31,20,0.35);
      --border-color: rgba(45,31,20,0.08);
      --border-hover: rgba(79,195,247,0.4);
      --shadow: 0 8px 32px rgba(45,31,20,0.08);
      --accent-glow: rgba(79,195,247,0.12);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 28px 20px 60px;
      transition: background 0.4s ease, color 0.4s ease;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--accent); text-decoration: none; transition: var(--transition); }
    a:hover { opacity: 0.8; }
    .container { max-width: 1000px; margin: 0 auto; }
    .glow-orb {
      position: fixed;
      top: -20%;
      right: -10%;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79,195,247,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      animation: float 20s ease-in-out infinite;
    }
    .glow-orb--bottom {
      top: auto;
      bottom: -20%;
      right: auto;
      left: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%);
      animation-delay: -10s;
    }
    [data-theme="light"] .glow-orb {
      background: radial-gradient(circle, rgba(255,180,120,0.08) 0%, transparent 70%);
    }
    [data-theme="light"] .glow-orb--bottom {
      background: radial-gradient(circle, rgba(255,200,150,0.06) 0%, transparent 70%);
    }
    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 30px) scale(0.95); }
    }
    .container { position: relative; z-index: 1; }
    .theme-toggle-wrap {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999;
    }
    .theme-toggle-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 12px 16px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      transition: var(--transition);
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: var(--shadow);
      width: 48px;
      height: 48px;
    }
    .theme-toggle-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--border-hover);
      transform: scale(1.05);
    }
    .theme-toggle-btn .btn-label { display: none; }
    @media (max-width: 480px) {
      .theme-toggle-wrap { bottom: 16px; right: 16px; }
      .theme-toggle-btn { width: 42px; height: 42px; font-size: 16px; padding: 10px 12px; }
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
      border-radius: 2px;
    }
    .header-left h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-left h1 .gradient-text {
      background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header-left h1 .icon-text {
      -webkit-text-fill-color: var(--text-primary);
      background: none;
    }
    .header-left p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }
    .header-left p i { margin-right: 6px; color: var(--accent); }
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .header-right .badge {
      background: var(--accent-glow);
      color: var(--accent);
      padding: 5px 16px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--accent-glow);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .header-right .btn-back {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 18px;
      border-radius: 100px;
      font-size: 13px;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .header-right .btn-back:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--border-hover);
      transform: translateY(-1px);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 20px 18px;
      text-align: center;
      transition: var(--transition);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
      opacity: 0;
      transition: var(--transition);
    }
    .stat-card:hover::before { opacity: 1; }
    .stat-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-3px);
      box-shadow: var(--shadow);
    }
    .stat-card .num {
      font-size: 30px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .stat-card .num i { color: var(--accent); margin-right: 6px; }
    .stat-card .label {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 36px 0 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title i { color: var(--accent); font-size: 20px; }
    .section-title .tag {
      font-size: 11px;
      font-weight: 500;
      background: var(--accent-glow);
      color: var(--accent);
      padding: 2px 14px;
      border-radius: 100px;
      border: 1px solid var(--accent-glow);
    }
    .api-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .api-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 20px 22px;
      transition: var(--transition);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;
    }
    .api-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
      opacity: 0;
      transition: var(--transition);
    }
    .api-card:hover::before { opacity: 1; }
    .api-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-hover);
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }
    .api-card .api-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .api-card .api-path {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      font-family: 'SF Mono', 'Fira Code', monospace;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .api-card .api-path .method {
      font-size: 10px;
      font-weight: 700;
      background: var(--accent-glow);
      color: var(--accent);
      padding: 1px 12px;
      border-radius: 4px;
      font-family: inherit;
      letter-spacing: 0.3px;
    }
    .api-card .api-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .api-card .api-code {
      margin-top: 12px;
      background: var(--bg-code);
      border-radius: var(--radius-sm);
      padding: 8px 14px;
      font-size: 12px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      color: var(--text-secondary);
      overflow-x: auto;
      white-space: nowrap;
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: var(--transition);
    }
    .api-card .api-code:hover {
      border-color: var(--border-hover);
    }
    .api-card .api-code .link-part {
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .api-card .api-code .link-part a {
      color: var(--text-secondary);
      transition: var(--transition);
    }
    .api-card .api-code .link-part a:hover {
      color: var(--accent);
    }
    .api-card .api-code .copy-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 14px;
      transition: var(--transition);
      font-family: inherit;
      padding: 0 4px;
      flex-shrink: 0;
    }
    .api-card .api-code .copy-btn:hover { color: var(--accent); }
    .api-card .api-tags {
      margin-top: 10px;
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .api-card .api-tags code {
      background: var(--bg-code);
      padding: 1px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .params-table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 18px 22px;
      overflow-x: auto;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .params-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .params-table th {
      text-align: left;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 8px 12px 8px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .params-table td {
      padding: 10px 12px 10px 0;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
    .params-table td:first-child {
      color: var(--text-primary);
      font-weight: 500;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
    }
    .params-table td .param-desc {
      color: var(--text-muted);
      font-size: 12px;
    }
    .params-table tr:last-child td { border-bottom: none; }
    .example-box {
      background: var(--bg-code);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 18px 22px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px;
      color: var(--text-secondary);
      overflow-x: auto;
      line-height: 1.9;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .example-box .comment {
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .example-box .comment::before {
      content: '// ';
    }
    .donate-section {
      margin-top: 44px;
      padding: 32px 28px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      text-align: center;
      transition: var(--transition);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    .donate-section:hover {
      border-color: var(--border-hover);
      box-shadow: var(--shadow);
    }
    .donate-section .donate-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .donate-section .donate-title i {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-right: 8px;
    }
    .donate-section .donate-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 18px;
    }
    .donate-section .qr-row {
      display: flex;
      justify-content: center;
      gap: 36px;
      flex-wrap: wrap;
    }
    .donate-section .qr-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .donate-section .qr-item img {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-sm);
      background: #ffffff;
      padding: 6px;
      border: 1px solid var(--border-color);
      transition: var(--transition);
    }
    .donate-section .qr-item img:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .donate-section .qr-item .qr-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .donate-section .qr-item .qr-label.wechat { color: #07c160; }
    .donate-section .qr-item .qr-label.alipay { color: #1677ff; }
    footer {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 13px;
      color: var(--text-muted);
    }
    footer .footer-links { display: flex; gap: 18px; }
    footer .footer-links a {
      color: var(--text-muted);
      transition: var(--transition);
      font-size: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
    }
    footer .footer-links a:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
      transform: translateY(-2px);
    }
    .toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: var(--bg-secondary);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 10px 28px;
      border-radius: 12px;
      font-size: 14px;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: none;
      z-index: 999;
      font-weight: 500;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    @media (max-width: 768px) {
      body { padding: 16px 14px 40px; }
      .header-left h1 { font-size: 24px; }
      .header-left h1 .icon-text { display: none; }
      .stats { grid-template-columns: repeat(3, 1fr); }
      .api-grid { grid-template-columns: 1fr; }
      .api-card .api-code { font-size: 11px; white-space: normal; word-break: break-all; }
      .donate-section .qr-item img { width: 90px; height: 90px; }
      .params-table { font-size: 13px; }
      .params-table td, .params-table th { padding: 6px 8px 6px 0; }
      footer { flex-direction: column; text-align: center; }
      .header-right .badge { font-size: 11px; padding: 4px 12px; }
      .glow-orb { display: none; }
    }
    @media (max-width: 480px) {
      .stats { grid-template-columns: 1fr; }
      .donate-section .qr-row { gap: 20px; }
      .donate-section .qr-item img { width: 75px; height: 75px; }
      .header-left h1 { font-size: 20px; }
      .header { flex-direction: column; align-items: stretch; }
      .header-right { justify-content: flex-start; }
      .header::after { width: 40px; }
      .toast { bottom: 70px; font-size: 13px; padding: 8px 20px; }
    }
  </style>
</head>
<body>
  <div class="glow-orb"></div>
  <div class="glow-orb glow-orb--bottom"></div>
  <div class="theme-toggle-wrap">
    <button class="theme-toggle-btn" id="themeToggle" title="切换主题">
      <i class="fas fa-moon" id="themeIcon"></i>
      <span class="btn-label" id="themeLabel">深色</span>
    </button>
  </div>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>
          <span class="icon-text">📷</span>
          <span class="gradient-text">必应壁纸</span>
          <span style="font-weight:300; color:var(--text-muted); font-size:0.7em;">API</span>
        </h1>
        <p><i class="fas fa-clock"></i> 图片自动更新：每天 0:10</p>
      </div>
      <div class="header-right">
        <span class="badge"><i class="fas fa-code"></i> RESTful</span>
        <a href="/" class="btn-back"><i class="fas fa-arrow-left"></i> 返回首页</a>
      </div>
    </div>
    <div class="stats">
      <div class="stat-card">
        <div class="num"><i class="fas fa-image"></i> ${totalCount}</div>
        <div class="label">总图片数</div>
      </div>
      <div class="stat-card">
        <div class="num"><i class="fas fa-calendar-day"></i> ${todayDate}</div>
        <div class="label">今日更新</div>
      </div>
      <div class="stat-card">
        <div class="num"><i class="fas fa-clock"></i> <span id="updateTime">--</span></div>
        <div class="label">最后更新</div>
      </div>
    </div>
    <div class="section-title">
      <i class="fas fa-plug"></i> API 接口
      <span class="tag">全部免费</span>
    </div>
    <div class="api-grid">
      <div class="api-card">
        <div class="api-label"><i class="fas fa-sun"></i> 当天图像</div>
        <div class="api-path">/api/daily <span class="method">GET</span></div>
        <div class="api-desc">获取今日必应壁纸</div>
        <div class="api-code">
          <span class="link-part"><a href="${base}/api/daily" target="_blank">${base}/api/daily</a></span>
          <button class="copy-btn" onclick="copyText('${base}/api/daily')"><i class="fas fa-copy"></i></button>
        </div>
        <div class="api-tags">
          <code>?format=webp</code> <code>?format=jpeg</code> <code>?format=original</code>
        </div>
      </div>
      <div class="api-card">
        <div class="api-label"><i class="fas fa-random"></i> 随机图像</div>
        <div class="api-path">/api/random <span class="method">GET</span></div>
        <div class="api-desc">随机返回一张壁纸</div>
        <div class="api-code">
          <span class="link-part"><a href="${base}/api/random" target="_blank">${base}/api/random</a></span>
          <button class="copy-btn" onclick="copyText('${base}/api/random')"><i class="fas fa-copy"></i></button>
        </div>
        <div class="api-tags">
          <code>?redirect=true</code> 重定向到图片
        </div>
      </div>
      <div class="api-card">
        <div class="api-label"><i class="fas fa-calendar-alt"></i> 指定日期</div>
        <div class="api-path">/api/image <span class="method">GET</span></div>
        <div class="api-desc">获取指定日期的壁纸</div>
        <div class="api-code">
          <span class="link-part"><a href="${base}/api/image?date=20210312" target="_blank">${base}/api/image?date=20210312</a></span>
          <button class="copy-btn" onclick="copyText('${base}/api/image?date=20210312')"><i class="fas fa-copy"></i></button>
        </div>
        <div class="api-tags">
          <code>?date=20210312</code> 格式：YYYYMMDD
        </div>
      </div>
      <div class="api-card">
        <div class="api-label"><i class="fas fa-list"></i> 壁纸列表</div>
        <div class="api-path">/api/list <span class="method">GET</span></div>
        <div class="api-desc">获取所有壁纸列表（分页）</div>
        <div class="api-code">
          <span class="link-part"><a href="${base}/api/list" target="_blank">${base}/api/list</a></span>
          <button class="copy-btn" onclick="copyText('${base}/api/list')"><i class="fas fa-copy"></i></button>
        </div>
        <div class="api-tags">
          <code>?page=1&size=30</code> 分页参数
        </div>
      </div>
    </div>
    <div class="section-title" style="margin-top:40px;">
      <i class="fas fa-cog"></i> 参数说明
      <span class="tag">可选</span>
    </div>
    <div class="params-table-wrap">
      <table class="params-table">
        <thead>
          <tr><th>参数</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr><td>date</td><td>指定日期 <span class="param-desc">（格式：YYYYMMDD，如 20210312）</span></td></tr>
          <tr><td>format</td><td>图片格式 <span class="param-desc">（webp / jpeg / original，默认 webp）</span></td></tr>
          <tr><td>redirect</td><td>是否重定向到图片 <span class="param-desc">（true / false，默认 false）</span></td></tr>
          <tr><td>page</td><td>分页页码 <span class="param-desc">（默认 1）</span></td></tr>
          <tr><td>size</td><td>每页数量 <span class="param-desc">（默认 30，最大 100）</span></td></tr>
        </tbody>
      </table>
    </div>
    <div class="section-title" style="margin-top:40px;">
      <i class="fas fa-code"></i> 使用示例
      <span class="tag">HTML</span>
    </div>
    <div class="example-box">
      <div class="comment">嵌入当天壁纸</div>
      &lt;img src="${base}/api/daily" alt="今日壁纸" /&gt;
      <div class="comment" style="margin-top:8px;">嵌入随机壁纸</div>
      &lt;img src="${base}/api/random" alt="随机壁纸" /&gt;
      <div class="comment" style="margin-top:8px;">嵌入指定日期壁纸</div>
      &lt;img src="${base}/api/image?date=20210312" alt="壁纸" /&gt;
      <div class="comment" style="margin-top:8px;">JavaScript 调用</div>
      fetch('${base}/api/random')
        .then(res => res.json())
        .then(data => console.log(data));
    </div>
    <div class="donate-section">
      <div class="donate-title"><i class="fas fa-heart"></i> 支持作者</div>
      <div class="donate-desc">如果这个 API 对你有帮助，请作者喝杯咖啡吧 ☕</div>
      <div class="qr-row">
        <div class="qr-item">
          <img src="https://img.hangdn.com/hd/wechat.png" alt="微信支付" />
          <span class="qr-label wechat"><i class="fab fa-weixin"></i> 微信支付</span>
        </div>
        <div class="qr-item">
          <img src="https://img.hangdn.com/hd/alipay.png" alt="支付宝" />
          <span class="qr-label alipay"><i class="fab fa-alipay"></i> 支付宝</span>
        </div>
      </div>
    </div>
    <footer>
      <span>© 2026 必应每日壁纸 · 图片来自 Bing</span>
      <div class="footer-links">
        <a href="/" title="首页"><i class="fas fa-home"></i></a>
        <a href="https://github.com/chnbsdan/Bing-Wallpaper-Archive" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>
        <a href="/comment.html" title="反馈" target="_blank"><i class="fas fa-bug"></i></a>
      </div>
    </footer>
  </div>
  <div class="toast" id="toast">✅ 已复制</div>
  <script>
    var themeToggle = document.getElementById('themeToggle');
    var themeIcon = document.getElementById('themeIcon');
    var themeLabel = document.getElementById('themeLabel');
    var currentTheme = localStorage.getItem('apiTheme') || 'dark';
    function setTheme(theme) {
      currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('apiTheme', theme);
      if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon';
        themeLabel.textContent = '深色';
      } else {
        themeIcon.className = 'fas fa-sun';
        themeLabel.textContent = '亮色';
      }
    }
    themeToggle.addEventListener('click', function() {
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
    setTheme(currentTheme);
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var updateEl = document.getElementById('updateTime');
    if (updateEl) updateEl.textContent = h + ':' + m;
    function copyText(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showToast('✅ 已复制');
        }).catch(function() {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }
    function fallbackCopy(text) {
      var input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        showToast('✅ 已复制');
      } catch (e) {
        showToast('⚠️ 复制失败，请手动复制');
      }
      document.body.removeChild(input);
    }
    function showToast(msg) {
      var toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(function() {
        toast.classList.remove('show');
      }, 2000);
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    },
  });
}
