<template>
  <div class="app">
    <!-- ★★★ 汉堡按钮 ★★★ -->
    <button class="nav-toggle" @click="toggleNav">
      <i :class="navOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>

    <!-- 导航栏 -->
    <div class="navbar" :class="{ 'toggle-open': navOpen }" @mouseleave="closeNav">
      <div class="navbar-header">
        <div class="logo">
          <img src="/favicon.ico" alt="Logo" style="width:24px;height:24px;border-radius:4px;" />
          Bing <span>Wallpaper</span>
        </div>
      </div>
      <div class="badge"><i class="fas fa-images"></i> {{ allData.length }} 张</div>
      <div class="search-box">
        <input type="text" v-model="searchKeyword" placeholder="搜索年份/关键词..." @input="doSearch" @keydown.enter="doSearch" />
        <button class="search-clear" v-if="searchKeyword.length > 0" @click="clearSearch"><i class="fas fa-times-circle"></i></button>
        <button class="search-btn" @click="doSearch"><i class="fas fa-search"></i></button>
      </div>
      <div class="nav-actions">
        <button @click="resetSearch"><i class="fas fa-home"></i> 首页</button>
        <button @click="openComment"><i class="fas fa-comment"></i> 留言</button>
        <a href="/api" target="_blank"><i class="fas fa-code"></i> API</a>
        <a href="https://aoso.hangdn.com" target="_blank"><i class="fas fa-blog"></i> 博客</a>
        <button @click="toggleTheme">
          <i :class="theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'"></i>
        </button>
      </div>
    </div>

    <!-- 网格 -->
    <div class="grid" ref="gridRef" @scroll="checkScroll">
      <div v-for="item in displayData" :key="item.startdate || item.date" class="card" @click="openPreview(item)">
        <div class="placeholder-bg" :style="{ backgroundImage: 'url(' + getThumbUrl(item) + ')' }" :class="{ hidden: item._loaded }"></div>
        <img :src="getThumbUrl(item)" :alt="item.copyright || item.date" loading="lazy" crossorigin="anonymous" @load="item._loaded = true" @error="item._loaded = true" :class="{ loaded: item._loaded }" />
        <div class="info">
          <div class="date">{{ item.startdate || item.date }}</div>
          <div class="title">{{ item.title || item.copyright || '无标题' }}</div>
        </div>
      </div>

      <div v-if="loading" class="loading-indicator"><i class="fas fa-spinner"></i> 加载更多...</div>
      <div v-if="!hasMore && displayData.length > 0" class="footer-end">
        <div class="footer-line"></div>
        <div class="footer-icon"><i class="fas fa-check-circle"></i></div>
        <div class="footer-text">已全部加载完成 · 共 {{ allData.length }} 张壁纸</div>
        <div class="footer-sub">— 本站由小史先生维护，感谢使用 Bing Wallpaper —</div>
      </div>
      <div v-if="displayData.length === 0 && !loading" class="empty">
        <div class="icon"><i class="fas fa-image"></i></div>
        <div>暂无壁纸数据</div>
      </div>
    </div>

    <!-- 回到顶部 -->
    <button v-show="showBackToTop" class="back-to-top" @click="scrollToTop"><i class="fas fa-arrow-up"></i></button>

    <!-- 预览 -->
    <div v-if="previewVisible" class="preview-overlay active" @click.self="closePreview">
      <button class="arrow arrow-left" @click.stop="prevPreview"><i class="fas fa-chevron-left"></i></button>
      <button class="arrow arrow-right" @click.stop="nextPreview"><i class="fas fa-chevron-right"></i></button>

      <div class="preview-container">
        <img ref="previewImg" class="preview-image" :src="previewUrl" alt="预览" crossorigin="anonymous" @load="onPreviewLoad" @click="toggleToolbar" />
      </div>

      <!-- ★★★ 工具栏 - 点击图片切换显隐 ★★★ -->
      <div class="toolbar" :class="{ hidden: !toolbarVisible }">
        <a href="/" class="btn"><i class="fas fa-home"></i> <span>首页</span></a>
        <div class="dropdown" @mouseenter="dropdownOpen = true" @mouseleave="dropdownOpen = false">
          <button class="btn"><i class="fas fa-download"></i> <span>下载</span> <i class="fas fa-chevron-down"></i></button>
          <div class="dropdown-menu" :class="{ show: dropdownOpen }">
            <a href="#" @click.prevent="downloadImage('4k')"><i class="fas fa-star"></i> 4K (UHD原图)</a>
            <a href="#" @click.prevent="downloadImage('fhd')"><i class="fas fa-desktop"></i> 全高清 (1920×1080)</a>
            <a href="#" @click.prevent="downloadImage('hd')"><i class="fas fa-laptop"></i> 高清 (1366×768)</a>
            <div class="divider"></div>
            <a href="#" @click.prevent="downloadImage('mobile')"><i class="fas fa-mobile-alt"></i> 手机 (1080×1920)</a>
            <a href="#" @click.prevent="downloadImage('mobile_s')"><i class="fas fa-mobile"></i> 手机 (768×1280)</a>
          </div>
        </div>
        <div class="donate-qr-wrapper">
          <button class="btn"><i class="fas fa-mug-hot"></i><span>打赏</span></button>
          <div class="qr-tooltip">
            <div class="qr-row">
              <div class="qr-item"><img src="https://img.hangdn.com/hd/wechat.png" alt="微信支付" /><span class="qr-label wechat"><i class="fab fa-weixin"></i> 微信支付</span></div>
              <div class="qr-item"><img src="https://img.hangdn.com/hd/alipay.png" alt="支付宝" /><span class="qr-label alipay"><i class="fab fa-alipay"></i> 支付宝</span></div>
            </div>
            <div class="qr-footer"><i class="fas fa-mug-hot"></i> 您的支持是我持续更新的动力</div>
          </div>
        </div>
        <button class="btn" @click="closePreview"><i class="fas fa-times"></i></button>
      </div>

      <div class="info-panel" :class="{ hidden: !toolbarVisible }">
        <div class="copyright">{{ previewItem?.copyright }}</div>
        <div class="date">{{ previewItem?.startdate || previewItem?.date }}</div>
        <div class="desc">{{ previewItem?.title }}</div>
      </div>
    </div>

    <!-- 评论弹窗 -->
    <div v-if="commentVisible" class="comment-overlay active" @click.self="closeComment">
      <div class="comment-modal">
        <div class="comment-header">
          <h2><i class="fas fa-comment-dots"></i> 留言反馈</h2>
          <button class="close-btn" @click="closeComment"><i class="fas fa-times"></i></button>
        </div>
        <div class="comment-body"><div id="tcomment"></div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// ============================================================
