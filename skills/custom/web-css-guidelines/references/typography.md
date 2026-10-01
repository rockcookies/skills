# 排版与字体：字号、行高、字重、加载与文本装饰

管文本与字体：设置或排障 font-size / line-height / 字体族与字重 / 字体加载 / 对齐 / 下划线 / 着重号 / 可变字体时读。行盒与 strut 机理归 inline-box.md。

## font-size 联动链

line-height 数值与 vertical-align 百分比都以 font-size 为乘数——改字号会同时改变这两处的计算值。

- `line-height: 1.5` → 行高 = 1.5 × font-size。
- `vertical-align: -25%` → 偏移 = -25% × line-height 计算值；`font-size: 16px; line-height: 1.5` 时 ≡ -6px。
- vertical-align 的 px 数值不受字号影响：跨字号固定对齐用数值，随字号缩放用百分比。
- 百分比写法随字号自适应，是"永远垂直居中的行内图标"的写法基础：

```css
p > img { vertical-align: 25%; position: relative; top: 8px; }
```

反模式：图标用 px 写死 vertical-align，字号一换就错位——百分比 + 相对微调才自适应。

## 全局行高只设数值

机理（strut 与行高继承差异）见 [inline-box.md](./inline-box.md)。规则：

- 行高一律写无单位数值，不写 px / em / 百分比——数值被子元素按自身字号重新计算；其余写法继承的是父级的计算值，小字号子元素被大字行距撑坏。
- `normal` 不是常数，是随 font-family 变化的变量：微软雅黑 ≈1.32、宋体 ≈1.141。换字体行高会漂移，跨字体场景显式给数值。

```css
body { line-height: 1.5; }
```

反模式：`* { line-height: 24px }` 这类全局长度值——所有子元素继承 24px 计算值，小字区行距过松、大字区过挤。

## font-family

- 字体栈末尾用通用族兜底（sans-serif / serif / monospace）；移动端 body 用 sans-serif——衬线体笔画粗细对比大，细节在低分屏发糊，屏幕 UI 用笔画均匀的无衬线更清晰。
- 现代栈以 system-ui 打头，免去手工枚举各系统字体：

```css
body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
```

- @font-face 的 font-family 是自定义变量名：可给字体重命名、把长字体列表打包成一个短名，或按 unicode-range 拆分中英文字体（汉字 U+4E00-9FA5）；src 里 local() 引用系统已装字体，已安装用户免下载。
- font 缩写必须 size 与 family 成对出现；不带行高就别用缩写——缩写会把 line-height 重置为 normal，跨浏览器行高漂移。

## font-weight 与 bolder / lighter 临界点

font-weight 只接受 100~900 的整百数（写 550 无效）；400 = normal、700 = bold。bolder / lighter 不是 ±100，而是跳到相邻临界点：

| 继承值 | bolder | lighter |
| --- | --- | --- |
| 100–300 | 400 | 100 |
| 400–500 | 700 | 100 |
| 600–700 | 900 | 400 |
| 800–900 | 900 | 700 |

- 指定了字重却"没反应"：字体文件没有对应字面，浏览器就近取——Windows 中文字体常只有一档。要多字重，选带多字面的字体（思源黑体、苹方）或可变字体。

## Chrome 12px 最小字号

font-size 计算值小于 12px 时一律按 12px 渲染，唯一例外是 0（0.0001px 也不行）。

- 排障信号：rem 布局整体偏大 20%——先查根字号。`html { font-size: 62.5% }` 想得 10px，Chrome 里实为 12px，全站 rem 随之放大。
- 根字号方案基于 16px（medium）换算，或交给预处理器计算。
- `font-size: 0` 合法且有用：隐藏装饰性文字（logo 底字）。
- 消除 inline-block 元素间空隙也靠 `font-size: 0`，空隙机理归 [inline-box.md](./inline-box.md)。

## white-space 三问

white-space 的每个值回答三个问题：合并空白？保留换行？允许环绕？

| 值 | 合并空白 | 保留换行 | 允许环绕 |
| --- | --- | --- | --- |
| normal | 是 | 否 | 是 |
| nowrap | 是 | 否 | 否 |
| pre | 否 | 是 | 否 |
| pre-wrap | 否 | 是 | 是 |
| pre-line | 是 | 是 | 是 |

- 代码块用 pre-wrap：保留缩进且自动换行；pre + 横向滚动条是旧布局遗留。
- nowrap 让宽度表现为最大内容宽，配 overflow 做横向滚动，或修窄容器内文字"一柱擎天"：

```css
.nav { white-space: nowrap; overflow-x: auto; }
```

反模式：代码块 `white-space: pre` + 横向滚动条——pre-wrap 已保留格式且自动换行。

## text-align: justify 与中文

justify 靠拉伸词间空隙对齐两端；中文没有空格，各浏览器对 CJK 的拉伸策略不同，中英混排时字距可能忽大忽小。

- 纯中文段落现代浏览器可正常 justify；混排字距失控就退回左对齐，别硬调。
- 两端对齐当"布局"用（任意个子项两端贴边、间隙均分）：inline-block + justify + 末尾宽度占位：

```css
.justify { text-align: justify; }
.justify::after { content: ""; display: inline-block; width: 100%; }
```

反模式：窄容器或短行开 justify——可拉伸的空隙太少，字距被拉得过大；中文窄场景用左对齐。

## 下划线精致化

