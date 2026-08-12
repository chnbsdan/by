// scripts/update-data.ts
import fs from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

const endpoint = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&mkt=zh-CN';
// ★★★ 路径改成 public/json/data.json ★★★
const dataFilePath = join(__dirname, '..', 'public', 'json', 'data.json');

fetch(endpoint)
    .then((rsp) => rsp.json())
    .then(({ images }: any) => {
        const str = fs.readFileSync(dataFilePath, 'utf8');
        const result = JSON.parse(str);

        const data = images
            .filter((item) => !result.find(({ startdate }) => item.enddate === startdate))
            .map((item) => ({
                startdate: item.enddate,
                copyright: item.copyright,
                urlbase: item.urlbase,
                title: item.title,
            }));

        console.log('📡 请求的 API:', endpoint);
        console.log('📊 返回的图片数:', images.length);
        console.log('📦 新增数据:', data);

        result.push(...data);
        result.sort((a, b) => b.startdate - a.startdate);
        fs.writeFileSync(dataFilePath, JSON.stringify(result), 'utf8');
        console.log('✅ 写入完成');
    });
