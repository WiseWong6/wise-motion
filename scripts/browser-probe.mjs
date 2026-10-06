// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {openBrowser} from '@remotion/renderer';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createFrameDocument} from '../remotion/frame-document.mjs';
const root=path.resolve(import.meta.dirname,'..');
export async function openProbe(){
  const temporary=await mkdtemp(path.join(tmpdir(),'wise-probe-'));
  let browser;
  const close=async()=>{try{await browser?.close({silent:true});}finally{await rm(temporary,{recursive:true,force:true});}};
  try{
    const host=path.join(temporary,'host.html');await writeFile(host,'<!doctype html><style>html,body{margin:0;background:transparent}</style>');
    browser=await openBrowser('chrome',{chromeMode:'headless-shell',chromiumOptions:{disableWebSecurity:true},logLevel:'error'});
    const page=await browser.newPage({context:undefined,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog(){}});
    await page.setViewport({width:640,height:360,deviceScaleFactor:1});await page.goto({url:pathToFileURL(host).href,timeout:60000});
    const client=page._client();await client.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
    return {page,browser,close,async load(definition,{transparent=false,theme='dark'}={}){
      const html=createFrameDocument({assetBaseUrl:pathToFileURL(root+path.sep).href,definition,transparent,theme});
      await page.evaluate(async({html,definition,theme})=>{
        window.probeSession?.destroy();document.querySelector('iframe')?.remove();
        const frame=document.createElement('iframe');frame.style.cssText='width:640px;height:360px;border:0;display:block';
        await new Promise((resolve,reject)=>{frame.onload=()=>{if(frame.contentDocument.URL!=='about:blank')resolve();};frame.onerror=reject;document.body.append(frame);frame.srcdoc=html;});
        window.probeSession=await frame.contentWindow.__wiseMotionCreateSession({definition,theme});
      },{html,definition,theme});
    },async draw(time){await page.evaluate(async time=>{await window.probeSession.draw(time,time,'exact');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},time);},async png(){
      const {value}=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});return Buffer.from(value.data,'base64');
    },async alpha(bytes){return page.evaluate(async base64=>{
      const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let visible=0,edge=0;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const a=data[(y*canvas.width+x)*4+3];if(a>0){visible++;if(x<4||x>=canvas.width-4||y<4||y>=canvas.height-4)edge++;}}
      return {visible,edge,fraction:visible/(canvas.width*canvas.height)};
    },bytes.toString('base64'));}};
  }catch(error){await close();throw error;}
}
