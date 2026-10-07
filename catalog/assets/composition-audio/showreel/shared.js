(function (root) {
  const BPM = 120;
  const BEAT = 60 / BPM;
  const PROMPT = '制作一段动感十足的 60秒动态图形（Motion Graphics）视频，展示你作为一名动态设计师有多么出色，就像它是你简历里的作品集样片一样。内容围绕现代动态设计的演进，不使用任何skill，纯coding 然后开工。';
  const CHARS = Array.from(PROMPT);
  const TYPE_START = 46.9;
  const TYPE_END = 50.5;
  const SEND = 51.0;
  const BOUNDS = [4, 10, 16, 22, 30, 38, 46, 54];

  function charTime(i) {
    return TYPE_START + (TYPE_END - TYPE_START) * i / (CHARS.length - 1);
  }

  function kicks() {
    const k = [0, 2, 3, 3.5, 3.75];
    for (let i = 0; 4 + i * BEAT < 46 - 1e-6; i++) k.push(4 + i * BEAT);
    for (let i = 0; 54 + i * BEAT < 58 - 1e-6; i++) k.push(54 + i * BEAT);
    k.push(58);
    return k;
  }

  const S = { BPM, BEAT, PROMPT, CHARS, TYPE_START, TYPE_END, SEND, BOUNDS, charTime, KICKS: kicks() };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
  else root.SHARED = S;
})(typeof window !== 'undefined' ? window : globalThis);
