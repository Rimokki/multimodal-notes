<script lang="ts" setup>
  const content = `
    <p style="line-height: 1.75;">本应用是一个基于Tiptap构建的多模态笔记工具，旨在为用户带来更加轻便、高效的知识记录体验。</p>
    <h2>一、常用工具</h2>
    <p style="text-align: center;"></p>
    <img src="/images/guide_toolbar.png" alt="guide_toolbar.png" title="guide_toolbar.png">
    <p style="text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">工具栏</span></p>
    <p style="text-align: justify;"></p>
    <p style="line-height: 1.75;">本应用提供了常用的格式工具，您可以通过顶部的工具栏快速插入，下面是常用格式的预览：</p>
    <p style="line-height: 1.75;">支持<strong>粗体</strong> 、<em>斜体</em>、<u>下划线</u>、<s>删除线</s>、<sup>上标</sup>、<sub>下标</sub>、<code>代码块</code>、<mark data-color="#dcfce7" style="background-color: rgb(220, 252, 231); color: inherit;">高亮</mark>、<span style="color: rgb(229, 47, 69);">颜色</span>等文本样式；</p>
    <p style="line-height: 1.75;">支持插入<strong>图片、表格、画板、文件、音频、引用、折叠块、列表</strong>等内容；</p>
    <p style="line-height: 1.75;">本笔记支持markdown语法的解析和插入，您可以将markdown内容粘贴至编辑器中，编辑器会自动进行解析并生成对应的结构，若识别失败，请尝试使用<code>ctrl+shift+v</code>快捷键去掉多余格式进行粘贴。</p>
    <blockquote><p>这是一段引用</p></blockquote>
    <details class="details" open=""><summary>这是一处折叠块</summary><div data-type="detailsContent"><p>这是被折叠的内容</p></div></details>
    <ol><li><p>有序列表</p><ol><li><p>按<code>tab</code>以缩进</p></li></ol></li></ol>
    <ul><li><p>无序列表</p><ul><li><p>按<code>tab</code>以缩进</p></li></ul></li></ul>
    <ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p><span style="line-height: 1.75;">任务列表</span></p></div></li><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p><span style="line-height: 1.75;">已完成的任务</span></p></div></li></ul>
    <h2>二、特色功能</h2>
    <h3>1、手绘画布</h3>
    <p>借助手绘画布，你可以在上面自由绘制，为笔记内容添加活力。</p>
    <img src="/images/guide_canvas.png" alt="guide_canvas.png" title="guide_canvas.png">
    <p style="text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">画布</span></p>
    <h3>2、代码块</h3>
    <p style="line-height: 1.75;">支持插入代码块，以更加直观的方式展示代码。支持输入<code>&#96;&#96;&#96; </code>或者<code>&#96;&#96;&#96;javascript </code>快速向笔记中插入代码块或为其指定语言（需要最后的空格以正常识别）</p>
    <pre><code class="language-javascript">This is a code block.</code></pre>
    <h3>3、文件附件</h3>
    <p>支持在工具栏右上角菜单中为笔记插入图片、音频、和其它格式的文件</p>
    <img src="/images/guide_attachments.png" alt="guide_attachments.png" title="guide_attachments.png">
    <p style="text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">插入附件</span></p>
    <h3>4、表格节点</h3>
    <p style="line-height: 1.75;">支持向笔记中插入表格，可通过表格上方的浮动菜单自定义表头行/列，添加或删除行/列</p>
    <table style="min-width: 294px;"><colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="width: 244px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p style="text-align: center;">表头</p></th><th colspan="1" rowspan="1"><p style="text-align: center;">表头</p></th><th colspan="1" rowspan="1" colwidth="244"><p style="text-align: center;">表头</p></th></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center;">1</p></td><td colspan="1" rowspan="1"><p style="text-align: center;">2</p></td><td colspan="1" rowspan="1" colwidth="244"><p style="text-align: center;">3</p></td></tr><tr><td colspan="1" rowspan="1"><p style="text-align: center;">4</p></td><td colspan="1" rowspan="1"><p style="text-align: center;">5</p></td><td colspan="1" rowspan="1" colwidth="244"><p style="text-align: center;">6</p></td></tr></tbody></table>
    <h3>5、文字识别</h3>
    <p style="line-height: 1.75;">本应用基于<code>Tesseract.js</code>实现了本地环境的文字识别，您可以上传图片，应用会在后台自动处理并识别文字，若您对结果不够满意，可在下方编辑框中修改后再插入正文当中。受限于<code>Tesseract.js</code>本身的能力，识别结果仅供参考，请尽量选择字体工整的印刷体进行识别。</p>
    <img src="/images/guide_ocr.png" alt="guide_ocr.png" title="guide_ocr.png">
    <p style="line-height: 1.75; text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">文字识别</span></p>
    <h3>6、节点拖拽</h3>
    <p>将鼠标焦点移至节点（段落、图片、表格等）上，左上角便会出现拖拽把手，拖动把手可快速移动节点</p>
    <h2>三、其它功能</h2>
    <p style="line-height: 1.75;">您可以通过笔记编辑页顶部的按钮为笔记添加标签、设置收藏或者以Markdown（.md）、PDF、DOCX格式导出您的笔记内容，在“我的笔记”页面快速收藏和删除笔记，如果不小心误删了某条笔记，可通过回收站页面快速恢复笔记。</p>
    <h3>1、添加标签</h3>
    <p style="line-height: 1.75;">每条笔记支持添加5个标签，添加标签后，您可以在“我的笔记”页面看到它们，可以通过搜索标签来快速定位某条笔记。</p>
    <img src="/images/guide_tag.png" alt="guide_tag.png" title="guide_tag.png">
    <p style="line-height: 1.75; text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">添加标签</span></p>
    <h3>2、导出笔记</h3>
    <p style="line-height: 1.75;">笔记支持以Markdown、PDF和DOCX导出，您可以根据实际需求选择不同的格式。请注意，因为不同格式的兼容性不尽相同，所以导出后丢失部分格式是无法避免的，如果您希望较为完整的保留笔记的内容，请选择以PDF格式导出。</p>
    <p style="line-height: 1.75;">为了尽可能多的保留笔记的原始内容，在导出PDF时，请在弹出的窗口中手动选择“另存为PDF”选项并取消勾选页眉和页脚来保存，具体操作如下图所示。</p>
    <img src="/images/guide_export.png" alt="guide_export.png" title="guide_export.png">
    <p style="text-align: center;"><span style="color: rgb(191, 193, 193); font-size: 14px;">导出为PDF</span></p>
  `
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">快速指南</h1>
    <div class="about-preview">
      <ClientOnly>
        <Previewer :content="content" />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
  .about-preview :deep(.note-rich-content .ProseMirror) {
    padding: 0;
  }
</style>
