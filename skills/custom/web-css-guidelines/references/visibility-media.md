# 显隐与媒体元素（隐藏方案 / 替换元素 / object-fit / 图像函数）

管"看不见"的完整语义（渲染、占位、交互、可达性、加载、过渡）与替换元素的尺寸适配。选隐藏方案、藏 logo 文字、做图片裁剪适配、选图像函数时读。

## 隐藏决策矩阵

"不可见"只是视觉结果；方案之间的真正差异在是否渲染、是否占空间、是否可点击、键盘/读屏是否可达、资源是否加载、能否过渡。按维度选工具，不要无脑 `display: none`。

| 方案 | 渲染 | 占空间 | 可点击 | 键盘/读屏 | 可过渡 |
| --- | --- | --- | --- | --- | --- |
| `<script type="text/html">` 模板 | 否 | 否 | 否 | 不可达 | — |
| `display: none` | 否 | 否 | 否 | 不可达 | 否 |
| `visibility: hidden` | 是 | 是 | 否 | 不可达 | 是 |
| absolute + `clip-path: inset(50%)` | 是 | 否 | 否 | 可达 | — |
| relative + `z-index: -1`（父级需背景） | 是 | 是 | 否 | 可达 | — |
| `opacity: 0` | 是 | 是 | 是 | 可达 | 是 |
| `text-indent` 负值 + `overflow: hidden` | 是 | 文字推出 | — | 可达 | — |
| `max-height: 0` + `overflow: hidden` | 是 | 否 | 否 | 视实现 | 是（展开动画） |

- `<script type="text/html">` 内的资源不加载、不渲染，取值用 `script.innerHTML`；不能嵌套 script，需嵌套时换 `<textarea>` 模板（取值 `.value`）。
- `z-index: -1` 的机理是负值层叠序把元素沉到普通内容之下，必须父级有背景色盖住——渲染规则见 [stacking.md](./stacking.md)。

## 隐藏决策树

每问一步砍掉一批选项，剩下的是正确答案：

1. 模板片段，不渲染、不发请求 → `<script type="text/html">`。
2. 键盘/读屏必须可达（视觉隐藏）→ absolute + clip 隐藏 / `z-index: -1` / `text-indent`。
3. 要过渡动画 → `visibility`（配 opacity/transform 淡入淡出）或 `max-height`（展开收起）。
4. 要保留占位 → `visibility: hidden`。
5. 要不可见但可点击（隐形热区、复用交互层）→ `opacity: 0`。
6. 什么都不要 → `display: none`。
7. 需 JS 预测量尺寸 → `position: absolute; visibility: hidden`。

推理链示例：离线提示条要被读屏感知（第 2 步先排除 display/visibility），又不需要占位 → absolute + clip 隐藏，JS 控制内容与显隐。

第 2 步的标准答案（视觉隐藏、键盘读屏可达）：

```css
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
}
```

反模式：全站只认 display:none——要过渡、要可达、要测量时全部踩坑；先过决策树再动手。

```css
/* 展开收起动画 */
.acc { max-height: 0; overflow: hidden; transition: max-height .3s; }
.acc.open { max-height: 400px; }
```

## visibility：继承复活与 transition 友好

visibility 是继承属性，且子级设 `visibility: visible` 可以单独"复活"——容器隐藏 + 子元素可见是合法组合。

- 异步加载处方：容器 hidden + loading 图标 visible，数据就绪后整体 visible——优于"占位→加载→界面"三段跳。
- transition 的属性列表可以包含 visibility（不包含 display），延时显隐可控。
- JS 可测量：`visibility: hidden`（配 absolute）元素的 `clientWidth` / `getBoundingClientRect()` 返回真实值；`display: none` 全是 0。
- 参与计数：visibility:hidden 仍占 ol 序号（display:none 退出计数队列）。
- 读屏行为：visibility 隐藏保留 focus 区域，title 状态变化仍可播报（如"浮层已关闭"）；display:none 直接跳到后续元素。
- `visibility: collapse`：表格上各浏览器解析不一致、普通元素等同 hidden——没有使用理由。

```css
/* 容器隐藏，loading 复活 */
.widget { visibility: hidden; }
.widget .loading { visibility: visible; }
.widget.ready { visibility: visible; }

/* hover 延时显示下拉：进入延时 .2s，移出立即消失 */
.dropdown { position: absolute; visibility: hidden; }
.trigger:hover .dropdown { visibility: visible; transition: visibility 0s .2s; }

/* 需要预先测量尺寸的隐藏 */
.offscreen-measure { position: absolute; visibility: hidden; }
```

transition 声明写在 hover 态：只作用于"进入"方向的过渡，移出方向无过渡 → 立即消失。防"路过误触"就靠这个不对称；要反过来（进入立即、移出延时），把延时 transition 写在非 hover 态即可。

visibility 是离散值，过渡按阶梯插值——配 0s 延时可以让"变隐藏"等到淡出动画完成后再发生，这是 opacity 淡入淡出不丢交互的完整处方：

```css
.toast {
  position: absolute;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s .3s, opacity .3s; /* 隐藏方向：等淡出完再隐藏 */
}
.toast.show {
  visibility: visible;
  opacity: 1;
  transition: opacity .3s; /* 显示方向：立即可见再淡入 */
}
```

## display: none 的行为细节

从渲染树移除，布局、交互、可达性全部消失；另有四条影响决策的暗面：

