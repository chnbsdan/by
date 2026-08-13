// functions/api/image.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const date = url.searchParams.get('date');
  const format = url.searchParams.get('format') || 'webp';
  const redirect = url.searchParams.get('redirect') === 'true';

  if (!date) {
    return new Response(JSON.stringify({
      error: '缺少 date 参数',
      example: '/api/image?date=20260731'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const digits = dateStr.replace(/\D/g, '');
    if (digits.length === 8) {
      return digits;
    }
    return dateStr;
  }

  try {
    const host = url.origin;
    const jsonUrl = `${host}/json/data.json`;

    const fetchResp = await fetch(new Request(jsonUrl, request));
    if (!fetchResp.ok) {
      return new Response(JSON.stringify({
        error: '无法加载壁纸数据'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data = await fetchResp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({
        error: '暂无壁纸数据'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedInput = normalizeDate(date);
    const item = data.find(w => w.startdate === normalizedInput);

    if (!item) {
      const recentDates = data.slice(0, 10).map(w => w.startdate);
      return new Response(JSON.stringify({
        error: `未找到 ${date} 的壁纸`,
        available_dates: recentDates,
        hint: '可用日期格式: YYYYMMDD (如 20260731)'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ★★★ 判断是历史数据还是必应数据 ★★★
    const isHistory = item.isHistory === true;

    // ★★★ 构造图片 URL ★★★
    let imageUrls = [];
    if (isHistory) {
      // 历史数据：urlbase 已经是完整链接，直接使用
      imageUrls = [
        item.urlbase || '',
        item.thumb || item.urlbase || ''
      ];
    } else {
      // 必应数据：拼接域名
      const baseUrl = 'https://www.bing.com';
      imageUrls = [
        `${baseUrl}${item.urlbase}_UHD.jpg`,
        `${baseUrl}${item.urlbase}_1920x1080.jpg`,
        `${baseUrl}${item.urlbase}_1920x1200.jpg`,
      ];
    }

    // ★★★ 降级加载函数 ★★★
    async function fetchImageWithFallback(urls, redirect) {
      for (const imageUrl of urls) {
        if (!imageUrl) continue;
        try {
          const resp = await fetch(imageUrl, {
            headers: { 'User-Agent': 'CloudflarePages-Function' }
          });
          if (resp.ok) {
            if (redirect) {
              return Response.redirect(imageUrl, 302);
            }
            return new Response(resp.body, {
              headers: {
                'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=10800',
                'X-Image-Date': item.startdate,
                'X-Image-Copyright': encodeURIComponent(item.copyright || ''),
                'X-Image-Source': isHistory ? 'history' : 'bing'
              }
            });
          }
        } catch (e) {
          // 继续尝试下一个格式
        }
      }
      // 所有格式都失败
      return new Response(JSON.stringify({
        error: '所有格式的图片都无法获取',
        date: date
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return await fetchImageWithFallback(imageUrls, redirect);

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