// 状态
// ============================================================
const allData = ref([])
const filteredData = ref([])
const displayData = ref([])
const currentPage = ref(1)
const PAGE_SIZE = 30
const loading = ref(false)
const hasMore = ref(true)
const searchKeyword = ref('')
const theme = ref('dark')
const navOpen = ref(false)
const gridRef = ref(null)
const previewImg = ref(null)
const showBackToTop = ref(false)

// 预览
const previewVisible = ref(false)
const previewItem = ref(null)
const previewIndex = ref(0)
const previewUrl = ref('')
const toolbarVisible = ref(true)
const dropdownOpen = ref(false)

// 评论
const commentVisible = ref(false)

// ============================================================
// ★★★ 工具函数 - 兼容历史和最新数据 ★★★
// ============================================================
function getImageUrl(item, resolution) {
  if (!item) return ''

  if (item.isHistory) {
    return item.urlbase || ''
  }

  if (item.urlbase && item.urlbase.startsWith('http')) {
    return item.urlbase
  }

  const resMap = {
    'thumb': '_400x240.jpg',
    'hd': '_1920x1200.jpg',
    'fhd': '_1920x1080.jpg',
    'uhd': '_UHD.jpg',
    '4k': '_UHD.jpg'
  }
  const suffix = resMap[resolution] || '_1920x1080.jpg'
  return 'https://www.bing.com' + (item.urlbase || '') + suffix
}

function getThumbUrl(item) {
  if (!item) return ''

  if (item.isHistory) {
    return item.thumb || item.urlbase || ''
  }

  if (item.urlbase && item.urlbase.startsWith('http')) {
    return item.urlbase
  }

  return 'https://www.bing.com' + (item.urlbase || '') + '_400x240.jpg'
}

// ============================================================
// 加载数据
// ============================================================
async function loadData() {
  try {
    const res = await fetch('/json/data.json?t=' + Date.now(), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const rawData = await res.json()

    allData.value = rawData.map(item => ({
      ...item,
      _loaded: false
    }))

    filteredData.value = []
    hasMore.value = true
    currentPage.value = 1
    displayData.value = []
    renderPage(1)
    console.log('✅ 加载数据成功，共 ' + allData.value.length + ' 条')
  } catch (err) {
    console.error('加载失败:', err)
  }
}

function renderPage(page) {
  const data = filteredData.value.length > 0 ? filteredData.value : allData.value
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  if (page > totalPages) {
    hasMore.value = false
    return
  }
  currentPage.value = page
  const start = (page - 1) * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, data.length)
  const items = data.slice(start, end)

  if (items.length === 0) {
    hasMore.value = false
    return
  }

  displayData.value = [...displayData.value, ...items]
  loading.value = false
}

