// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 真正发包前验证固定版本的下载入口，防止主包上架后背景缺失。
import {readFile} from 'node:fs/promises';
import {downloadAsset,isDownloadAsset,mapAssets} from './install-assets.mjs';
try{
 const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const {files}=JSON.parse(await readFile(new URL('../ASSET-MANIFEST.json',import.meta.url),'utf8'));
 const items=files.filter(item=>isDownloadAsset(item.path));
 await mapAssets(items,async item=>{await downloadAsset(item,version);});
 console.log(`已核对 GitHub v${version} 的 ${items.length} 个按需素材，大小与内容摘要全部一致。`);
}catch(error){console.error(error.message);process.exitCode=1;}
