// functions/api/list.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page')) || 1;
  const pageSize = parseInt(url.searchParams.get('size')) || 30;

  if (page < 1) {
    return new Response(JSON.stringify({
      error: 'page 参数必须大于等于 1'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (pageSize < 1 || pageSize > 100) {
    return new Response(JSON.stringify({
      error: 'size 参数必须在 1-100 之间'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const host = url.origin;
    const jsonUrl = `${host}/json/data.json`;
    const resp = await fetch(new Request(jsonUrl, request));
    if (!resp.ok) {
      return new Response(JSON.stringify({
        error: '无法加载壁纸数据'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({
        error: '暂无壁纸数据'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ★★★ 按 startdate 降序排序 ★★★
    data.sort((a, b) => b.startdate.localeCompare(a.startdate));

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const items = data.slice(start, end);

    // ★★★ 格式化数据，统一返回格式 ★★★
    const formattedItems = items.map(item => {
      const isHistory = item.isHistory === true;
      let imageUrl = '';
      let thumbUrl = '';

      if (isHistory) {
        // 历史数据：直接使用完整链接
        imageUrl = item.urlbase || '';
        thumbUrl = item.thumb || item.urlbase || '';
      } else {
        // 必应数据：拼接域名
        const baseUrl = 'https://www.bing.com';
        imageUrl = `${baseUrl}${item.urlbase}_UHD.jpg`;
        thumbUrl = `${baseUrl}${item.urlbase}_400x240.jpg`;
      }

      return {
        date: item.startdate,
        copyright: item.copyright || '',
        title: item.title || '',
        url: imageUrl,
        thumb: thumbUrl,
        isHistory: isHistory
      };
    });

    return new Response(JSON.stringify({
      code: 0,
      data: {
        items: formattedItems,
        page: currentPage,
        pageSize: pageSize,
        total: total,
        totalPages: totalPages,
        hasMore: currentPage < totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '服务器错误',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
