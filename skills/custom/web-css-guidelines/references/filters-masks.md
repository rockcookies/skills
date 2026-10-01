# 滤镜、混合与遮罩（filter / blend / mask / clip-path / offset-path）

管像素级与形状级的视觉处理。写投影、毛玻璃、混合模式、图标变色、遮罩挖洞、形状揭示动画、路径运动，或排查"混合/滤镜突然失效"时读。

## 五分工：作用对象决定选型

五个属性按"作用对象"切分职责，选型先问"要处理的是谁"。

| 想做什么 | 用谁 |
| --- | --- |
| 元素自身模糊/变色 | `filter` |
| 磨砂玻璃（身后模糊） | `backdrop-filter` |
| 元素与下方内容混合 | `mix-blend-mode` |
| 自身多层背景之间混合 | `background-blend-mode` |
| 组件内混合不外泄 | `isolation: isolate` |

- `isolation: isolate` 的机理是创建层叠上下文（结界），把混合圈在结界内部；什么属性创建结界见 [stacking.md](./stacking.md)。
- 陷阱：祖先任何创建结界的属性（transform / opacity / filter / isolation…）都会隐式成为混合边界——元素"突然混不上页面背景"时先查祖先，再决定在哪一层补 `isolation: isolate`。
- 常见组合：毛玻璃 = 半透明底 + backdrop-filter；图标变色 = mask + background 变量；不规则出场 = clip-path 揭示 + transform 动画。

## filter：十函数累加管线

滤镜作用在元素自身的渲染结果上，函数从左到右依次应用，顺序即语义；值非 `none` 时创建结界，且逐帧重算开销大。

| 函数 | 要点 |
| --- | --- |
| `blur(5px)` | 高斯标准差；不支持百分比 |
| `brightness(2.4)` | 1 为原值 |
| `contrast(2)` | 对比度 |
| `drop-shadow(4px 4px 8px blue)` | 跟随实际渲染轮廓 |
| `grayscale(70%)` / `sepia(60%)` | 去色 / 怀旧 |
| `hue-rotate(90deg)` | 色相旋转 |
| `invert(75%)` | 反色 |
| `opacity(25%)` | 透明度（行为同 opacity 属性） |
| `saturate(230%)` | 饱和度 |

- 可引用 SVG 滤镜：`filter: url(#goo)`。
- 染色配方：`invert() sepia() saturate() contrast()` 链把任意彩色图染成目标纯色。
- `blur() contrast()` 累加 = gooey 黏连效果。

**drop-shadow 与 box-shadow 的取舍**：

| 维度 | drop-shadow | box-shadow |
| --- | --- | --- |
| 投影形状 | 实际渲染轮廓（透明 PNG、border 三角、文字） | 盒模型矩形 |
| inset / 多重投影 | 不支持 | 支持 |
| 作用层面 | filter 家族，跟随元素合成结果 | 盒子装饰层 |

透明 PNG 图标、异形图形投影只有 drop-shadow 做得到；矩形盒子投影、内阴影、多层叠加用 box-shadow。

```css
/* 透明 PNG 图标投影：box-shadow 只会给矩形盒子投影 */
.sticker { filter: drop-shadow(0 6px 8px rgba(0, 0, 0, .3)); }

/* 染色 */
.dye { filter: invert(11%) sepia(81%) saturate(7450%) contrast(114%); }

/* gooey 黏连 */
.goo { filter: blur(10px) contrast(5); }
```

反模式：在大面积元素上做 filter 动画——逐帧全量重算；能只动 transform/opacity（见 [transform-animation.md](./transform-animation.md)）就别动 filter。

## 毛玻璃：backdrop-filter

语法与 filter 完全同构，作用对象是元素身后的背景区域，自身内容不受影响；同样会创建结界。半透明底色是必要条件：背景完全不透明时模糊不可见，视觉上"没有效果"。

```css
.glass {
  background: rgba(255, 255, 255, .2);
  -webkit-backdrop-filter: blur(8px); /* Safari 双写 */
  backdrop-filter: blur(8px);
}
```

## mix-blend-mode 与混合边界

元素与下方内容逐像素混合；作用边界 = 最近的层叠上下文（结界），出了结界不参与混合。

| 值 | 语义与用途 |
| --- | --- |
| `multiply` | 正片叠底，白底消失——白底图标融入背景 |
| `screen` | 滤色，黑底消失——暗色文字图在深色模式自动变亮 |
| `overlay` | 叠加，明暗双向增强 |
| `lighten` / `darken` | 取亮 / 取暗 |
| `difference` | 差值即反色——白色 Logo 深色模式自动反色 |
| `hue` / `saturation` / `color` / `luminosity` | 按 HSL 分量混合 |

```css
/* 深色模式 Logo 自动反色 */
.logo { mix-blend-mode: difference; color: #fff; }

/* 弹层内部自己玩，不与页面背景混 */
.modal { isolation: isolate; }
```

- 黑白图标变色也可走 filter 链：`filter: brightness(3) invert(1) grayscale(1)` 拉成纯色再交给混合。
- `background-blend-mode` 只混自身多层背景（背景图 × 渐变 × 背景色）：默认连背景色一起混，要隔离时设 `background-color: transparent`；多值按 background-image 层一一对应，不足循环、多余忽略。

反模式：mix-blend-mode 混到了意想不到的地方——不是失效，是祖先结界截断了混合；在正确层级画边界，而不是反复换 blend 值。

