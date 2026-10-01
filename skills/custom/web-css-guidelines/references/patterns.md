# 方案配方（patterns）

可直接复制的实战配方，按用途分组；机理见各条目链接的归属文件。同一条目内先给现代方案，历史方案仅在仍有独有价值时保留。

## 居中与覆盖

### 弹框水平垂直居中（双方案）
**When**: 大小不固定的弹框居中，免 JS 免 resize 监听。
**How**: 现代方案 `width/height:fit-content; position:absolute; inset:0; margin:auto`（transform 留给入场动画）；传统方案（ strut 机理）：fixed 容器 `text-align:center; font-size:0` + `:after{content:''; display:inline-block; height:100%; vertical-align:middle}` + 弹框 `display:inline-block; vertical-align:middle`，容器 `overflow:auto` 支持超高滚动。机理见 [inline-box.md](./inline-box.md) 与 [positioning.md](./positioning.md)。
**Trade-offs**: fit-content 方案独占 transform；strut 方案是近似居中（font-size:0 后偏差消失）且超高可滚。

### absolute 全屏覆盖
**When**: 遮罩层、全屏容器。
**How**: `position:absolute; inset:0`；居中再加定宽高 + `margin:auto`。
**Trade-offs**: 流体特性写法吃 margin/padding 自动分配；`width/height:100%` 加 margin 会溢出。

## 布局

### 响应式等分卡片（auto-fit 公式）
**When**: 卡片/图片列表，列数随容器宽度自适应。
**How**: `display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: ...`。见 [layout-flex-grid.md](./layout-flex-grid.md)。
**Trade-offs**: 一行解决断点问题；min 值即最小卡片宽；子项不足时也铺满（auto-fill 会留白）。

### flex 最后一行左对齐
**When**: space-between 列表末行元素不齐。
**How**: 列数固定 → 负 margin 补偿或等尺寸占位元素；**列数不固定 → 换 grid**（天然左对齐，零 hack）。
**Trade-offs**: grid 是 flex 死角的标准逃生门。

### 流体两栏（一侧定宽）
**When**: 图文混排、侧栏 + 内容。
**How**: 定宽侧 `float:left`，内容侧 `margin-left` 避让（需知定宽值）；宽度不定时给内容侧触发 BFC（`overflow:hidden`）自动收缩避让。见 [layout-flow.md](./layout-flow.md)。
**Trade-offs**: 现代项目直接 flex/grid；float 两栏仅在维护旧布局时使用。BFC 栏零计算但 overflow 裁剪有锚点定位隐患。

### 等高布局
**When**: 分栏背景色需与容器等高。
**How**: flex/grid 子项天然等高，默认选它。历史方案：table-cell 等高（最干净）；`margin-bottom:-9999px; padding-bottom:9999px` + 父 `overflow:hidden`；父 `border-left:150px solid` + 栏负 margin。
**Trade-offs**: margin 负值法有锚点定位/overflow 限制；border 法不支持百分比宽。

### sticky 层次滚动
**When**: 标题依次置顶、评论区从内容后浮现。
**How**: 标题 `position:sticky; top:0`；评论 `sticky; bottom:50vh; z-index:-1`；**每段内容独立容器包裹**（多个 sticky 依次推开的关键）。见 [positioning.md](./positioning.md)。
**Trade-offs**: 祖先不能有 overflow≠visible；父容器高度需大于 sticky 元素。

## 内联与文本

### 图片底部间隙清除
**When**: 块容器里图片下方多出几像素。
**How**: 四选一：图片 `display:block`（一锅端）；容器 `line-height:0`；容器 `font-size:0`（行高需相对值）；图片 `vertical-align:top|middle|bottom`。机理见 [inline-box.md](./inline-box.md)。
**Trade-offs**: 块状化影响图文混排；font-size:0 影响容器内其他文字。

### 20px 图标基线对齐体系
**When**: 全站背景图标与文字对齐，免逐个 vertical-align 调参。
**How**: 图标统一规格 + `display:inline-block`；标签内永远有字符（`:before{content:'\3000'}` 全角空格）；用 `text-indent:-999em; letter-spacing:-1em` 藏字，保持 overflow:visible → 基线 = 内部字符基线，天然对齐。
**Trade-offs**: 需统一图标规格；尺寸是经验值，按站点字号调整。

### 全局行高重置
**When**: 任何站点初始化。
**How**: `body{line-height:1.5}`（数值！不是 150%/1.5em）；表单补 `input,button{line-height:inherit}`；行高计算**向上舍入**（14px 字号 1.42858 才是 20px）。
**Trade-offs**: 数值继承属性值随字号缩放；像素级精确布局才用长度值。