text-decoration 的线贴着字形下缘、位置不可调，中文降部必粘连；内联元素的垂直 border 不参与行盒高度计算，间距可控。

```css
a { text-decoration: none; border-bottom: 1px solid; padding-bottom: 2px; }
a:hover { color: #f30; }
```

- border-color 缺省 = color 计算值：hover 只改 color，下划线自动同色。
- border 方案还支持 dashed / dotted 线型。
- 语义或波浪线场景用 text-decoration 本体：`text-decoration: underline wavy`；间距用 text-underline-offset、粗细用 text-decoration-thickness 微调，`text-underline-position: under` 可避开中文降部。

## font-display 与字体加载

字体加载时间线分三段：阻塞期（文字隐形等字体）、交换期（先显示 fallback 文字）、失败期（放弃并换回 fallback）；font-display 决定三段时长。

| 值 | 阻塞期 | 交换期 | 适用 |
| --- | --- | --- | --- |
| auto / block | ~3s | 无限 | 图标字体：短暂隐形优于闪现后备字形 |
| swap | ~100ms | 无限 | 重要小文本（标题、logo 文字） |
| fallback | ~100ms | 3s | 大段正文 |
| optional | ~100ms | 无 | 日常 Web 文本首选：内容优先，二次访问靠缓存命中 |

- 格式只发 woff2（比 woff 小 30%+ 且无需额外压缩）；ttf / otf 没有 Web 使用理由。
- 小体积关键字体（≤30KB，图标字体）可 Base64 内联进 CSS：省一次请求，彻底无闪烁。
- emoji 字体用 @font-face + unicode-range 前移，防止被常规字体抢先渲染 emoji 码位：

```css
@font-face {
  font-family: Emoji;
  src: local("Apple Color Emoji"), local("Segoe UI Emoji"), local("Noto Color Emoji");
  unicode-range: U+1F000-1F644, U+203C-3299;
}
```

## text-emphasis 中文着重号

text-emphasis 在字形旁添加强调符：字号固定为主文字的一半，行高不足时行盒自动增高。默认位置 over right，中文习惯标注在下方。

```css
em { text-emphasis: dot deepskyblue; text-emphasis-position: under right; }
```

- 强调符形状：dot / circle / double-circle / triangle / sesame，可加 filled / open 修饰，或直接给一个字符串。

## 文字描边与 text-fill-color

- `-webkit-text-fill-color` 优先级高于 color：特殊填充（渐变文字、高亮色）写在 fill 上，color 保持原值，继续驱动光标色、border / 阴影缺省色与继承默认色——换色不破坏 color 体系。
- `-webkit-text-stroke` 的描边居中于字形边缘、向内侵蚀笔画，细字重加描边必糊。需要完整字形的描边改用 SVG `paint-order`，见 [interaction-advanced.md](./interaction-advanced.md)。

## font-synthesis 禁伪粗体

字体缺粗体 / 斜体字面时，浏览器用算法伪造（描边加粗、几何倾斜），中文小字号明显发糊。

```css
body { font-synthesis: none; }
```

- 代价：请求的字面不存在时直接回退到正常体——确认字体真的带多字面再禁。
- 同一开关管伪斜体：字体无 italic 字面时浏览器做几何倾斜，`font-synthesis: none` 一并禁止。

## tab-size

制表符默认渲染宽度为 8 个字符，代码缩进视觉过宽；tab-size 接受字符数或长度：

```css
pre { tab-size: 4; }
```

- 配 `white-space: pre | pre-wrap` 才有意义——normal 会把制表符折叠成普通空格。

## font-variant 与 font-feature-settings

两者都依赖字体文件内含对应的 OpenType 特征——中文字体大多没有。不生效先查字体，不是浏览器 bug。

- 高频值：`font-variant-numeric: tabular-nums` 等宽数字，金额列、倒计时对齐必备；另有 slashed-zero（斜杠零）、ordinal、fraction 等。
- `font-feature-settings: "smcp" 1` 是直通 OpenType 标签的低阶接口；与 font-variant 同时作用于同一特征时 font-variant 优先——能用 font-variant 表达就不用 feature-settings。
- font-kerning（字距微调）对中文价值有限，保持默认 auto 即可。

## 可变字体

一个字体文件内置多个设计轴，替代"每档字重一个文件"（思源黑体 7 档共 55.7MB）与整百档位的粗糙。

- 标准轴：wght（字重）、wdth（宽度）、ital（斜体）、slnt（倾斜）、opsz（光学尺寸），另有字体自定义轴。
- 优先用高级属性（font-weight / font-stretch / font-style / font-optical-sizing）映射标准轴；`font-variation-settings` 负责自定义轴与整百之间的精调：

```css
h1 { font-variation-settings: 'wght' 375; }
```

- `font-optical-sizing: auto` 让 opsz 随字号自动调整（小字号笔画更粗更开阔）。
- 静态字体的字重是离散字面：hover 加粗只能整档跳变；平滑的字重过渡（400 渐到 700）只有可变字体能做。
- 反模式：对普通静态字体写 font-variation-settings——无效，先确认字体是可变字体。

## 输入框视觉大写

text-transform 只改渲染不改 value：验证码、身份证号输入框加 uppercase，用户敲小写也显示大写，消除"要不要按 Shift"的负担。

```css
input.code { text-transform: uppercase; }
```

提交值仍是用户输入的原样——需要大写存储时在提交前转换。