## mask：可见性遮罩

遮罩图可见的地方内容才可见（不透明 = 显示，透明 = 隐藏）；只改像素可见性、保留原始占位，被遮住的区域不响应点击。

- 子属性与 background 完全平行：`mask-image` / `mask-repeat` / `mask-position` / `mask-size` / `mask-mode` / `mask-composite`，缩写同 background（`mask: url(x.png) no-repeat center / contain`）。
- `mask-image` 接受 `<image>` 全家族（url / 渐变 / SVG mask 引用 / cross-fade / image-set / paint()）——数据类型思维，background-image 的成员知识直接迁移。
- `mask-mode`：默认 `alpha` 按透明度判可见；`luminance` 按亮度判——JPG 没有透明通道，做遮罩必须切 luminance。
- `mask-border` 是九宫格边框遮罩，子属性与 border-image 平行（见 [background-border.md](./background-border.md)）。

`mask-composite` 控制多张遮罩的合成，是纯 CSS 画环、挖洞的钥匙：

| 值 | 语义 |
| --- | --- |
| `add` | 并集（默认） |
| `subtract` | 从前者减去后者——挖洞 |
| `intersect` | 交集 |
| `exclude` | 异或 |

多张遮罩图逗号分隔传入 `mask-image`，composite 值逐层对应；挖洞处方 = 底图 `add` + 洞形 `subtract`。

```css
/* 图标任意变色：纯色背景 + 遮罩镂形状，颜色交给变量（见 variables.md） */
.icon {
  width: 20px; height: 20px;
  background: var(--icon-color, deepskyblue);
  mask: url(icon.svg) no-repeat center / contain;
}

/* 圆环：径向渐变中心挖空 */
.ring { mask: radial-gradient(circle, transparent 40%, #000 41%); }

/* 圆环（composite 版）：整层减去内圆 */
.ring2 {
  mask:
    linear-gradient(#000 0 0) add,
    radial-gradient(circle, #000 38%) subtract;
}

/* 边缘淡出（倒影渐隐、长图收尾） */
.fade { mask-image: linear-gradient(transparent, #000); }

/* JPG 体积 + 透明效果：JPG 图 + luminance 轮廓遮罩 */
.cut {
  background: url(photo.jpg) center / cover;
  mask: url(contour.png) no-repeat center / contain;
  mask-mode: luminance;
}
```

反模式：JPG 遮罩不设 `mask-mode: luminance`——默认 alpha 模式下 JPG 全图按不透明处理，遮罩等于没设。

## mask 与 clip-path 的选型

mask 问"哪里可见"（像素级，吃图像），clip-path 问"什么形状"（矢量，可动画）；两者都保留原始占位，被遮住/剪掉的区域都不可交互。像素级可见性、渐变淡出走 mask；几何形状、形状间过渡走 clip-path。

## clip-path：矢量剪裁

按形状函数裁出可见区域；占位保留（同 transform 无侵入），被剪掉的区域不响应点击/hover。

- 形状函数：`inset()` / `circle(半径 at 位置)` / `ellipse()` / `polygon()`（可前置 nonzero/evenodd 填充规则）/ `path()`；`url(#svgClip)` 引用 SVG 剪裁；可与 `<geometry-box>` 组合（`padding-box circle(50%)`）。
- `inset(上 右 下 左 round 圆角)` 是唯一带圆角的剪裁函数——渐变边框裁圆角的标准搭配（border-radius 管不了 border-image）。
- 过渡条件只有一条：前后坐标点数量一致——形状变形/揭示动画的零 JS 方案。

```css
/* 形状揭示动画 */
.reveal { clip-path: circle(0 at 50% 50%); transition: clip-path .4s; }
.reveal.open { clip-path: circle(200px at 50% 50%); }

/* 渐变边框 + 圆角 */
.fancy {
  border: 10px solid;
  border-image: linear-gradient(deepskyblue, deeppink) 20 / 10px;
  clip-path: inset(0 round 10px);
}

/* 对话气泡尖角 */
.bubble { clip-path: polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
```

反模式：过渡前后点数不同——不会插值只会跳变，补齐点数再动。

## offset-path：路径运动

元素上某个锚点贴住路径移动，动画只需驱动 `offset-distance`，把"沿轨迹运动"从 JS 逐帧算坐标降为一条 CSS 动画。

| 子属性 | 作用 |
| --- | --- |
| `offset-path` | 路径：`path("M…")` / `ray(角度 closest-side contain?)` / basic-shape / `url(#svgPath)` |
| `offset-distance` | 沿路径的距离，0~100%，支持负值与超 100% |
| `offset-rotate` | `auto` 朝向切线 / `reverse` / `auto 45deg` / 固定角度 |
| `offset-anchor` | 元素上贴路径的点，默认 transform-origin |
| `offset-position` | 路径起点；非 auto 时创建结界与包含块 |

```css
.car {
  offset-path: path("M10,80 q100,120 120,20 q140,-50 160,0");
  offset-rotate: auto;
  animation: drive 4s linear infinite;
}
@keyframes drive { to { offset-distance: 100%; } }
```

典型场景：小车/光点沿 SVG 轨迹行驶、沿不规则曲线的引导动画、路径描边跟随。切线朝向由 `offset-rotate: auto` 免费获得，不要再用 JS 反算角度。

反模式：用 `offset` 缩写一把梭——子属性兼容参差，一处不识别整条失效；子属性分开写。
