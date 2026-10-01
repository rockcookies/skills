# 变换与动画：transform、3D 透视、transition、animation、will-change

管动效：写或排障 transform / 3D 透视 / 过渡 / 关键帧动画 / 动画性能与 will-change 时读。层叠上下文机理见 stacking.md；显隐方案矩阵见 visibility-media.md。

## transform 2D 基础

变换只改渲染结果，不改盒模型的尺寸与占位——元素不会推开兄弟（无侵入），也不会触发周围重排。

- 四函数：translate、rotate、scale、skew。rotate 接受 deg / grad / rad / turn，实战只用 deg；scale 负值做镜像（`scaleX(-1)`）；skew 是被低估的图形工具（斜切矩形拼箭头导航）。
- translate 的百分比相对自身尺寸（CSS 中唯一），弹框居中专用：

```css
.dialog { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
```

-50% 相对自身宽高各退一半，恰好抵消 left / top: 50% 把元素左上角推到容器中心的偏移。

- 函数顺序敏感：`translateX(40px) scale(.75)` 实际位移 40px；反序先缩小，位移只有 30px。先平移后缩放。
- 非替换内联元素（span 内文字）不响应 transform，先 `display: inline-block`。
- 与 clip-path 同用时先剪裁、后变换——剪裁作用在变换前的图形上。
- 旋转 / 放大可能撑出滚动条，间接挤压容器可用宽度："加了 rotate 布局变了"先查滚动条。

反模式：弹框用 `translate(-50%, -50%)` 居中，又给同一元素加 transform 进出动画——动画帧会覆盖居中变换。居中交给定位方案，见 [positioning.md](./positioning.md)，transform 留给动画。

## transform 的三个连带效应

transform ≠ none 附送三件事，层叠机理见 [stacking.md](./stacking.md)：

- 自建层叠上下文（结界）：`transform: scale(1)` 就能让 DOM 靠前的元素盖住靠后元素，hover 放大场景免 z-index。
- 成为 fixed 后代的定位基准：祖先带 transform 时 `position: fixed` 不再相对视口——fixed 失灵先查祖先链上的 transform / filter / will-change。
- 内联元素 absolute 化：与浮动 / 绝对定位同款的 display 块化，非替换内联元素一旦涉及 transform，尺寸、定位、z-index 都按块状语义生效；要确定行为就显式 inline-block。

排障口诀：层叠乱了、fixed 飘了、inline 突然有尺寸了——三件事都先查 transform。

## 3D 透视体系

perspective 决定画面是 2D 还是 3D：值为眼睛到舞台的视距，越小透视越强。常用 400~1000px——太小畸变、太大趋近正交失去透视感。

- 3D 函数族：rotateX / rotateY / rotateZ、translate3d / scale3d、rotate3d(x, y, z, angle)、matrix3d；rotateX / rotateY 本质是 3D 旋转：没有透视时 rotateY 只表现为水平压缩，看不出"翻转"——先给父级 perspective 再谈 3D 效果。
- 写在父元素：所有子元素共用一个透视点，符合现实（远处的人只见侧脸）；写在子元素 transform 的 `perspective()` 函数里：各元素独立透视。

```css
/* 父级共享灭点：整排卡片有统一透视 */
.scene { perspective: 600px; }
/* 单元素独立透视：函数写在 transform 里 */
.solo { transform: perspective(600px) rotateY(30deg); }
```

- translateZ 正值朝观察者放大，接近 perspective 值时铺满屏幕——3D 卡片切换的入场感来源。
- perspective-origin 定眼睛位置，默认舞台中心。
- `transform-style: preserve-3d` 让子元素共享同一三维空间（默认 flat 各自压扁），嵌套 3D 动画必配。
- `backface-visibility: hidden` 翻转时隐藏背面，卡片翻牌标配：

```css
.card { perspective: 600px; }
.card-inner { position: relative; transform-style: preserve-3d; transition: transform .6s; }
.card:hover .card-inner { transform: rotateY(180deg); }
.card-face { backface-visibility: hidden; }
.card-back { position: absolute; inset: 0; transform: rotateY(180deg); }
```

