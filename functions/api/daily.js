export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true";
  const size = parseInt(url.searchParams.get("size")) || 0;

  const SUPPORTED_SIZES = [400, 640, 768, 1024, 1366, 1920, 2560];
  const SIZE_MAP = {
    400: '400x240',
    640: '640x360',
    768: '768x432',
    1024: '1024x576',
    1366: '1366x768',
    1920: '1920x1080',
    2560: '2560x1440',
  };

  const allowedFormats = ["webp", "jpeg", "original"];
  if (!allowedFormats.includes(format)) {
    return new Response("Invalid format parameter", { status: 400 });
  }

  if (size < 0 || size > 3840) {
    return new Response("Invalid size parameter, must be between 0 and 3840", { status: 400 });
  }

  let actualSize = size;
  if (size > 0 && !SUPPORTED_SIZES.includes(size)) {
    const closest = SUPPORTED_SIZES.reduce((prev, curr) => {
      return Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev;
    });
    actualSize = closest;
  }

  try {
    const host = url.origin;
    const jsonUrl = `${host}/public/json/data.json`;

    const fetchResp = await fetch(jsonUrl, {
      headers: { 'User-Agent': 'CloudflarePages-Function' }
    });
    if (!fetchResp.ok) {
      return new Response("Failed to load data.json", { status: 502 });
    }

    const data = await fetchResp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response("No data found", { status: 404 });
    }

    data.sort((a, b) => b.startdate.localeCompare(a.startdate));
    const latest = data[0];

    const isHistory = latest.isHistory === true;

    let imageUrl;
    let imageUrls = [];

    if (isHistory) {
      imageUrl = latest.urlbase || '';
      imageUrls = [imageUrl, latest.thumb || imageUrl];
    } else {
      const baseUrl = 'https://www.bing.com';
      if (actualSize > 0 && SIZE_MAP[actualSize]) {
        imageUrl = `${baseUrl}${latest.urlbase}_${SIZE_MAP[actualSize]}.jpg`;
      } else {
        imageUrl = `${baseUrl}${latest.urlbase}_UHD.jpg`;
      }
      imageUrls = [
        imageUrl,
        `${baseUrl}${latest.urlbase}_1920x1080.jpg`,
        `${baseUrl}${latest.urlbase}_1920x1200.jpg`,
      ];
    }

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    for (const url of imageUrls) {
      if (!url) continue;
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'CloudflarePages-Function' }
        });
        if (resp.ok) {
          return new Response(resp.body, {
            headers: {
              "Content-Type": resp.headers.get("Content-Type") || "image/jpeg",
              "Cache-Control": "public, max-age=10800",
              "X-Image-Date": latest.startdate,
              "X-Image-Copyright": encodeURIComponent(latest.copyright || ''),
              "X-Image-Source": isHistory ? 'history' : 'bing'
            },
          });
        }
      } catch (e) {
        // 继续
      }
    }

    return new Response("Image not found", { status: 404 });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
