# 背景与边框：background、渐变、border 图形与 border-image

管装饰层：设置或排障背景 / 渐变 / 边框 / 圆角 / 阴影 / 轮廓，以及用它们直接画图形（三角、饼图、加减号、渐变边框）时读。

## 颜色能力边界

- 颜色格式首选十六进制（字符最少、解析最快）；hsl 适合交互态微调——hover 加深只需降 l，不必重算 rgb。
- 现代颜色语法支持空格 + 斜杠透明度：`rgb(255 0 0 / 50%)`，与 rgba() 等价、可互换。
- border / outline / box-shadow / text-shadow 的颜色缺省值就是 currentColor，不必显式写；改 color 一处，边框与阴影同色联动。
- 系统颜色关键字（Highlight、Canvas、ButtonFace 等）可当即时占位配色：出原型时先填系统色，语义成立且后续替换不冲突。

## background-position 百分比公式

百分比定位不是"图片尺寸的百分比"，而是对齐公式：

```
positionX = (容器宽 − 图片宽) × percentX
```

- `100% 100%` = 图片右下角贴容器右下角——与 `left: 100%` 把元素推出容器完全是两回事。
- 图片大于容器时，负百分比反而落在容器内：容器 160×160、图片 256×192 时，`-50% -50%` 按 (160−256)×(−50%)=48、(160−192)×(−50%)=16 计算，等价 `48px 16px`。
- sprite 定位"怎么算都不对"时，先套公式再调参。
- 距边定位用 4 值语法，替代 calc 运算：

```css
.banner { background-position: right 20px bottom 20px; }
```

## background-size / origin / clip

- cover 覆盖裁剪、contain 包含留白，均保持比例，按场景二选一。
- auto 的渲染规则：图有内在尺寸就按原尺寸渲染——2x / 3x 多倍图必须显式写 background-size，否则按物理像素整张变大。
- 百分比 size 相对"背景定位区域"，由 background-origin 决定（默认 padding-box）。
- 排障：渐变或背景图在粗边框处"断开"，是 origin 停在 padding-box——设 `background-origin: border-box` 即愈。
- 透明边框 + `background-position: 100%` 可把背景贴到边框外缘，实现视觉右下角定位。
- background-clip: text 做渐变文字三件套：

```css
.text-gradient {
  background: linear-gradient(deepskyblue, deeppink);
  background-clip: text;
  color: transparent;
}
```

- 平铺图别用 1×1：平铺次数过多渲染卡顿，100×100 起明显流畅。repeat 另有 space（留隙均分、不裁剪）与 round（微缩放铺满）两个精确平铺值。
- 缩写里 size 只能跟在 position 后、用斜杠分隔：`background: center / cover no-repeat`。

## 多背景

逗号分隔多层，先声明的层在最上；纯色只能作为最后一层（background-color 永远垫底）。

- `background: linear-gradient(...), deepskyblue` 合法；`background: deepskyblue linear-gradient(...)` 非法。
- 各层的 position / repeat / size 用逗号一一对应声明，声明不齐时按层循环补齐。
- 背景色垫底 + 起止同色渐变 = 全站通用按压反馈，不必逐个按钮写背景色：

```css
a[href]:active, button:active {
  background-image: linear-gradient(rgba(0, 0, 0, .05), rgba(0, 0, 0, .05));
}
```

## linear-gradient：方向与断点规则

CSS 角度体系与设计软件相反：0deg 向上、顺时针为正（设计软件向右、逆时针）。to 方位值免算角度且不受容器尺寸影响，优先用。

断点规则（决定能不能少写断点）：