function loadMore() {
  if (loading.value || !hasMore.value) return
  const data = filteredData.value.length > 0 ? filteredData.value : allData.value
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  if (currentPage.value >= totalPages) {
    hasMore.value = false
    return
  }
  loading.value = true
  const nextPage = currentPage.value + 1
  renderPage(nextPage)
}

// ============================================================
// 搜索
// ============================================================
function doSearch() {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    filteredData.value = []
    displayData.value = []
    hasMore.value = true
    currentPage.value = 1
    renderPage(1)
    return
  }
  filteredData.value = allData.value.filter(item => {
    const copyright = (item.copyright || '').toLowerCase()
    const title = (item.title || '').toLowerCase()
    const date = item.startdate || item.date || ''
    return copyright.indexOf(keyword) !== -1 ||
           title.indexOf(keyword) !== -1 ||
           date.indexOf(keyword) !== -1
  })
  displayData.value = []
  hasMore.value = true
  currentPage.value = 1
  renderPage(1)
}

function clearSearch() {
  searchKeyword.value = ''
  doSearch()
}

function resetSearch() {
  searchKeyword.value = ''
  filteredData.value = []
  displayData.value = []
  hasMore.value = true
  currentPage.value = 1
  renderPage(1)
  if (navOpen.value) toggleNav()
}

// ============================================================
// 导航
// ============================================================
function toggleNav() {
  navOpen.value = !navOpen.value
}

function closeNav() {
  if (navOpen.value) {
    navOpen.value = false
  }
}

// ============================================================
// 滚动
// ============================================================
function checkScroll() {
  const el = gridRef.value
  if (!el) return
  showBackToTop.value = el.scrollTop > 500

  if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
    loadMore()
  }
}

function scrollToTop() {
  if (gridRef.value) {
    gridRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// ============================================================
// 预览
// ============================================================
function openPreview(item) {
  const idx = allData.value.findIndex(d =>
    (d.startdate || d.date) === (item.startdate || item.date)
  )
  previewIndex.value = idx >= 0 ? idx : allData.value.indexOf(item)
  previewItem.value = allData.value[previewIndex.value]
  previewUrl.value = getImageUrl(previewItem.value, 'fhd')
  previewVisible.value = true
  toolbarVisible.value = true
  dropdownOpen.value = false
  document.body.style.overflow = 'hidden'

  updateTitle(previewItem.value)

  const overlay = document.querySelector('.preview-overlay')
  if (overlay) {
    overlay.style.setProperty('--bg-url', 'url(' + previewUrl.value + ')')
  }
}

function closePreview() {
  previewVisible.value = false
  toolbarVisible.value = true
  document.body.style.overflow = 'auto'
  document.title = '必应壁纸 | 每日一图，带你领略世界之美'
}

function prevPreview() {
  if (previewIndex.value > 0) {
    previewIndex.value--
    updatePreview()
  }
}

function nextPreview() {
  if (previewIndex.value < allData.value.length - 1) {
    previewIndex.value++
    updatePreview()
  }
}

function updatePreview() {
  previewItem.value = allData.value[previewIndex.value]
  previewUrl.value = getImageUrl(previewItem.value, 'fhd')
  updateTitle(previewItem.value)
  const overlay = document.querySelector('.preview-overlay')
  if (overlay) {
    overlay.style.setProperty('--bg-url', 'url(' + previewUrl.value + ')')
  }
}

function updateTitle(item) {
  const titleText = item.title || item.copyright || ''
  const dateText = item.startdate || item.date || ''
  if (titleText && dateText) {
    document.title = titleText + ' | ' + dateText + ' - 必应壁纸'
  } else if (titleText) {
    document.title = titleText + ' - 必应壁纸'
  } else if (dateText) {
    document.title = dateText + ' - 必应壁纸'
  } else {
    document.title = '必应壁纸 | 每日一图，带你领略世界之美'
  }
}

function onPreviewLoad() {}

// ★★★ 点击图片切换工具栏显隐 ★★★
function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
}

// ============================================================
// ★★★ 下载功能 ★★★
// ============================================================
function getDownloadFileName(item, resolution) {
  const urlbase = item.urlbase || ''
  let rawName = ''
  if (item.isHistory) {
    const urlParts = urlbase.split('/')
    rawName = urlParts[urlParts.length - 1] || ''
    rawName = rawName.replace(/\.(jpg|jpeg|png|webp)$/i, '')
    if (rawName) {
      const resMap = { '4k': 'UHD', 'fhd': '1920x1080', 'hd': '1366x768', 'mobile': '1080x1920', 'mobile_s': '768x1280' }
      const resSuffix = resMap[resolution] || 'UHD'
      const cleanName = rawName.replace(/_(UHD|1920x1080|1080x1920|1366x768|768x1280|400x240)$/i, '')
      return cleanName + '_' + resSuffix + '.jpg'
    }
    return 'wallpaper_' + (item.startdate || item.date || Date.now()) + '_' + resolution + '.jpg'
  }
  if (urlbase) {
    const match = urlbase.match(/[^/]+$/)
    if (match) {
      rawName = match[0]
      if (rawName.startsWith('th?id=')) {
        rawName = rawName.replace('th?id=', '')
      }
    }
  }
  if (rawName) {
    const resMap = { '4k': 'UHD', 'fhd': '1920x1080', 'hd': '1366x768', 'mobile': '1080x1920', 'mobile_s': '768x1280' }
    const resSuffix = resMap[resolution] || 'UHD'
    const cleanName = rawName.replace(/_(UHD|1920x1080|1080x1920|1366x768|768x1280|400x240)$/i, '')
    return cleanName + '_' + resSuffix + '.jpg'
  }
  return 'wallpaper_' + (item.startdate || item.date || Date.now()) + '_' + resolution + '.jpg'
}

// ★★★ 智能裁剪 - 手机比例 ★★★
async function smartCropDownload(blob, fileName, resolution) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = function() {
      try {
        const targetW = resolution === 'mobile_s' ? 768 : 1080
        const targetH = resolution === 'mobile_s' ? 1280 : 1920

        const imgW = img.width
        const imgH = img.height
        const targetRatio = targetW / targetH

        let cropX, cropY, cropWidth, cropHeight
        if (imgW / imgH > targetRatio) {
          cropHeight = imgH
          cropWidth = imgH * targetRatio
          cropX = (imgW - cropWidth) / 2
          cropY = 0
        } else {
          cropWidth = imgW
          cropHeight = imgW / targetRatio
          cropX = 0
          cropY = (imgH - cropHeight) / 2
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = targetW
        canvas.height = targetH

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, targetW, targetH)

        canvas.toBlob((croppedBlob) => {
          if (croppedBlob) {
            downloadBlob(croppedBlob, fileName)
            resolve()
          } else {
            reject('裁剪失败')
          }
        }, 'image/jpeg', 0.92)

        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn('裁剪失败，使用原图:', error)
        downloadBlob(blob, fileName)
        resolve()
      }
    }

    img.onerror = function() {
      downloadBlob(blob, fileName)
      resolve()
    }

    img.src = url
  })
}

