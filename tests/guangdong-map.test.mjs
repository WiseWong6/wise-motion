// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {createFrameDocument, frameScriptsFor} from '../remotion/frame-document.mjs';

const root = new URL('../', import.meta.url);
const geo = JSON.parse(await readFile(new URL('vendor/guangdong-map/guangdong-cities.geojson', root), 'utf8'));
const registry = JSON.parse(await readFile(new URL('catalog/registry.json', root), 'utf8'));
const definition = registry.effects.find(effect => effect.id === 'map-paint');
const names = '广州 韶关 深圳 珠海 汕头 佛山 江门 湛江 茂名 肇庆 惠州 梅州 汕尾 河源 阳江 清远 东莞 中山 潮州 揭阳 云浮'.split(' ').map(name => name + '市');

function inRing(point, ring) {
  const [x,y] = point;
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
const contains = (feature, point) => feature.geometry.coordinates.some(([outer,...holes]) => inRing(point,outer) && holes.every(ring => !inRing(point,ring)));
const edges = feature => new Set(feature.geometry.coordinates.flatMap(polygon => polygon.flatMap(ring => ring.slice(1).map((point,i) => [JSON.stringify(ring[i]),JSON.stringify(point)].sort().join('|')))));

test('开放地图包含完整 21 市、闭合边界与岛屿，城市坐标归属正确且相邻市共用边界', () => {
  assert.deepEqual(geo.features.map(feature => feature.properties.name), names);
  assert.equal(new Set(geo.features.map(feature => feature.properties.osm_relation)).size,21);
  for (const feature of geo.features) for (const polygon of feature.geometry.coordinates) for (const ring of polygon) {
    assert.ok(ring.length>=4);
    assert.deepEqual(ring[0],ring.at(-1));
    for (const [lon,lat] of ring) assert.ok(Number.isFinite(lon) && Number.isFinite(lat) && lon>109 && lon<118 && lat>20 && lat<26);
  }
  const lookup = new Map(geo.features.map(feature => [feature.properties.name,feature]));
  // 使用源站的城市标注位置，防止轮廓与名称错配。
  const centers = {'广州市':[113.2589581,23.1288429],'韶关市':[113.5922116,24.8136095],'深圳市':[114.0545429,22.5445741],'珠海市':[113.5721327,22.273734],'汕头市':[116.6775856,23.3563921],'佛山市':[113.1159558,23.0239788],'江门市':[113.0761073,22.5816619],'湛江市':[110.3548318,21.2737079],'茂名市':[110.9209511,21.6656961],'肇庆市':[112.4603629,23.0501661],'惠州市':[114.4127007,23.1125153],'梅州市':[116.1171428,24.2918414],'汕尾市':[115.3704551,22.7891796],'河源市':[114.6954482,23.746777],'阳江市':[111.9776773,21.8603337],'清远市':[113.0505994,23.6832984],'东莞市':[113.7452332,23.0183568],'中山市':[113.3872302,22.5197073],'潮州市':[116.6204223,23.656593],'揭阳市':[116.3680354,23.553156],'云浮市':[112.039299,22.9177445]};
  for (const [name,point] of Object.entries(centers)) assert.deepEqual(geo.features.filter(feature => contains(feature,point)).map(feature => feature.properties.name),[name]);
  for (const [a,b] of [['广州市','佛山市'],['深圳市','东莞市'],['潮州市','汕头市']]) {
    const left=edges(lookup.get(a)),right=edges(lookup.get(b));
    assert.ok([...left].filter(edge => right.has(edge)).length>2,a+'与'+b+'的共同市界不应分离');
  }
  assert.ok(lookup.get('珠海市').geometry.coordinates.length>1);
  assert.ok(lookup.get('汕头市').geometry.coordinates.length>1);
  assert.ok(lookup.get('湛江市').geometry.coordinates.length>1);
});

test('地图来源、许可和随包数据一致，内嵌轮廓可从本地数据重建', async () => {
  const source=JSON.parse(await readFile(new URL('vendor/guangdong-map/SOURCE.json',root),'utf8'));
  assert.equal(source.license,'ODbL-1.0');
  assert.match(source.coastline_query,/natural.*coastline/);
  assert.equal(geo.attribution,source.copyright);
  for (const [name,record] of Object.entries(source.files)) {
    const bytes=await readFile(new URL('vendor/guangdong-map/'+name,root));
    assert.equal(bytes.length,record.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
  }
  assert.match(definition.source.reference.url,/openstreetmap\.org\/copyright$/);
  const notice=await readFile(new URL('NOTICE.md',root),'utf8');
  assert.doesNotMatch(notice,/高德|DataV|GeoAtlas/);
  assert.match(notice,/广东 21 市分区几何轮廓.*OpenStreetMap.*ODbL 1\.0/);
  execFileSync('python3',[fileURLToPath(new URL('scripts/build-guangdong-map.py',root)),'--check']);
});

test('地图与视频复用离线一致，轮廓常驻、逐区上色、倒拖和末帧稳定', async () => {
  const catalog=new JSDOM('<!doctype html><div id="root"></div>',{runScripts:'outside-only',pretendToBeVisual:true});
  const video=new JSDOM(createFrameDocument({assetBaseUrl:root.href,definition}),{runScripts:'outside-only',pretendToBeVisual:true});
  let player,session;
  try {
    for (const dom of [catalog,video]) {
      dom.window.fetch=()=>{throw new Error('地图绘制不应请求网络');};
      for (const file of frameScriptsFor(definition)) dom.window.eval(await readFile(new URL(file,root),'utf8'));
      dom.window.anime.engine.pause();
    }
    const stage=catalog.window.document.getElementById('root');
    player=catalog.window.MotionRuntime.create(stage,definition);
    video.window.eval(video.window.document.querySelector('script:not([src])').textContent);
    session=await video.window.__wiseMotionCreateSession({definition});
    const paths=[...stage.querySelectorAll('path')];
    assert.deepEqual(paths.map(node=>node.dataset.city),names);
    assert.ok(paths.every(node=>node.getAttribute('fill-rule')==='evenodd'));
    assert.ok(stage.textContent.includes('© OpenStreetMap contributors'));
    assert.equal(stage.querySelectorAll('img,image,canvas,audio,video').length,0);
    const shapes=paths.map(node=>node.getAttribute('d'));
    let middle,final;
    for (const time of [0,220,900,1800,0,900,1800,2500]) {
      player.seek(time);await session.draw(time,time,'exact');
      const svg=stage.querySelector('svg').outerHTML;
      assert.equal(svg,session.stage.querySelector('svg').outerHTML);
      assert.deepEqual(paths.map(node=>node.getAttribute('d')),shapes);
      assert.ok(paths.every(node=>node.getAttribute('stroke-opacity')==='.35'));
      if(time===0)assert.ok(paths.every(node=>Number(node.getAttribute('fill-opacity'))===0));
      if(time===220){assert.ok(Number(paths[0].getAttribute('fill-opacity'))>0);assert.equal(Number(paths.at(-1).getAttribute('fill-opacity')),0);}
      if(time===900){if(middle)assert.equal(svg,middle);middle=svg;}
      if(time>=1800){if(final)assert.equal(svg,final);final=svg;assert.ok(paths.every(node=>Number(node.getAttribute('fill-opacity'))>0));}
    }
  } finally {
    player?.destroy();session?.destroy();
    for (const dom of [catalog,video]) {dom.window.anime?.engine.pause();dom.window.close();}
  }
});
