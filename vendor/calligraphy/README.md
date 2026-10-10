# I.顏體字形生成材料

原字库由王漢宗、Ichiten Fonts Project 提供，准确许可为 GPL-2.0-or-later。原版权文字、下载地址与文件校验值见 [来源记录](SOURCE.json)，原许可见 [GPL 全文](GPL-2.0.txt)。源码仓库保留未修改的 I.Ngaan.ttf；运行分发包和素材安装副本不附带该原件，目录使用从中提取的“火炎焱燚”字形轮廓和固定网格墨点。字库及派生字形数据保留原许可，不改为 MIT；原件未打包不改变派生字形的许可声明。

`prepare-calligraphy.py` 为本项目的字形提取程序，使用 Apache-2.0；它保留原制作算法，增加公开路径参数和输入校验，不发起网络请求。需要 Python 3 和 FontTools；生成不需要原私有工程。

在包含原字库的 Wise Motion 源码仓库根目录验证（运行分发包需先按来源记录取得原字库）：

```sh
python3 vendor/calligraphy/prepare-calligraphy.py --check
```

重新生成数据：

```sh
python3 vendor/calligraphy/prepare-calligraphy.py --output catalog/assets/civilization-growth/calligraphy-data.mjs
```

默认先验证字库校验值；仅 `--check` 时比较而不写文件。当前四字数据与这些公开材料生成的结果逐字一致。源码仓库保留原字库、许可、生成程序与参数；运行分发包保留许可、生成程序、参数及原件下载地址与校验值。上游字库的其他设计工程文件未核实，不能据此宣称完成了对上游全部源码材料的审查，也不将本次体积删减视为许可合规审查。