function downloadImage(resolution) {
  if (!previewItem.value) return
  const item = previewItem.value
  const fileName = getDownloadFileName(item, resolution)
  const url = getImageUrl(item, 'uhd')
  const isMobile = resolution === 'mobile' || resolution === 'mobile_s'

  dropdownOpen.value = false

  fetch(url, { mode: 'cors' })
    .then(res => {
      if (!res.ok) throw new Error('网络请求失败')
      return res.blob()
    })
    .then(blob => {
      if (isMobile) {
        return smartCropDownload(blob, fileName, resolution)
      } else {
        downloadBlob(blob, fileName)
      }
    })
    .catch(() => {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
}

function downloadBlob(blob, fileName) {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  } catch (e) {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}

// ============================================================
// 主题切换
// ============================================================
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

// ============================================================
// 评论
// ============================================================
function openComment() {
  commentVisible.value = true
  document.body.style.overflow = 'hidden'
  if (navOpen.value) toggleNav()
  nextTick(() => {
    if (typeof twikoo !== 'undefined') {
      twikoo.init({
        envId: 'https://twikoo.hangdn.net',
        el: '#tcomment',
        lang: 'zh-CN',
      })
    }
  })
}

function closeComment() {
  commentVisible.value = false
  document.body.style.overflow = 'auto'
}

// ============================================================
// 生命周期
// ============================================================
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  theme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)

  loadData()
  document.title = '必应壁纸 | 每日一图，带你领略世界之美'

  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if (previewVisible.value) closePreview()
    if (commentVisible.value) closeComment()
  }
  if (e.key === 'ArrowLeft' && previewVisible.value) {
    e.preventDefault()
    prevPreview()
  }
  if (e.key === 'ArrowRight' && previewVisible.value) {
    e.preventDefault()
    nextPreview()
  }
}

window.openComment = openComment
</script>

