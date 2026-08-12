<template>
  <div class="app">
    <!-- 导航栏 -->
    <button class="nav-toggle" @click="toggleNav">
      <i :class="navOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>
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
        <img :src="getThumbUrl(item)" :alt="item.copyright || item.date" loading="lazy" crossorigin="anonymous" @load="item._loaded = true" @error="item._loaded = true" />
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
        <img ref="previewImg" class="preview-image" :src="previewUrl" alt="预览" crossorigin="anonymous" @load="onPreviewLoad" />
      </div>

      <div class="toolbar">
        <a href="/" class="btn"><i class="fas fa-home"></i> <span>首页</span></a>
        <div class="dropdown">
          <button class="btn"><i class="fas fa-download"></i> <span>下载</span> <i class="fas fa-chevron-down"></i></button>
          <div class="dropdown-menu">
            <a href="#" @click.prevent="downloadImage('4k')"><i class="fas fa-star"></i> 4K (UHD原图)</a>
            <a href="#" @click.prevent="downloadImage('fhd')"><i class="fas fa-desktop"></i> 全高清 (1920×1080)</a>
            <a href="#" @click.prevent="downloadImage('hd')"><i class="fas fa-laptop"></i> 高清 (1366×768)</a>
            <div class="divider"></div>
            <a href="#" @click.prevent="downloadImage('mobile')"><i class="fas fa-mobile-alt"></i> 手机 (1080×1920)</a>
            <a href="#" @click.prevent="downloadImage('mobile_s')"><i class="fas fa-mobile"></i> 手机 (768×1280)</a>
          </div>
        </div>
        <button class="btn" @click="closePreview"><i class="fas fa-times"></i></button>
      </div>

      <div class="info-panel">
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

// 评论
const commentVisible = ref(false)

// ============================================================
// 工具函数
// ============================================================
function getImageUrl(item, resolution) {
  if (!item) return ''
  if (item.isHistory) return item.urlbase || ''
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
  if (item.isHistory) return item.thumb || item.urlbase || ''
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
  // 鼠标离开时由 CSS 控制
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
  document.body.style.overflow = 'hidden'
  
  // 更新标题
  updateTitle(previewItem.value)
  
  // 更新背景
  const overlay = document.querySelector('.preview-overlay')
  if (overlay) {
    overlay.style.setProperty('--bg-url', 'url(' + previewUrl.value + ')')
  }
}

function closePreview() {
  previewVisible.value = false
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

// 更新标题
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

function onPreviewLoad() {
  // 图片加载完成
}

// ============================================================
// 下载
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

function downloadImage(resolution) {
  if (!previewItem.value) return
  const item = previewItem.value
  const fileName = getDownloadFileName(item, resolution)
  const url = getImageUrl(item, 'uhd')
  
  fetch(url, { mode: 'cors' })
    .then(res => {
      if (!res.ok) throw new Error('网络请求失败')
      return res.blob()
    })
    .then(blob => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(link.href), 3000)
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

// 暴露给全局
window.openComment = openComment
</script>