- 位置跟在颜色后（`skyblue 50%`）；不写位置自动等分。
- 首尾同色可省：`linear-gradient(white 25%, skyblue 75%)` 就是 25%~75% 区间的渐变，两端自动以纯色填满。
- 后断点位置小于前断点时，按前者的较大值渲染——区间纯色的免费语法糖：`gold 0 75%` 的 0 自动取前一断点位置。
- 双位置语法 `skyblue 40% 60%` 等价一个纯色区间。
- 同位置双色交界处部分屏幕有锯齿，交界点写 `calc(50% + 1px)` 留 1px 过渡。
- 位置可写负数或超过 100%（渐变从容器外开始、在容器外结束），不同单位混用合法。

反模式：拿设计软件的角度直觉直接写——CSS 角度与其相差 90° 且正负方向相反；拿不准一律写 to 方位。

## radial / conic / 重复渐变

- radial-gradient：circle + 单半径只接受长度（`circle 50%` 非法，百分比只能配 ellipse 双值）；中心点 `at <position>`；终止范围默认 farthest-corner，贴边光环用 closest-side。超扁椭圆做按钮顶部高光：

```css
.btn {
  background: radial-gradient(160% 100% at 50% 0%, rgba(255, 255, 255, .4), transparent 60%), #369;
}
```

- conic-gradient：断点用角度或百分比（角度断点是相对值，与 from 起始角累加），一行画饼图（0 起点自动继承前一断点位置，免计算）：

```css
.pie {
  border-radius: 50%;
  background: conic-gradient(yellowgreen 40%, gold 0 75%, deepskyblue 0);
}
```

- repeating 系渐变必须显式写起止位置，否则重复单元无法确定；条纹、斑马线、自定义虚线的基础：

```css
.stripe { background: repeating-linear-gradient(45deg, #ddd 0 10px, #fff 10px 20px); }
```

- conic + mask 挖孔即 loading 圆环，见 [filters-masks.md](./filters-masks.md)。

## 渐变是 <image>

数据类型思维：渐变属于 <image>，不是 <color>——既不能出现在 color 位置，也不能像颜色那样过渡或动画。

- 动态渐变（角度 / 颜色随状态插值）需先用 @property 注册自定义属性，见 [variables.md](./variables.md)。
- 静态切换用双伪元素各持一态渐变、opacity 交叉淡入，见 [patterns.md](./patterns.md)。

## border 转角等分：三角与梯形

边框转角以等分线平滑衔接（inset / outset 系老样式奠定的规则），宽边框 + 分区着色即可拼几何图形——这是 border 画图形的基石。

```css
/* 朝下的三角 */
.tri { width: 0; border: 10px solid; border-color: #f30 transparent transparent; }

/* 上窄下宽的梯形：保留 width */
.trapezoid { width: 100px; border: 12px solid; border-color: #f30 transparent; }
```

- border-color 缺省跟随 color：图形用 border 画、颜色用 color 控，hover 改一处即变色。
- transparent 边框角让部分转角隐形——梯形、气泡尖角都靠它。
- `border-style` 默认 none：`border: 10px`、`border: red` 都不显示边框，必须出现 style 关键字；`border: solid` 一写就出 3px 的 medium 宽度。

## border-style: double 与 medium

double 的两条线宽度永远相等、中间间隔 ±1px；1px / 2px 时退化为实线，3px 起才是双线。

- 这就是 border-width 默认值是 medium（3px）而非 1px 的原因：保证 `border: double` 一写出来语义就成立。
- dashed / dotted 的线段比例与点形属未定义行为，只当虚框用，不依赖其精确渲染。

## border-radius 重叠算法

每条圆角是水平半径 + 垂直半径构成的椭圆曲线；相邻半径之和超出边长时等比收缩：f = min(各方向 边长 ÷ 相邻半径之和)，f < 1 时全部半径 × f。

- 半径超过边长一半时按重叠算法自动等比收缩——胶囊形直接写 `border-radius: 999px`，不必知道元素高度。
- 非正方形上 `50%` 与固定像素不等价（f 按轴分别计算）；正圆头像用 `border-radius: 50%` 或 min(宽, 高) / 2。
- 内半径 = 外半径 − border-width（不够减取 0）：粗边框圆角内外曲率不一致是正常表现。
- 圆角外的角落区域不可点击；父元素的圆角不裁剪子元素——需要裁剪配 `overflow: hidden`。
- 斜杠分轴画不规则形状（波浪头像底板）：`border-radius: 70% 30% 30% 70% / 60% 40% 60% 40%`。
- table 的圆角要 `border-collapse: separate` 才生效。