- 不参与计数：ol 序号跳号——序号敏感的隐藏换 visibility。
- 不支持 transition（display 值本身不插值），animation 不受此限。
- 背景图加载行为属未定义行为：Firefox 不加载 display:none 元素的 background-image；Chromium 看父级——父级也 none 才不加载。要延迟加载头图，把背景图挂到隐藏元素的子元素上。`<img>` 则无论怎么隐藏都会发请求。
- `<label for>` 仍能触发 display:none 提交按钮的 click，但按钮丢失键盘可达性——需要键盘可达时改用 clip 隐藏（见下文 label 代言模式，[interaction-advanced.md](./interaction-advanced.md)）。
- `hidden` 属性等价 UA 样式 `display: none`，语义场景优先用它。

## 替换元素机理

替换元素（img / video / iframe / object / textarea / input / select）与非替换元素只隔一个 `src` 属性（img 去掉 src 就是普通内联元素）或一个 `content` 属性——内容由属性值提供，因此有一套独立的尺寸规则。三层尺寸从内到外逐层覆盖：

| 层 | 来源 | 例 |
| --- | --- | --- |
| 固有尺寸 | 内容本身 | 图片的原始宽高 |
| HTML 尺寸 | `width` / `height`、`size`、`cols` / `rows` 属性 | `<img width="100">` |
| CSS 尺寸 | `width` / `height` 样式 | 优先级最高，覆盖前两层 |
- 有固有宽高比时只设一边 → 等比缩放：`width: 200px` 即可，高度自动。
- 与 display 无关：inline/block/inline-block 尺寸规则一致——`img { display: block }` 不会铺满容器。
- 全都没有尺寸时回退 300×150（`<img>` 为 0）。
- 固有尺寸本身不可改，图片"显示大小"变化的本质是 fill 拉伸适配——改适配方式用 object-fit。
- 外观不受页面 CSS 影响，重置表单皮肤需 `appearance`。
- `<img src="">` 空字符串仍会发起请求（请求当前页面）——占位请直接省略 src 属性。
- `<img>` 写上 width/height 属性可防布局偏移（CLS），现代最佳实践。
- 替换元素的 baseline 被定义为下边缘——行内对齐问题的来源，见 [inline-box.md](./inline-box.md)。

## content 生成的匿名替换元素

`content: url()` 生成"匿名替换元素"，套用替换元素的尺寸规则；其内容不可选中、不可复制、读屏读不到、SEO 抓不到——content 只承载装饰，任何承载信息的内容都不许放。

- 装饰性图标、序号前缀：`content` 合适。
- 表单回显、提示文案、任何用户需要复制或听读的文本：真实 DOM 节点。
- `content: attr(data-x)` 取属性展示时同样按装饰对待。

## object-fit / object-position

object-fit 补上"固有尺寸只读、适配方式可选"的缺口——替换内容如何填进 content-box：

| 值 | 比例 | 溢出 | 空隙 |
| --- | --- | --- | --- |
| `fill`（默认） | 不保 | 无 | 无（变形） |
| `contain` | 保 | 无 | 有 |
| `cover` | 保 | 有（裁剪） | 无 |
| `none` | 原始尺寸 | 有 | 有 |
| `scale-down` | 保 | 无 | 可能 |

选型：头像头图用 cover（配 object-position 保关键部位）；商品图等比完整显示用 contain（留白交给背景色）。

`scale-down` = 效果取 `min(none, contain)`，只缩不放；`none` 是原尺寸显示，不是等比缩小。cover / contain 与 background-size 语义一致，知识直接迁移。`object-position` 控制替换内容在盒子内的位置，语法同 background-position（支持 4 值 `right 20px bottom 10px`），初始 `50% 50%`。

```css
/* 头图：保比例填满 + 顶部对齐，人脸不裁 */
.cover { width: 100%; height: 240px; object-fit: cover; object-position: top; }

/* img 版 sprite：同一张大图移动 object-position 取区域
   相比 background-position sprite：语义更好、可 alt、可懒加载 */
.icon { width: 20px; height: 20px; object-fit: none; object-position: -40px 0; }
```

像素风放大配 `image-rendering: pixelated`（低分辨率图标、像素游戏图）。

## 文本隐藏处方（logo 文字）

背景图做 logo 时保留语义文字、视觉隐藏：首选 text-indent 定长负值 + overflow:hidden；次选 font-size:0。

```css
.logo {
  display: block;
  overflow: hidden;
  text-indent: -200px; /* 定长，足够推出文字即可 */
}
```

- text-indent 隐藏的文字仍在可访问性树里，读屏照常朗读——logo 语义文字选它正是为此。
- 不用百分比：text-indent 百分比相对父级宽度，文字与父宽关系不定，不可控。
- 不用 `-9999em` 巨值：没有收益，只维护一个巨大的行盒偏移；嵌套可聚焦元素时还可能触发容器滚动到不可见区域。
- 次选 font-size:0：连带 em 尺寸归零，子元素再起字号时谨慎。

## <image> 函数家族

凡接受 `<image>` 的属性（background-image / mask-image / border-image）都通吃整个家族——数据类型思维：成员学一次，处处可用。

| 函数 | 用途 |
| --- | --- |
| `url()` / 渐变 | 基础成员 |
| `cross-fade()` | 图像混合（渐变与位图可互混）；最实用的是单图调透明度——hover 半透明免做两张图 |
| `element()` | 把 DOM 元素变成实时图像（仅 Firefox，勿依赖） |
| `image-set()` | 按屏幕密度选图 → [responsive-logical.md](./responsive-logical.md) |
| `paint()` | Houdini 自绘图像 → [interaction-advanced.md](./interaction-advanced.md) |

家族互通意味着 mask-image / border-image 同样吃这些函数——遮罩场景见 [filters-masks.md](./filters-masks.md)。

```css
/* hover 半透明：一张图，免双图切换 */
a img { transition: opacity .2s; }
a:hover img { opacity: .6; }

/* 两图按透明度混合（新语法可多图各带百分比） */
.blend { background-image: cross-fade(url(a.png) 75%, url(b.png)); }
```