### 文本隐藏（logo 等）
**When**: SEO 保留文字、视觉显示图片。
**How**: 首选 `text-indent:-120px`（定长）+ `overflow:hidden`；次选 `font-size:0`。
**Trade-offs**: 不用 `-9999em`（性能 + 读屏）与 `text-indent:100%`（依赖包含块宽度）；text-indent 只作用第一行，inline-block 子元素需重置。

### 下划线精致化
**When**: text-decoration 下划线与中文粘连/穿过英文。
**How**: `text-decoration:none; border-bottom:1px solid; padding-bottom: 调距`；border-color 缺省跟随 color（hover 自动变色）。
**Trade-offs**: 多行文本每行都有下划线（与 text-decoration 行为一致）。

### 输入框视觉大写
**When**: 身份证 X、验证码输入。
**How**: `input{text-transform:uppercase}`。
**Trade-offs**: 只改视觉不改值，提交前无需转换。

## 图形与视觉

### border 三角/梯形
**When**: 对话框尖角、下拉箭头。
**How**: `width:0; border:10px solid; border-color:#f30 transparent transparent`（朝下三角）；宽度不归零得梯形。机理（转角等分）见 [background-border.md](./background-border.md)。
**Trade-offs**: 边框色缺省跟随 color，hover 改 color 一处搞定。

### 多背景绘制图形
**When**: 加减号、十字、刻度线等简单图标，免伪元素免图片。
**How**: `background: linear-gradient(currentColor,currentColor) no-repeat center/.875em 2px, linear-gradient(currentColor,currentColor) no-repeat center/2px .875em`（起止同色 = 纯色条）。
**Trade-offs**: 颜色跟随 currentColor；复杂图形交给 SVG。

### 渐变边框
**When**: 醒目模块、警示条。
**How**: `border:10px solid; border-image: linear-gradient(...) 20 / 10px`；圆角加 `clip-path: inset(0 round 10px)`；**border 声明必须在 border-image 之前**。见 [background-border.md](./background-border.md)。
**Trade-offs**: border-image 机制怪异学习成本高；简单场景用背景 + 内层元素替代。

### 毛玻璃
**When**: 浮层、侧边栏、顶栏磨砂背景。
**How**: `background: rgba(255,255,255,.2); backdrop-filter: blur(8px)`。见 [filters-masks.md](./filters-masks.md)。
**Trade-offs**: 背后必须有内容才看得见；大面积 blur 有性能成本。

### 图标任意变色（mask）
**When**: 多色 SVG/iconfont 图标需跟随 color 换色。
**How**: `background: var(--color); mask: url(icon.svg) no-repeat center / contain`。
**Trade-offs**: 图标变单色（遮罩只认形状）；旧 webkit 需 -webkit-mask。

### 形状揭示动画
**When**: 图片/卡片圆形展开、气泡尖角变形。
**How**: `clip-path: circle(0 at 50% 50%)` → `circle(200px at 50% 50%)` + transition；polygon 前后点数一致才可过渡。
**Trade-offs**: 被裁区域不可点击；动画只限 basic-shape 函数。

### 沿路径运动
**When**: 元素沿曲线/轨迹巡游。
**How**: `offset-path: path("M...")` + `animation { to { offset-distance: 100% } }`；`offset-rotate:auto` 朝向切线。
**Trade-offs**: offset 缩写兼容参差，子属性分开写。

### 阴影动画性能优化
**When**: hover 阴影过渡在复杂页面掉帧。
**How**: 双伪元素各持一层阴影，`transition: opacity` 切换（::before 常态 / ::after hover 态）。
**Trade-offs**: 多两个合成层；把重绘降为纯合成。见 [transform-animation.md](./transform-animation.md)。

## 交互体验

### 滚动穿透终结
**When**: 弹层/抽屉滚动到边缘带动 body 滚动。
**How**: 弹层滚动容器 `overscroll-behavior: contain`。
**Trade-offs**: 老浏览器忽略即回退原状，渐进增强零风险。传统方案：根元素 `overflow:hidden` + JS 补滚动条宽度防晃动。

### hover 延时下拉
**When**: 相邻多个 hover 触发点，防误触闪现。
**How**: transition 写在 hover 态 `:hover .list{visibility:visible; transition:visibility 0s .2s}`——进入延时、移出立即；或显示方向直接 `transition-delay:.2s`。
**Trade-offs**: 依赖 transition 支持 visibility（display 不支持）。

### 遮罩镂空可点击
**When**: 全屏蒙层上特定区域可交互。
**How**: 蒙层 `pointer-events:none`，镂空区 `pointer-events:auto`（利用继承性复活）。
**Trade-offs**: pointer-events 不拦键盘，禁用语义仍需 disabled。