## box-shadow：spread 与性能

四段式 `offset-x offset-y blur spread color`；第四值 spread（扩展半径）最常被漏用。

- 负 spread 裁掉 blur 的四向溢出 → 单侧阴影：`box-shadow: 0 7px 5px -5px rgba(0,0,0,.5)` 只有下方有影。
- 大正 spread 是蒙层：新手引导镂空 `box-shadow: 0 0 0 9999px rgba(0,0,0,.75)`，支持 border-radius 圆角挖孔。
- inset 阴影落在背景上、内容下：全站按压加深 `inset 0 0 0 999px rgba(0,0,0,.1)`；对 img 等替换元素无效（内容盖在阴影上），改用 outline + 负 outline-offset。
- 多阴影累加可画多重边框：`0 0 0 4px #fff, 0 0 0 8px #333`；同色系渐深偏移叠加做 3D 按钮（`1px 1px, 2px 2px, 3px 3px`），:active 位移 1px 并减掉最后一层。
- 性能：box-shadow 过渡触发样式重计算、开销大——hover 阴影动画改用双伪元素 opacity 切换，配方见 [patterns.md](./patterns.md)。

## outline：双原则与镂空遮罩

outline 不占布局空间、向四方扩散、不被 border-radius 裁剪——既是焦点环也是遮罩工具。

- 不要全局清零 outline：focus 轮廓是键盘用户定位焦点的唯一线索。必须重置输入框样式时，同步补 :focus 视觉。
- outline-offset 控制轮廓与元素的间隙（支持负值贴入），做不占布局的焦点环或按压反馈。
- 镂空遮罩：子元素超大 outline + 父容器 overflow: hidden，四周围住、中间透出（头像剪裁取景框）：

```css
.crop { overflow: hidden; }
.crop > .area {
  width: 80px; height: 80px;
  outline: 256px solid rgba(0, 0, 0, .5);
}
```

## border-image 九宫格与渐变边框

源图像按 border-image-slice 切成九区：四角原样放置、四边按 repeat 规则处理、中心默认丢弃。

- slice 默认 100%（只剩四角）；border-image-width 定边框厚度（数值 = border-width 的倍数）；border-image-outset 让边框外扩（不占布局、不响应鼠标）；repeat 取 stretch（默认）/ repeat / round / space。
- 渐变边框处方——border 声明必须写在 border-image 之前（border 缩写会重置 border-image 系属性）：

```css
.fancy {
  border: 10px solid;
  border-image: linear-gradient(deepskyblue, deeppink) 20 / 10px;
}
```

- border-radius 管不了 border-image：圆角渐变边框用 `clip-path: inset(0 round 10px)` 裁出圆角。
- repeating-linear-gradient 当 border-image 源 = 自定义节奏的虚线 / 条纹边框。
- 缩写顺序 `source slice / width / outset repeat`；省略 width 时双斜杠写法 `54 // 20px` 也合法。

## 多背景画图形

起止同色的 linear-gradient 是一根纯色条（`linear-gradient(currentColor, currentColor)`），配合 no-repeat + size + position 直接画图形——免伪元素、免图片、颜色跟 color 走。

```css
/* 加号：两条 currentColor 色条十字交叉；画减号删掉第二层 */
.btn-add {
  background:
    linear-gradient(currentColor, currentColor) center / 12px 2px no-repeat,
    linear-gradient(currentColor, currentColor) center / 2px 12px no-repeat;
}
```

- 尺寸用 em 可随字号缩放；色条叠在按钮背景色之上（背景色垫底）。