- 3D 变换天然走 GPU 合成层；`translateZ(0)` 是旧式强制分层 hack，现代替代是 will-change（见下）。

## transition：可过渡判据

属性可过渡的条件：属性在可插值列表中，且起始值与结束值都是具体值——auto 这类关键字起点不可插值。

| 判断对象 | 可过渡 | 处理 |
| --- | --- | --- |
| transform / opacity | 是 | 性能最优，动效首选 |
| visibility | 是 | 中间值一律按 visible 渲染 |
| display | 否 | display: none 还会中断过渡、不触发 transitionend |
| height / width 的 auto | 否 | 改用 max-height 定值 |
| 颜色、阴影类 | 是 | 但每帧重绘，动画性能差 |

- 显隐过渡一律走 visibility，完整方案矩阵见 [visibility-media.md](./visibility-media.md)。
- display: none 不影响 animation 的运行，只杀 transition。
- 触发条件是计算值变化：类名切换、伪类、媒体查询都能触发，不限于 :hover。
- transitionend 是动画结束回调的挂钩；display: none 切换会吞掉该事件——监听结束态前确保元素保持渲染。

- height: auto 的展开收起用 max-height 处方：

```css
.acc { max-height: 0; overflow: hidden; transition: max-height .3s; }
.acc.open { max-height: 300px; }  /* 取比内容最大高度略大的定值 */
```

## visibility 过渡与显隐动画

visibility 的插值中间值一律按 visible 渲染，因此天然获得"显示立即出现、隐藏延时消失"——一行实现 hover 防误触：

```css
.list { visibility: hidden; }
td:hover .list { visibility: visible; transition: visibility 0s .2s; }
```

transition 声明写在激活态，只作用于进入方向：移入延时 0.2s 出现，移出立即消失。

弹窗类名切换的显隐三件套（opacity + visibility + transform），激活态重置 transition-property，避免浏览器把 visibility 排到延时后才变 visible：

```css
.popup { opacity: 0; visibility: hidden; transition: opacity .2s, visibility .2s; }
.popup.active { transition-property: opacity; opacity: 1; visibility: visible; }
.popup > .content { transform: translateY(100%); transition: transform .2s; }
.popup.active > .content { transform: translateY(0); }
```

## transition 细节：缩写、延时与缓动

- 缩写 `property duration timing-function delay`，两个时间值先时长后延时（`transition: opacity .2s .1s`）；出现负时间必是 delay——duration 不允许为负。
- property 初始值就是 all：`transition: .2s` 已覆盖全部属性，写 all 徒增过渡范围。
- 负延时 = 省略前段：duration 1s + delay -0.5s，过渡从 50% 进程开始播，可见总时长 0.5s。
- 多属性列表长度不齐时"缺则循环补齐、多则忽略"：`transition-property: opacity, transform` 配一条 `transition-duration: .2s` 即两属性共用。

| 缓动 | 表现 | 适用 |
| --- | --- | --- |
| linear | 匀速 | 进度条、机械运动 |
| ease（默认） | 先加速后减速 | 通用 UI，多数场景不必换 |
| ease-in | 慢启动 | 退场 |
| ease-out | 快出缓停 | 入场 |
| ease-in-out | 对称钟摆 | 长距离位移 |
| cubic-bezier 越界 y | 回弹 | 弹性交互 |

- cubic-bezier(x1, y1, x2, y2) 起终点固定，可调的是两个控制点，纵坐标允许 >1 或 <0：`cubic-bezier(.16, .67, .28, 1.46)` 即回弹。
- steps() 在 transition 中同样可用，做离散跳变（光标闪烁、逐帧显隐）。

## animation 与 @keyframes

animation 立即或循环执行；帧样式的优先级最高——执行期间压过内联 style，同属性与 transition 并存时 animation 的帧值胜出（帧内 !important 无效；Firefox 中帧样式低于 !important，其余浏览器压过一切）。可借运行中的动画重置第三方内联样式。

| | transition | animation |
| --- | --- | --- |
| 触发 | 计算值变化才动 | 声明即动，可循环 |
| 帧控制 | 只有首尾两帧 | 多帧，帧选择器乱序合法 |
| 负延时 | 省略前段 | 即时从中段播放 |
| 暂停 | 无 | animation-play-state |
| 优先级 | 正常声明 | 帧样式压过内联与 transition |