### 需要测量尺寸的隐藏
**When**: 隐藏元素要先取 clientWidth/getBoundingClientRect。
**How**: `position:absolute; visibility:hidden`（display:none 全为 0）。
**Trade-offs**: 元素仍渲染，控制使用面积。

### label 代言按钮
**When**: 原生按钮/表单控件 UI 难改造，用 label 变身。
**How**: 原生控件 `position:absolute` + `clip-path: inset(50%)` 隐藏（视觉消失、行为与可达性保留）；label 承接 UI；`:focus-visible + label.btn` 补键盘焦点环。
**Trade-offs**: 保留原生行为与可访问性；多一层样式维护。

### outline 镂空遮罩
**When**: 头像剪裁等"四周遮罩、中间透明"。
**How**: 剪裁框 `outline:256px solid rgba(0,0,0,.5)` + 父 `overflow:hidden`。
**Trade-offs**: outline 只能四方扩散，必须配裁剪容器定向。

### body 级 progress 光标
**When**: 界面已渲染但 JS 未就绪的窗口期。
**How**: 初始 `body{cursor:progress}`，JS 初始化完成改回 `auto`。
**Trade-offs**: 不能替代组件级 loading（键盘用户感知不到）。

## 工程与性能

### CSS 变量主题系统
**When**: 换肤/深色模式/组件定制。
**How**: `:root{--primary:...}` + 组件读变量；深色模式 `@media (prefers-color-scheme: dark){ :root{--primary:...} }`；Shadow DOM 穿透靠变量继承。见 [variables.md](./variables.md)。
**Trade-offs**: 变量不可过渡（除非 @property 注册类型）。

### @property 渐变过渡
**When**: 渐变颜色/角度需要平滑变化。
**How**: `@property --c{ syntax:'<color>'; inherits:false; initial-value:#09f }` + `transition: --c .3s`。
**Trade-offs**: 仅现代浏览器；未注册时瞬时切换（可接受的降级）。

### 数据驱动样式（变量 + calc + counter）
**When**: 进度条/评分/饼图等由数据决定的表现。
**How**: HTML `style="--percent:40"`；CSS `width: calc(1% * var(--percent))`；数值显示 `counter-reset:p var(--percent); content:counter(p)`。
**Trade-offs**: JS 只改一个变量；counter 只能整数。

### 属性值语法差异分流
**When**: 新旧浏览器加载不同资源/样式。
**How**: 旧声明在前、新语法声明在后：`background:url(a.gif); background:url(a.png), linear-gradient(transparent,transparent)`（不认新语法的浏览器整条忽略）。
**Trade-offs**: 依赖"解析失败整条忽略"规则，比 hack 稳定。

### 展开收起动画（任意高度）
**When**: 高度不定的面板展开/收起需要 transition。
**How**: `max-height:0; overflow:hidden; transition:max-height .25s` ↔ 激活态给贴近内容上限的值。
**Trade-offs**: max-height 远超实际高度时收起有可见延迟。

### 长列表渲染优化
**When**: 信息流/长表格首屏渲染慢。
**How**: 列表项 `content-visibility:auto; contain-intrinsic-size: 估计高度`。见 [interaction-advanced.md](./interaction-advanced.md)。
**Trade-offs**: 高度估计不准有轻微滚动跳动。

## 兼容与适配

### 安全区适配
**When**: 刘海屏/底部横条设备。
**How**: viewport meta 加 `viewport-fit=cover` + `padding-bottom: env(safe-area-inset-bottom, 20px)`。见 [responsive-logical.md](./responsive-logical.md)。
**Trade-offs**: env 名区分大小写；默认值兜底未支持设备。

### 流式数值黄金公式
**When**: 字号/间距随视口连续缩放。
**How**: `clamp(MIN, calc(基准 + 斜率*(100vw - 设计宽)/区间宽), MAX)`。
**Trade-offs**: 免断点；上下限保护极端视口。

### 逻辑属性对称布局
**When**: 聊天对话等左右镜像布局。
**How**: 一侧用 margin-inline-start 等逻辑属性写好，另一侧容器一句 `direction: rtl`。
**Trade-offs**: 只在配合 direction/writing-mode 时有意义；flex row-reverse 与逻辑属性无关。

### stretch 三连声明
**When**: 标签受限的替换元素自适应宽度（button/table）。
**How**: `width:-webkit-fill-available; width:-moz-available; width:stretch`。
**Trade-offs**: Firefox 的 table 不认 -moz-available。
