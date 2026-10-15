// Picture cuts and window choreography intentionally use independent clocks.
export const FPS = 30;
export const BPM = 90;
export const DURATION = 960;
export const beat = n => Math.round(n * 60 / BPM * FPS);
export const PICTURE_CUTS = [0,80,320,400,560,600,660,720,800,880];
export const DRAWING_FLASHES = [[90,97],[110,119]];
export const WINDOW_PHRASES = [
  {start:0,end:80,cuts:[],name:'Opening dial only; the entire drawing / board scene is full-frame'},
  {start:320,end:460,cuts:[400],name:'Structure window → tool axis; the band rotates across the cut'},
  {start:548,end:720,cuts:[560,600,660],name:'A single rectangular window moves through the mechanical sequence, then fully opens'},
  {start:788,end:910,cuts:[800,880],name:'Three straight rectangular columns open through material and final product'},
];
export const REVIEW_FRAMES = [15,40,65,79,80,91,100,110,130,160,240,279,295,319,320,345,375,399,400,420,450,495,530,545,559,560,580,599,600,630,659,660,690,719,720,740,770,799,800,830,860,879,880,900,925,945];