<style>
/* ===== CSS 变量 ===== */
:root {
  --bg-primary: #0d0d1a;
  --bg-secondary: #1a1a2e;
  --bg-card: #1a1a2e;
  --text-primary: #fff;
  --text-secondary: rgba(255,255,255,0.5);
  --text-muted: rgba(255,255,255,0.25);
  --text-faint: rgba(255,255,255,0.12);
  --border-color: rgba(255,255,255,0.06);
  --border-hover: rgba(255,255,255,0.12);
  --nav-bg: rgba(13,13,26,0.92);
  --pagination-bg: rgba(13,13,26,0.85);
  --shadow-color: rgba(0,0,0,0.5);
  --overlay-bg: rgba(0,0,0,0.92);
  --card-bg: #1a1a2e;
  --input-bg: rgba(255,255,255,0.05);
  --input-border: rgba(255,255,255,0.06);
  --btn-hover: rgba(255,255,255,0.08);
  --scrollbar-thumb: rgba(255,255,255,0.15);
  --scrollbar-thumb-hover: rgba(255,255,255,0.25);
  --progress-bar: linear-gradient(90deg, #4fc3f7, #00e5ff);
  --accent-color: #4fc3f7;
  --accent-hover: rgba(79,195,247,0.2);
  --glass-bg: rgba(255,255,255,0.06);
  --glass-border: rgba(255,255,255,0.10);
  --glass-hover: rgba(255,255,255,0.14);
  --red-btn-bg: rgba(220,60,60,0.85);
  --red-btn-hover: rgba(200,40,40,0.95);
  --red-btn-text: #fff;
  --red-btn-shadow: rgba(220,60,60,0.25);
  --donate-bg: rgba(20,22,36,0.4);
  --donate-border: rgba(255,255,255,0.08);
}
[data-theme="light"] {
  --bg-primary: #f0f2f5;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1a1a2e;
  --text-secondary: rgba(0,0,0,0.5);
  --text-muted: rgba(0,0,0,0.25);
  --text-faint: rgba(0,0,0,0.1);
  --border-color: rgba(0,0,0,0.06);
  --border-hover: rgba(0,0,0,0.12);
  --nav-bg: rgba(255,255,255,0.92);
  --pagination-bg: rgba(255,255,255,0.85);
  --shadow-color: rgba(0,0,0,0.08);
  --overlay-bg: rgba(255,255,255,0.95);
  --card-bg: #ffffff;
  --input-bg: rgba(0,0,0,0.04);
  --input-border: rgba(0,0,0,0.08);
  --btn-hover: rgba(0,0,0,0.06);
  --scrollbar-thumb: rgba(0,0,0,0.15);
  --scrollbar-thumb-hover: rgba(0,0,0,0.25);
  --glass-bg: rgba(0,0,0,0.04);
  --glass-border: rgba(0,0,0,0.06);
  --glass-hover: rgba(0,0,0,0.10);
  --red-btn-bg: rgba(220,60,60,0.75);
  --red-btn-hover: rgba(200,40,40,0.9);
  --red-btn-text: #fff;
  --red-btn-shadow: rgba(220,60,60,0.2);
  --donate-bg: rgba(255,255,255,0.85);
  --donate-border: rgba(0,0,0,0.08);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: var(--bg-primary); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; transition: background 0.3s ease, color 0.3s ease; color: var(--text-primary); -webkit-tap-highlight-color: transparent !important; }

#app { width: 100%; height: 100%; }
.app { display: flex; flex-direction: column; width: 100%; height: 100vh; height: 100dvh; padding: 0; overflow: hidden; background: var(--bg-primary); }

/* ===== 汉堡按钮 ===== */
.nav-toggle { position: fixed; top: 12px; left: 12px; z-index: 1001; background: var(--nav-bg); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 20px; padding: 6px 12px; cursor: pointer; transition: 0.2s; line-height: 1; -webkit-tap-highlight-color: transparent; }
.nav-toggle:hover { background: var(--accent-hover); border-color: rgba(79,195,247,0.3); }

/* ===== 导航栏 ===== */
.navbar { position: fixed; top: 12px; left: 56px; z-index: 1000; background: var(--nav-bg); backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-width: 200px; opacity: 0; transform: translateY(-10px) scale(0.95); transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease; pointer-events: none; visibility: hidden; box-shadow: 0 8px 32px var(--shadow-color); max-width: 90vw; }
.navbar.toggle-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; visibility: visible; }
.navbar-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.navbar .logo { color: var(--text-primary); font-size: 17px; font-weight: 300; display: flex; align-items: center; gap: 8px; }
.navbar .logo span { color: var(--accent-color); font-weight: 600; }
.navbar .badge { color: var(--text-secondary); font-size: 12px; }
.navbar .search-box { display: flex; gap: 6px; width: 100%; position: relative; align-items: center; }
.navbar .search-box input { flex: 1; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 6px; padding: 5px 30px 5px 10px; color: var(--text-primary); font-size: 13px; outline: none; transition: 0.2s; }
.navbar .search-box input:focus { border-color: var(--accent-color); }
.navbar .search-box input::placeholder { color: var(--text-muted); }
.navbar .search-box .search-clear { position: absolute; right: 36px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; padding: 2px 4px; }
.navbar .search-box .search-clear:hover { color: var(--text-primary); }
.navbar .search-box .search-btn { background: var(--accent-hover); border: none; color: var(--accent-color); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: 0.2s; flex-shrink: 0; }
.navbar .search-box .search-btn:hover { background: rgba(79,195,247,0.25); color: var(--text-primary); }
.navbar .nav-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.navbar .nav-actions a, .navbar .nav-actions button { background: var(--input-bg); border: none; color: var(--text-secondary); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; }
.navbar .nav-actions a:hover, .navbar .nav-actions button:hover { background: var(--btn-hover); color: var(--text-primary); }