- 缩写八项顺序：name duration timing-function delay iteration-count direction fill-mode play-state；两个时间值同样先时长后延时。
- 动画名必须在 @keyframes 中有定义才播放，拼错名字静默不动——排障第一步核对名字（区分大小写，不能是 none / inherit 这类全局关键字）。
- 多动画分开声明、各自配小 keyframes，规则才可复用：`animation: fadeIn .2s, slideIn .2s`。
- 起止帧可省略（取元素当前值）；同帧重复定义时同属性后者覆盖、不同属性合并；各帧属性无需一致，每个属性独立走自己的帧序列。
- direction：reverse 倒放、alternate 往复（配负延时做交错往返）、alternate-reverse 反向往复。
- iteration-count 支持小数：`.5` 只播前半程。
- steps() 步进时间函数配多阴影 / 多背景，做秒针、进度点阵类离散动画。

## 负延时与交错动画

负延时的语义是"早已开始播"：`fadeIn 1s linear -.25s` 的可见区间是 0.25s→1s——不是从 75% 处播 0.25s，而是 0.25s 之前就已从 0% 开播。

- 交错 / 波形动画给各元素配负 delay：元素一入场就处于各自相位。
- 正 delay 的问题：所有元素初始都停在 0% 帧，先齐刷刷同状态再依次动，观感差。
- 无限循环时 delay 只生效一次——"每圈都停顿"要把停顿写进关键帧（`0%, 30% { ... } 100% { ... }`）。

```css
/* 交错加载点：负延时让各点立即处于各自相位 */
.loading i { animation: bounce 1.2s ease-in-out infinite alternate; }
.loading i:nth-child(2) { animation-delay: -.15s; }
.loading i:nth-child(3) { animation-delay: -.3s; }
```

## 填充模式与暂停

- forwards 停在末帧；backwards 让 delay 期间就显示 0% 帧，避免开场闪回元素初始样式；both 兼得。
- 没设置 delay 时 backwards 无可见效果——它只作用于 delay 期间。

```css
/* backwards：delay 期间先显示 0% 帧 */
.tip { animation: fade-in .3s .6s backwards; }
```

- `animation-play-state: paused` 原地暂停、恢复不重播，不必销毁重建动画：

```css
.marquee:hover { animation-play-state: paused; }
```

## 动画性能铁律

渲染流水线分三级：layout（重排）→ paint（重绘）→ composite（合成）。width / margin 触发重排，color / box-shadow 触发重绘，transform / opacity 只参与合成。过渡期间每一帧都要重走前面的级数，所以动效只碰后两级。

- 高性能动画三要素：绝对定位（脱离文档流）+ opacity + transform。
- 位置动画用 transform，绝不用 margin / left / top。
- 重排级属性（box-shadow、宽高、颜色）确需动效时，用双伪元素各持一态样式、以 opacity 交叉切换，把样式重计算降为合成，配方见 [patterns.md](./patterns.md)。
- 3D 变换（translateZ）与 will-change 都能把元素提为合成层，隔离相邻元素的重绘连带。

反模式：给 left / top / margin / width 写 transition——每帧重排，页面复杂后必掉帧。排障：DevTools Performance 面板里出现大块 Layout / Paint 即说明动了重排 / 重绘级属性。

## will-change

提前告知浏览器哪些属性即将变化，使其预先分层、分配显存——`translateZ(0)` 老 hack 的正式替代。

- 只加在即将动画的少量元素上，动画结束后移除；禁止全站 `* { will-change: transform }`——每个声明都消耗内存与合成层，撒网反而更慢。
- 可写多个属性，逗号分隔：`will-change: transform, opacity`。
- 隐藏副作用：声明即生效该属性的行为——`will-change: transform` 等同 transform ≠ none，会自建层叠上下文（结界）、使后代 fixed 相对化，机理与排障见 [stacking.md](./stacking.md)。

```css
.card { will-change: transform; }   /* 列表即将滚到该卡片时加上 */
.card.stable { will-change: auto; } /* 交互结束即移除 */
```
