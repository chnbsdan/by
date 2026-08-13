// functions/api/random.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") === "true";
  const host = url.origin;

  try {
    const jsonUrl = `${host}/json/data.json`;
    const resp = await fetch(new Request(jsonUrl, request));
    if (!resp.ok) {
      return new Response('Failed to load data.json', { status: 502 });
    }

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      return new Response('No data found', { status: 404 });
    }

    // ★★★ 随机选一张 ★★★
    const randomItem = data[Math.floor(Math.random() * data.length)];
    const isHistory = randomItem.isHistory === true;

    // ★★★ 构造图片 URL ★★★
    let imageUrls = [];
    if (isHistory) {
      // 历史数据：直接使用完整链接
      imageUrls = [
        randomItem.urlbase || '',
        randomItem.thumb || randomItem.urlbase || ''
      ];
    } else {
      // 必应数据：拼接域名
      const baseUrl = 'https://www.bing.com';
      imageUrls = [
        `${baseUrl}${randomItem.urlbase}_UHD.jpg`,
        `${baseUrl}${randomItem.urlbase}_1920x1080.jpg`,
        `${baseUrl}${randomItem.urlbase}_1920x1200.jpg`,
      ];
    }

    // ★★★ 降级加载函数 ★★★
    async function fetchImageWithFallback(urls, redirect) {
      for (const imageUrl of urls) {
        if (!imageUrl) continue;
        try {
          const imgResp = await fetch(imageUrl, {
            headers: { 'User-Agent': 'CloudflarePages-Function' }
          });
          if (imgResp.ok) {
            if (redirect) {
              return Response.redirect(imageUrl, 302);
            }
            return new Response(imgResp.body, {
              headers: {
                'Content-Type': imgResp.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'X-Image-Date': randomItem.startdate,
                'X-Image-Copyright': encodeURIComponent(randomItem.copyright || ''),
                'X-Image-Source': isHistory ? 'history' : 'bing'
              }
            });
          }
        } catch (e) {
          // 继续尝试下一个格式
        }
      }
      // 所有格式都失败
      return new Response('Image not found', { status: 404 });
    }

    return await fetchImageWithFallback(imageUrls, redirect);

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