/* ===== 网格 ===== */
.grid { display: flex; flex-wrap: wrap; flex: 1; padding: 0; overflow-y: auto; min-height: 0; background: var(--bg-primary); align-content: flex-start; gap: 0; }
.grid::-webkit-scrollbar { width: 6px; }
.grid::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 3px; }
.grid::-webkit-scrollbar-thumb { background: var(--accent-color); border-radius: 3px; }
.grid::-webkit-scrollbar-thumb:hover { background: #81d4fa; }

/* ===== 卡片 ===== */
.card { position: relative; overflow: hidden; background: var(--bg-card); flex: 0 0 20%; aspect-ratio: 16 / 9; cursor: pointer; transition: background 0.3s ease; contain: strict; -webkit-tap-highlight-color: transparent; border-radius: 0; min-height: 0; }
.card img { width: 100%; height: 100%; object-fit: cover; display: block; position: relative; z-index: 2; opacity: 0; transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.9, 0.4, 1); background: var(--bg-card); -webkit-user-select: none; user-select: none; }
.card img.loaded { opacity: 1; }
.card:hover img { transform: scale(1.05); }
.card .placeholder-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; filter: blur(12px) brightness(0.7); transform: scale(1.04); transition: opacity 0.6s ease; z-index: 1; background-color: var(--bg-card); }
.card .placeholder-bg.hidden { opacity: 0; }
.card .info { position: absolute; bottom: 0; left: 0; right: 0; z-index: 3; padding: 14px 12px 10px; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%); color: #fff; opacity: 0; transition: opacity 0.25s ease; pointer-events: none; }
.card:hover .info { opacity: 1; }
.card .info .date { font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 600; }
.card .info .title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ===== 加载状态 ===== */
.loading-indicator { flex: 0 0 100%; text-align: center; padding: 20px 0 30px; color: var(--text-muted); font-size: 14px; }
.loading-indicator i { animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.footer-end { flex: 0 0 100%; text-align: center; padding: 30px 20px 40px; color: var(--text-faint); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px; opacity: 0; animation: fadeInUp 0.6s ease forwards; }
.footer-end .footer-line { width: 60px; height: 1px; background: var(--text-faint); border: none; margin: 0 auto; }
.footer-end .footer-icon { font-size: 24px; color: var(--text-faint); opacity: 0.5; }
.footer-end .footer-text { color: var(--text-muted); font-size: 13px; letter-spacing: 0.5px; }
.footer-end .footer-text span { color: var(--accent-color); opacity: 0.6; }
.footer-end .footer-sub { color: var(--text-faint); font-size: 11px; margin-top: 2px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.empty { flex: 0 0 100%; text-align: center; padding: 80px 20px; color: var(--text-secondary); }
.empty .icon { font-size: 40px; margin-bottom: 10px; }

.back-to-top { position: fixed; bottom: 80px; right: 20px; z-index: 100; background: var(--pagination-bg); backdrop-filter: blur(12px); border: 1px solid var(--border-color); border-radius: 50%; width: 44px; height: 44px; color: var(--text-primary); font-size: 18px; cursor: pointer; transition: 0.3s ease; box-shadow: 0 4px 20px var(--shadow-color); display: none; align-items: center; justify-content: center; }
.back-to-top { display: flex; }

/* ===== 预览 - 半透明背景 ===== */
.preview-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; cursor: default; -webkit-tap-highlight-color: transparent; }
.preview-overlay.active { display: flex; }
.preview-overlay::before { content: ''; position: fixed; top: -10px; left: -10px; right: -10px; bottom: -10px; background: center/cover no-repeat; filter: blur(30px) brightness(0.4); z-index: -1; transform: scale(1.1); transition: background-image 0.4s ease; }

.preview-container { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: default; overflow: hidden; }
.preview-image { width: 100vw; height: 100vh; object-fit: cover; object-position: 50% 50%; border-radius: 0; box-shadow: none; background: transparent; pointer-events: auto; cursor: pointer; z-index: 5; position: relative; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; transition: object-position 0.8s cubic-bezier(0.25,0.46,0.45,0.94); }

/* ===== 箭头 ===== */
.arrow { position: fixed; top: 50%; transform: translateY(-50%); background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); color: rgba(255,255,255,0.7); font-size: 28px; padding: 18px 14px; cursor: pointer; transition: all 0.25s ease; border-radius: 12px; z-index: 10; -webkit-tap-highlight-color: transparent !important; outline: none !important; box-shadow: 0 4px 20px rgba(0,0,0,0.3); user-select: none; line-height: 1; }
.arrow:hover { color: #fff; background: var(--glass-hover); border-color: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.04); }
.arrow:active { transform: translateY(-50%) scale(0.94); }
.arrow-left { left: 20px; }
.arrow-right { right: 20px; }

/* ===== 工具栏 ===== */
.toolbar { position: fixed; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; z-index: 20; flex-wrap: wrap; justify-content: flex-end; transition: opacity 0.3s ease; -webkit-tap-highlight-color: transparent; }
.toolbar.hidden { opacity: 0 !important; pointer-events: none !important; }
.toolbar .btn { background: var(--red-btn-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(220,60,60,0.25); border-radius: 10px; color: var(--red-btn-text); padding: 7px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.25s ease; display: inline-flex; align-items: center; gap: 6px; font-family: inherit; white-space: nowrap; text-decoration: none; outline: none !important; letter-spacing: 0.3px; box-shadow: 0 2px 16px var(--red-btn-shadow); }
.toolbar .btn i { font-size: 13px; color: #fff; }
.toolbar .btn:hover { background: var(--red-btn-hover); border-color: rgba(200,40,40,0.5); color: #fff; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(220,60,60,0.35); }
.toolbar .btn:active { transform: scale(0.96); }

/* ===== 下拉菜单 ===== */
.dropdown { position: relative; display: inline-block; }
.dropdown .btn { padding-right: 10px; }
.dropdown .btn i.fa-chevron-down { font-size: 10px; margin-left: 2px; opacity: 0.9; transition: transform 0.25s ease; }
.dropdown:hover .btn i.fa-chevron-down { transform: rotate(180deg); }

.dropdown-menu { display: block; position: absolute; top: calc(100% + 8px); right: 0; background: #ffffff; backdrop-filter: none; -webkit-backdrop-filter: none; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 6px 0; min-width: 180px; box-shadow: 0 12px 48px rgba(0,0,0,0.25); z-index: 30; opacity: 0; visibility: hidden; transform: translateY(-4px) scale(0.96); transition: all 0.2s cubic-bezier(0.2,0.9,0.4,1); pointer-events: none; overflow: hidden; }
.dropdown-menu.show { opacity: 1; visibility: visible; transform: translateY(0) scale(1); pointer-events: auto; }
.dropdown-menu a { display: flex; align-items: center; gap: 10px; padding: 9px 18px; color: #1a1a2e; text-decoration: none; font-size: 13px; font-weight: 400; transition: all 0.15s ease; white-space: nowrap; cursor: pointer; letter-spacing: 0.2px; background: transparent; }
.dropdown-menu a i { font-size: 14px; width: 18px; color: #888; transition: color 0.15s; }
.dropdown-menu a:hover { background: #d63031; color: #ffffff; }
.dropdown-menu a:hover i { color: #ffffff; }
.dropdown-menu .divider { height: 1px; background: rgba(0,0,0,0.06); margin: 4px 12px; }

/* ===== 打赏 ===== */
.donate-qr-wrapper { position: relative; display: inline-block; }
.donate-qr-wrapper .qr-tooltip { display: block; position: absolute; top: calc(100% + 8px); right: 0; background: var(--donate-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--donate-border); border-radius: 12px; padding: 14px 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.5); z-index: 30; min-width: 280px; opacity: 0; visibility: hidden; transform: translateY(-4px) scale(0.96); transition: all 0.2s cubic-bezier(0.2,0.9,0.4,1); pointer-events: none; }
.donate-qr-wrapper:hover .qr-tooltip { opacity: 1; visibility: visible; transform: translateY(0) scale(1); pointer-events: auto; }
.donate-qr-wrapper .qr-tooltip::before { content: ''; position: absolute; bottom: 100%; right: 24px; border: 8px solid transparent; border-bottom-color: var(--donate-bg); }
.donate-qr-wrapper .qr-tooltip .qr-row { display: flex; gap: 14px; justify-content: center; align-items: center; }
.donate-qr-wrapper .qr-tooltip .qr-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.donate-qr-wrapper .qr-tooltip .qr-item img { width: 110px; height: 110px; display: block; border-radius: 8px; background: #fff; padding: 4px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); transition: transform 0.2s; }
.donate-qr-wrapper .qr-tooltip .qr-item img:hover { transform: scale(1.02); }
.donate-qr-wrapper .qr-tooltip .qr-item .qr-label { color: var(--text-secondary); font-size: 11px; font-weight: 500; letter-spacing: 0.3px; }
.donate-qr-wrapper .qr-tooltip .qr-item .qr-label.wechat { color: #07c160; }
.donate-qr-wrapper .qr-tooltip .qr-item .qr-label.alipay { color: #1677ff; }
.donate-qr-wrapper .qr-tooltip .qr-footer { text-align: center; color: var(--text-muted); font-size: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); letter-spacing: 0.5px; }

/* ===== 信息面板 ===== */
.info-panel { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); max-width: 90%; text-align: center; pointer-events: none; text-shadow: 0 2px 20px rgba(0,0,0,0.9); z-index: 5; transition: opacity 0.3s ease; }
.info-panel.hidden { opacity: 0 !important; pointer-events: none !important; }
.info-panel .copyright { font-size: 20px; color: rgba(255,255,255,0.9); line-height: 1.6; font-weight: 500; letter-spacing: 0.5px; }
.info-panel .date { font-size: 16px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 400; }
.info-panel .desc { font-size: 17px; color: rgba(255,255,255,0.55); margin-top: 6px; max-width: 600px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.7; font-weight: 400; }

/* ===== 评论 ===== */
.comment-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); justify-content: center; align-items: center; animation: fadeIn 0.25s ease; }
.comment-overlay.active { display: flex; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.comment-modal { background: #ffffff !important; border-radius: 16px; width: 92%; max-width: 720px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3); border: 1px solid #e8e8e8; animation: slideUp 0.3s ease; overflow: hidden; }
.comment-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 14px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.comment-header h2 { font-size: 18px; font-weight: 600; color: #1a1a2e; display: flex; align-items: center; gap: 10px; }
.comment-header h2 i { color: #4fc3f7; }
.comment-header .close-btn { background: none; border: none; color: #999; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: 0.2s; }
.comment-header .close-btn:hover { background: #f0f0f0; color: #333; }
.comment-body { flex: 1; overflow-y: auto; padding: 20px 24px 16px; background: #ffffff !important; }
.comment-body::-webkit-scrollbar { width: 4px; }
.comment-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

/* ===== 响应式 ===== */
@media (max-width: 1200px) { .card { flex: 0 0 20%; } }
@media (max-width: 992px) { .card { flex: 0 0 25%; } }
@media (max-width: 768px) {
  .card { flex: 0 0 33.333%; }
  .navbar { left: 52px; min-width: 160px; padding: 12px 14px; top: 10px; }
  .nav-toggle { font-size: 18px; padding: 5px 10px; top: 10px; left: 10px; }
  .arrow { font-size: 20px; padding: 14px 10px; }
  .arrow-left { left: 8px; }
  .arrow-right { right: 8px; }
  .toolbar { top: 12px; right: 12px; gap: 6px; }
  .toolbar .btn { font-size: 11px; padding: 5px 10px; }
  .toolbar .btn span { display: none; }
  .info-panel .copyright { font-size: 17px; }
  .info-panel .desc { font-size: 14px; -webkit-line-clamp: 1; }
  .info-panel .date { font-size: 13px; }
}
@media (max-width: 576px) {
  .card { flex: 0 0 50%; }
  .arrow { font-size: 18px; padding: 12px 8px; }
  .arrow-left { left: 4px; }
  .arrow-right { right: 4px; }
  .toolbar .btn span { display: none; }
  .toolbar .btn { padding: 5px 10px; }
  .toolbar .btn i { font-size: 14px; }
  .dropdown-menu { min-width: 130px; right: -6px; }
  .dropdown-menu a { font-size: 11px; padding: 6px 12px; }
  .back-to-top { width: 34px; height: 34px; font-size: 14px; bottom: 60px; right: 10px; }
  .info-panel .copyright { font-size: 15px; }
  .info-panel .desc { font-size: 13px; }
  .info-panel .date { font-size: 12px; }
}
</style>
