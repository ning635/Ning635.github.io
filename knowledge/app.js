const runtimeConfig = window.ECHO_ARCHIVE_CONFIG || { mode: 'server' };
const isReadOnly = runtimeConfig.mode === 'static';
const categoryColors = ['#246bce', '#2f8a69', '#c26242', '#7c5ab3', '#b07b1f', '#4e7f91', '#a64f72'];

const state = {
  entries: [],
  selectedId: null,
  selectedEntry: null,
  category: 'all',
  query: '',
  sort: 'newest',
  importFiles: [],
  requestToken: 0
};

const viewerState = {
  images: [],
  index: 0,
  scale: 1,
  fitScale: 1,
  x: 0,
  y: 0,
  pointerId: null,
  pointerStartX: 0,
  pointerStartY: 0,
  panStartX: 0,
  panStartY: 0
};

const savedLibraryWidth = Number.parseInt(localStorage.getItem('echo-library-width') || '', 10);
const layoutState = {
  libraryWidth: Number.isFinite(savedLibraryWidth) ? savedLibraryWidth : 410,
  collapsed: localStorage.getItem('echo-library-collapsed') === 'true',
  dragging: false,
  pointerId: null,
  pointerStartX: 0,
  widthStart: 410
};

const elements = {
  entryList: document.querySelector('#entry-list'),
  contentGrid: document.querySelector('.content-grid'),
  libraryPanel: document.querySelector('#library-panel'),
  libraryToggle: document.querySelector('#library-toggle'),
  panelResizer: document.querySelector('#panel-resizer'),
  readerEmpty: document.querySelector('#reader-empty'),
  readerContent: document.querySelector('#reader-content'),
  resultCount: document.querySelector('#result-count'),
  activeCategoryLabel: document.querySelector('#active-category-label'),
  categoryNav: document.querySelector('#category-nav'),
  categoryOptions: document.querySelector('#category-options'),
  search: document.querySelector('#search-input'),
  sort: document.querySelector('#sort-select'),
  entryDialog: document.querySelector('#entry-dialog'),
  entryForm: document.querySelector('#entry-form'),
  entryDialogTitle: document.querySelector('#entry-dialog-title'),
  entryId: document.querySelector('#entry-id'),
  entryTitle: document.querySelector('#entry-title'),
  entryCategory: document.querySelector('#entry-category'),
  entryTags: document.querySelector('#entry-tags'),
  entryBody: document.querySelector('#entry-body'),
  saveEntry: document.querySelector('#save-entry'),
  importDialog: document.querySelector('#import-dialog'),
  importForm: document.querySelector('#import-form'),
  fileInput: document.querySelector('#file-input'),
  fileQueue: document.querySelector('#file-queue'),
  dropZone: document.querySelector('#drop-zone'),
  dropTitle: document.querySelector('#drop-title'),
  importCategory: document.querySelector('#import-category'),
  importTags: document.querySelector('#import-tags'),
  startImport: document.querySelector('#start-import'),
  confirmDialog: document.querySelector('#confirm-dialog'),
  confirmDelete: document.querySelector('#confirm-delete'),
  imageViewer: document.querySelector('#image-viewer'),
  imageViewerStage: document.querySelector('#image-viewer-stage'),
  imageViewerImage: document.querySelector('#image-viewer-image'),
  imageViewerTitle: document.querySelector('#image-viewer-title'),
  imageViewerCount: document.querySelector('#image-viewer-count'),
  imageZoomValue: document.querySelector('#image-zoom-value'),
  imageDownload: document.querySelector('#image-download'),
  imagePrevious: document.querySelector('#image-previous'),
  imageNext: document.querySelector('#image-next'),
  toast: document.querySelector('#toast'),
  storageLabel: document.querySelector('#storage-label'),
  storageSummary: document.querySelector('#storage-summary')
};

let toastTimer;
let searchTimer;
let staticEntriesPromise;

function refreshIcons(root = document) {
  window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' }, root });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle('is-error', type === 'error');
  elements.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 2600);
}

function configureRuntime() {
  document.body.classList.toggle('is-read-only', isReadOnly);
  if (!isReadOnly) return;

  elements.storageLabel.textContent = '云端镜像';
  document.querySelector('.topbar-actions').hidden = true;
  document.querySelectorAll('#new-entry-sidebar, #new-entry, #import-entry').forEach((button) => {
    button.hidden = true;
  });
}

function getLibraryBounds() {
  const availableWidth = elements.contentGrid.clientWidth || Math.max(window.innerWidth - 236, 600);
  return {
    minimum: 280,
    maximum: Math.max(280, Math.min(620, Math.floor(availableWidth * 0.56)))
  };
}

function getAppliedLibraryWidth() {
  const { minimum, maximum } = getLibraryBounds();
  return Math.min(maximum, Math.max(minimum, layoutState.libraryWidth));
}

function syncLibraryLayout() {
  const isDesktop = window.innerWidth > 820;
  const isCollapsed = isDesktop && layoutState.collapsed;
  const appliedWidth = getAppliedLibraryWidth();
  const { minimum, maximum } = getLibraryBounds();

  elements.contentGrid.style.setProperty('--library-width', `${appliedWidth}px`);
  elements.contentGrid.classList.toggle('is-library-collapsed', isCollapsed);
  elements.libraryPanel.inert = isCollapsed;
  elements.libraryPanel.setAttribute('aria-hidden', String(isCollapsed));
  elements.panelResizer.tabIndex = isDesktop && !isCollapsed ? 0 : -1;
  elements.panelResizer.setAttribute('aria-valuemin', String(minimum));
  elements.panelResizer.setAttribute('aria-valuemax', String(maximum));
  elements.panelResizer.setAttribute('aria-valuenow', String(appliedWidth));

  const icon = isCollapsed ? 'panel-left-open' : 'panel-left-close';
  const label = isCollapsed ? '显示回答档案' : '隐藏回答档案';
  elements.libraryToggle.classList.toggle('is-collapsed', isCollapsed);
  elements.libraryToggle.setAttribute('aria-label', label);
  elements.libraryToggle.setAttribute('title', label);
  elements.libraryToggle.setAttribute('aria-expanded', String(!isCollapsed));
  if (elements.libraryToggle.dataset.icon !== icon) {
    elements.libraryToggle.dataset.icon = icon;
    elements.libraryToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
    refreshIcons(elements.libraryToggle);
  }
}

function persistLibraryLayout() {
  localStorage.setItem('echo-library-width', String(Math.round(layoutState.libraryWidth)));
  localStorage.setItem('echo-library-collapsed', String(layoutState.collapsed));
}

function toggleLibraryPanel(force) {
  layoutState.collapsed = typeof force === 'boolean' ? force : !layoutState.collapsed;
  syncLibraryLayout();
  persistLibraryLayout();
}

function adjustLibraryWidth(width, persist = false) {
  const { minimum, maximum } = getLibraryBounds();
  layoutState.libraryWidth = Math.min(maximum, Math.max(minimum, width));
  layoutState.collapsed = false;
  syncLibraryLayout();
  if (persist) persistLibraryLayout();
}

async function api(path, options = {}) {
  if (isReadOnly) return staticApi(path, options);
  const response = await fetch(path, options);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || `请求失败 (${response.status})`);
  return data;
}

function staticExcerpt(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' [代码] ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
    .replace(/[#>*_`~\[\]()|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

async function getStaticEntries() {
  if (!staticEntriesPromise) {
    const url = new URL(runtimeConfig.dataUrl || './data/entries.json', window.location.href);
    staticEntriesPromise = fetch(url, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error(`云端档案读取失败 (${response.status})`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    });
  }
  return staticEntriesPromise;
}

async function staticApi(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  if (method !== 'GET') throw new Error('公网镜像仅支持浏览');
  const requestUrl = new URL(path, 'https://echo-archive.local');
  const entries = await getStaticEntries();

  if (requestUrl.pathname === '/api/health') return { ok: true, storage: 'cloud-mirror' };
  if (requestUrl.pathname === '/api/stats') {
    const categories = {};
    for (const entry of entries) categories[entry.category] = (categories[entry.category] || 0) + 1;
    return {
      total: entries.length,
      favorites: entries.filter((entry) => entry.favorite).length,
      categories: Object.fromEntries(
        Object.entries(categories).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      )
    };
  }

  const entryMatch = requestUrl.pathname.match(/^\/api\/entries\/([^/]+)$/);
  if (entryMatch) {
    const entry = entries.find((item) => item.id === decodeURIComponent(entryMatch[1]));
    if (!entry) throw new Error('没有找到这条记录');
    return entry;
  }

  if (requestUrl.pathname === '/api/entries') {
    const query = requestUrl.searchParams.get('query')?.trim().toLocaleLowerCase('zh-CN') || '';
    const category = requestUrl.searchParams.get('category') || 'all';
    const sort = requestUrl.searchParams.get('sort') || 'newest';
    const filtered = entries.filter((entry) => {
      if (category === 'favorite' && !entry.favorite) return false;
      if (category !== 'all' && category !== 'favorite' && entry.category !== category) return false;
      if (!query) return true;
      return [entry.title, entry.content, entry.category, ...(entry.tags || [])]
        .join('\n')
        .toLocaleLowerCase('zh-CN')
        .includes(query);
    });
    filtered.sort((a, b) => {
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'title') return a.title.localeCompare(b.title, 'zh-CN');
      return b.createdAt.localeCompare(a.createdAt);
    });
    return filtered.map(({ content, contentHtml, ...entry }) => ({
      ...entry,
      excerpt: staticExcerpt(content)
    }));
  }

  throw new Error('公网镜像中不存在该资源');
}

function formatListDate(value) {
  const date = new Date(value);
  const today = new Date();
  const sameYear = date.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat('zh-CN', sameYear
    ? { month: '2-digit', day: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' }
  ).format(date);
}

function formatFullDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function categoryFor(value) {
  if (value === 'all') return { label: '全部记录', color: '#68747e' };
  if (value === 'favorite') return { label: '已收藏', color: '#c08317' };
  const hash = [...String(value)].reduce((total, character) => ((total * 31) + character.codePointAt(0)) >>> 0, 0);
  return { label: value || '综合记录', color: categoryColors[hash % categoryColors.length] };
}

function renderList() {
  elements.resultCount.textContent = `${state.entries.length} 条`;

  if (!state.entries.length) {
    const isSearching = Boolean(state.query || state.category !== 'all');
    elements.entryList.innerHTML = `
      <div class="list-empty">
        <div>
          <i data-lucide="${isSearching ? 'search-x' : 'archive'}"></i>
          <h2>${isSearching ? '没有匹配记录' : '档案还是空的'}</h2>
          <p>${isSearching ? '换一个关键词或分类。' : isReadOnly ? '云端镜像暂时没有记录。' : '收录一条回答，建立第一份索引。'}</p>
          ${isSearching || isReadOnly ? '' : '<button class="primary-action" type="button" data-empty-create><i data-lucide="plus"></i><span>收录回答</span></button>'}
        </div>
      </div>`;
    elements.entryList.querySelector('[data-empty-create]')?.addEventListener('click', () => openEntryDialog());
    refreshIcons(elements.entryList);
    return;
  }

  elements.entryList.innerHTML = state.entries.map((entry, index) => {
    const category = categoryFor(entry.category);
    const tags = entry.tags?.length ? entry.tags.join(' · ') : '未加标签';
    return `
      <button class="entry-row${entry.id === state.selectedId ? ' is-selected' : ''}" type="button"
        data-entry-id="${escapeHtml(entry.id)}" style="--category-color:${category.color}; animation-delay:${Math.min(index * 24, 144)}ms">
        <span class="entry-row-top">
          <span class="entry-category">${escapeHtml(category.label)}</span>
          <span class="entry-date">${escapeHtml(formatListDate(entry.createdAt))}</span>
        </span>
        <h2>${escapeHtml(entry.title)}</h2>
        <p>${escapeHtml(entry.excerpt || '暂无摘要')}</p>
        <span class="entry-row-meta">
          ${entry.favorite ? '<i class="favorite-mark" data-lucide="star"></i>' : ''}
          <span class="tag-preview">${escapeHtml(tags)}</span>
        </span>
      </button>`;
  }).join('');

  elements.entryList.querySelectorAll('[data-entry-id]').forEach((row) => {
    row.addEventListener('click', () => openEntry(row.dataset.entryId));
  });
  refreshIcons(elements.entryList);
}

function setSelectedRow(id) {
  elements.entryList.querySelectorAll('[data-entry-id]').forEach((row) => {
    row.classList.toggle('is-selected', row.dataset.entryId === id);
  });
}

function renderReader(entry) {
  const category = categoryFor(entry.category);
  const tags = entry.tags?.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('') || '';
  const fileMeta = entry.file
    ? `<span><i data-lucide="paperclip"></i>${escapeHtml(entry.file.name)} · ${escapeHtml(formatFileSize(entry.file.size))}</span>`
    : '';

  elements.readerEmpty.hidden = true;
  elements.readerContent.hidden = false;
  elements.readerContent.innerHTML = `
    <header class="reader-header" style="--category-color:${category.color}">
      <div class="reader-toolbar">
        <button class="icon-button reader-back" type="button" data-reader-back aria-label="返回列表" title="返回列表">
          <i data-lucide="arrow-left"></i>
        </button>
        <div class="reader-actions">
          ${isReadOnly ? '' : `<button class="icon-button${entry.favorite ? ' is-favorite' : ''}" type="button" data-reader-favorite
            aria-label="${entry.favorite ? '取消收藏' : '收藏'}" title="${entry.favorite ? '取消收藏' : '收藏'}">
            <i data-lucide="star"></i>
          </button>`}
          <button class="icon-button" type="button" data-reader-copy aria-label="复制正文" title="复制正文">
            <i data-lucide="copy"></i>
          </button>
          ${isReadOnly ? '' : `<button class="icon-button" type="button" data-reader-edit aria-label="编辑记录" title="编辑记录">
            <i data-lucide="square-pen"></i>
          </button>
          <button class="icon-button" type="button" data-reader-delete aria-label="删除记录" title="删除记录">
            <i data-lucide="trash-2"></i>
          </button>`}
        </div>
      </div>
      <div class="reader-category-line"><span></span>${escapeHtml(category.label)}</div>
      <h1 class="reader-title">${escapeHtml(entry.title)}</h1>
      <div class="reader-meta">
        <span><i data-lucide="calendar-days"></i>${escapeHtml(formatFullDate(entry.createdAt))}</span>
        ${fileMeta}
        ${tags ? `<div class="tag-list">${tags}</div>` : ''}
      </div>
    </header>
    <div class="markdown-body" style="--category-color:${category.color}">${entry.contentHtml}</div>`;

  elements.readerContent.querySelector('[data-reader-back]').addEventListener('click', () => {
    document.body.classList.remove('view-reader');
  });
  elements.readerContent.querySelector('[data-reader-copy]').addEventListener('click', () => copyText(entry.content));
  elements.readerContent.querySelector('[data-reader-edit]')?.addEventListener('click', () => openEntryDialog(entry));
  elements.readerContent.querySelector('[data-reader-delete]')?.addEventListener('click', () => elements.confirmDialog.showModal());
  elements.readerContent.querySelector('[data-reader-favorite]')?.addEventListener('click', () => toggleFavorite(entry));
  enhanceReaderImages();
  refreshIcons(elements.readerContent);
}

function enhanceReaderImages() {
  const images = [...elements.readerContent.querySelectorAll('.markdown-body img')];
  const gallery = images.map((image, index) => ({
    src: image.currentSrc || image.src,
    alt: image.alt?.trim() || `图片 ${index + 1}`
  }));

  images.forEach((image, index) => {
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `打开图片：${gallery[index].alt}`);
    image.title = '打开原图';

    const shell = document.createElement('span');
    shell.className = 'image-shell';
    image.before(shell);
    shell.append(image);

    const marker = document.createElement('span');
    marker.className = 'image-open-mark';
    marker.setAttribute('aria-hidden', 'true');
    marker.innerHTML = '<i data-lucide="scan-search"></i>';
    shell.append(marker);

    const open = () => openImageViewer(gallery, index);
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function openImageViewer(images, index) {
  viewerState.images = images;
  viewerState.index = index;
  if (!elements.imageViewer.open) elements.imageViewer.showModal();
  showViewerImage();
}

function showViewerImage() {
  const item = viewerState.images[viewerState.index];
  if (!item) return;

  elements.imageViewerTitle.textContent = item.alt;
  elements.imageViewerCount.textContent = `${viewerState.index + 1} / ${viewerState.images.length}`;
  elements.imagePrevious.disabled = viewerState.images.length < 2;
  elements.imageNext.disabled = viewerState.images.length < 2;
  elements.imageDownload.href = item.src;
  const extension = item.src.split('.').pop()?.split(/[?#]/)[0] || 'png';
  const filename = item.alt.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'image';
  elements.imageDownload.download = `${filename}.${extension}`;
  elements.imageViewerImage.alt = item.alt;
  elements.imageViewerImage.src = item.src;
  viewerState.x = 0;
  viewerState.y = 0;

  if (elements.imageViewerImage.complete && elements.imageViewerImage.naturalWidth) {
    requestAnimationFrame(fitViewerImage);
  }
}

function fitViewerImage() {
  const image = elements.imageViewerImage;
  const stage = elements.imageViewerStage;
  if (!image.naturalWidth || !stage.clientWidth || !stage.clientHeight) return;
  const padding = window.innerWidth <= 560 ? 24 : 88;
  viewerState.fitScale = Math.min(
    (stage.clientWidth - padding) / image.naturalWidth,
    (stage.clientHeight - padding) / image.naturalHeight,
    1
  );
  viewerState.scale = Math.max(viewerState.fitScale, 0.02);
  viewerState.x = 0;
  viewerState.y = 0;
  applyViewerTransform();
}

function applyViewerTransform() {
  elements.imageViewerImage.style.transform = `translate(calc(-50% + ${viewerState.x}px), calc(-50% + ${viewerState.y}px)) scale(${viewerState.scale})`;
  elements.imageZoomValue.value = `${Math.round(viewerState.scale * 100)}%`;
  elements.imageZoomValue.textContent = `${Math.round(viewerState.scale * 100)}%`;
}

function zoomViewer(factor, clientX, clientY) {
  const stage = elements.imageViewerStage;
  const rect = stage.getBoundingClientRect();
  const anchorX = clientX ?? rect.left + rect.width / 2;
  const anchorY = clientY ?? rect.top + rect.height / 2;
  const offsetX = anchorX - (rect.left + rect.width / 2);
  const offsetY = anchorY - (rect.top + rect.height / 2);
  const minimum = Math.max(viewerState.fitScale * 0.5, 0.02);
  const nextScale = Math.min(8, Math.max(minimum, viewerState.scale * factor));
  const ratio = nextScale / viewerState.scale;
  viewerState.x = offsetX - (offsetX - viewerState.x) * ratio;
  viewerState.y = offsetY - (offsetY - viewerState.y) * ratio;
  viewerState.scale = nextScale;
  applyViewerTransform();
}

function moveViewerImage(direction) {
  if (viewerState.images.length < 2) return;
  viewerState.index = (viewerState.index + direction + viewerState.images.length) % viewerState.images.length;
  showViewerImage();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('正文已复制');
  } catch {
    showToast('浏览器未允许访问剪贴板', 'error');
  }
}

async function toggleFavorite(entry) {
  try {
    const updated = await api(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ favorite: !entry.favorite })
    });
    state.selectedEntry = updated;
    renderReader(updated);
    await loadLibrary({ preferredId: updated.id, skipDetail: true });
    showToast(updated.favorite ? '已收藏' : '已取消收藏');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function openEntry(id) {
  state.selectedId = id;
  setSelectedRow(id);
  document.body.classList.add('view-reader');
  elements.readerEmpty.hidden = false;
  elements.readerContent.hidden = true;
  elements.readerEmpty.innerHTML = '<div class="list-loading">正在打开记录…</div>';
  try {
    const entry = await api(`/api/entries/${id}`);
    if (state.selectedId !== id) return;
    state.selectedEntry = entry;
    renderReader(entry);
  } catch (error) {
    elements.readerEmpty.innerHTML = `<div class="list-error"><div><h2>无法打开记录</h2><p>${escapeHtml(error.message)}</p></div></div>`;
    showToast(error.message, 'error');
  }
}

async function loadLibrary({ preferredId = state.selectedId, skipDetail = false } = {}) {
  const token = ++state.requestToken;
  elements.entryList.innerHTML = '<div class="list-loading">正在整理索引…</div>';
  const params = new URLSearchParams({ category: state.category, sort: state.sort });
  if (state.query) params.set('query', state.query);

  try {
    const [entries, stats] = await Promise.all([
      api(`/api/entries?${params}`),
      api('/api/stats')
    ]);
    if (token !== state.requestToken) return;
    state.entries = entries;
    updateStats(stats);

    const nextId = entries.some((entry) => entry.id === preferredId)
      ? preferredId
      : entries[0]?.id || null;
    state.selectedId = nextId;
    renderList();

    if (!nextId) {
      state.selectedEntry = null;
      elements.readerEmpty.hidden = false;
      elements.readerEmpty.innerHTML = '<div class="empty-index" aria-hidden="true">⌁</div><h2>选择一条记录</h2><p>正文将在这里打开。</p>';
      elements.readerContent.hidden = true;
      document.body.classList.remove('view-reader');
    } else if (!skipDetail && (!state.selectedEntry || state.selectedEntry.id !== nextId)) {
      await openEntry(nextId);
      if (window.innerWidth <= 820) document.body.classList.remove('view-reader');
    }
  } catch (error) {
    if (token !== state.requestToken) return;
    elements.entryList.innerHTML = `<div class="list-error"><div><i data-lucide="wifi-off"></i><h2>无法读取档案</h2><p>${escapeHtml(error.message)}</p><button class="secondary-action" type="button" data-retry>重新加载</button></div></div>`;
    elements.entryList.querySelector('[data-retry]')?.addEventListener('click', () => loadLibrary());
    refreshIcons(elements.entryList);
  }
}

function updateStats(stats) {
  document.querySelector('[data-count="all"]').textContent = stats.total;
  document.querySelector('[data-count="favorite"]').textContent = stats.favorites;
  const categories = Object.entries(stats.categories);
  elements.categoryNav.innerHTML = categories.length ? `
    <p class="nav-label nav-label-spaced">分类</p>
    ${categories.map(([category, count]) => {
      const visual = categoryFor(category);
      return `<button class="category-button${state.category === category ? ' is-active' : ''}" type="button" data-category="${escapeHtml(category)}">
        <span class="category-dot" style="background:${visual.color}"></span>
        <span>${escapeHtml(category)}</span>
        <b>${count}</b>
      </button>`;
    }).join('')}` : '';
  elements.categoryOptions.innerHTML = categories
    .map(([category]) => `<option value="${escapeHtml(category)}"></option>`)
    .join('');
  bindCategoryButtons(elements.categoryNav);
  elements.storageSummary.textContent = `${stats.total} 条记录 · ${isReadOnly ? '已同步' : '已连接'}`;
}

function openEntryDialog(entry = null) {
  elements.entryForm.reset();
  elements.entryId.value = entry?.id || '';
  elements.entryTitle.value = entry?.title || '';
  elements.entryCategory.value = entry?.category || '';
  elements.entryTags.value = entry?.tags?.join(', ') || '';
  elements.entryBody.value = entry?.content || '';
  elements.entryDialogTitle.textContent = entry ? '编辑记录' : '收录回答';
  elements.entryDialog.showModal();
  requestAnimationFrame(() => elements.entryTitle.focus());
}

async function saveEntry(event) {
  event.preventDefault();
  const id = elements.entryId.value;
  const payload = {
    title: elements.entryTitle.value,
    category: elements.entryCategory.value,
    tags: elements.entryTags.value.split(','),
    content: elements.entryBody.value
  };

  elements.saveEntry.disabled = true;
  try {
    const entry = await api(id ? `/api/entries/${id}` : '/api/entries', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    elements.entryDialog.close();
    state.selectedEntry = entry;
    state.selectedId = entry.id;
    await loadLibrary({ preferredId: entry.id, skipDetail: true });
    renderReader(entry);
    document.body.classList.add('view-reader');
    showToast(id ? '记录已更新' : '回答已收录');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.saveEntry.disabled = false;
  }
}

function openImportDialog() {
  state.importFiles = [];
  elements.importForm.reset();
  renderFileQueue();
  elements.importDialog.showModal();
}

function setImportFiles(files) {
  const allowed = ['txt', 'md', 'markdown', 'html', 'htm', 'json'];
  state.importFiles = [...files].filter((file) => allowed.includes(file.name.split('.').pop()?.toLowerCase()));
  renderFileQueue();
}

function renderFileQueue() {
  elements.startImport.disabled = state.importFiles.length === 0;
  elements.fileQueue.hidden = state.importFiles.length === 0;
  elements.dropTitle.textContent = state.importFiles.length ? `已选择 ${state.importFiles.length} 个文件` : '选择或拖入文件';
  elements.fileQueue.innerHTML = state.importFiles.map((file) => `
    <div class="queued-file">
      <i data-lucide="file-text"></i>
      <span>${escapeHtml(file.name)}</span>
      <b>${escapeHtml(formatFileSize(file.size))}</b>
    </div>`).join('');
  refreshIcons(elements.fileQueue);
}

async function importFiles(event) {
  event.preventDefault();
  if (!state.importFiles.length) return;

  const formData = new FormData();
  state.importFiles.forEach((file) => formData.append('files', file));
  formData.append('category', elements.importCategory.value);
  formData.append('tags', elements.importTags.value);
  elements.startImport.disabled = true;

  try {
    const created = await api('/api/import', { method: 'POST', body: formData });
    elements.importDialog.close();
    const newest = created.at(-1);
    state.selectedId = newest?.id || null;
    state.selectedEntry = newest || null;
    await loadLibrary({ preferredId: newest?.id, skipDetail: true });
    if (newest) renderReader(newest);
    showToast(`已导入 ${created.length} 条记录`);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.startImport.disabled = state.importFiles.length === 0;
  }
}

async function deleteSelected() {
  const id = state.selectedId;
  if (!id) return;
  elements.confirmDelete.disabled = true;
  try {
    await api(`/api/entries/${id}`, { method: 'DELETE' });
    elements.confirmDialog.close();
    state.selectedId = null;
    state.selectedEntry = null;
    await loadLibrary();
    showToast('记录已删除');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.confirmDelete.disabled = false;
  }
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

function bindCategoryButtons(root = document) {
  root.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('is-active', item === button));
      elements.activeCategoryLabel.textContent = categoryFor(state.category).label;
      closeSidebar();
      loadLibrary({ preferredId: null });
    });
  });
}

bindCategoryButtons();

elements.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = elements.search.value.trim();
    loadLibrary({ preferredId: null });
  }, 220);
});

elements.sort.addEventListener('change', () => {
  state.sort = elements.sort.value;
  loadLibrary();
});

document.querySelector('#new-entry').addEventListener('click', () => openEntryDialog());
document.querySelector('#new-entry-sidebar').addEventListener('click', () => {
  closeSidebar();
  openEntryDialog();
});
document.querySelector('#import-entry').addEventListener('click', openImportDialog);
elements.entryForm.addEventListener('submit', saveEntry);
elements.importForm.addEventListener('submit', importFiles);
elements.confirmDelete.addEventListener('click', (event) => {
  event.preventDefault();
  deleteSelected();
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

elements.dropZone.addEventListener('click', () => elements.fileInput.click());
elements.fileInput.addEventListener('change', () => setImportFiles(elements.fileInput.files));
elements.dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  elements.dropZone.classList.add('is-dragging');
});
elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('is-dragging'));
elements.dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  elements.dropZone.classList.remove('is-dragging');
  setImportFiles(event.dataTransfer.files);
});

elements.imageViewerImage.addEventListener('load', fitViewerImage);
elements.imageViewerImage.addEventListener('error', () => showToast('原图加载失败', 'error'));
document.querySelector('#image-viewer-close').addEventListener('click', () => elements.imageViewer.close());
document.querySelector('#image-zoom-in').addEventListener('click', () => zoomViewer(1.25));
document.querySelector('#image-zoom-out').addEventListener('click', () => zoomViewer(0.8));
document.querySelector('#image-fit').addEventListener('click', fitViewerImage);
elements.imagePrevious.addEventListener('click', () => moveViewerImage(-1));
elements.imageNext.addEventListener('click', () => moveViewerImage(1));

elements.imageViewerStage.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomViewer(event.deltaY < 0 ? 1.18 : 1 / 1.18, event.clientX, event.clientY);
}, { passive: false });

elements.imageViewerStage.addEventListener('dblclick', (event) => {
  if (event.target.closest('button, a')) return;
  if (Math.abs(viewerState.scale - viewerState.fitScale) < 0.01) {
    const targetScale = Math.max(1, viewerState.fitScale * 2);
    zoomViewer(targetScale / viewerState.scale, event.clientX, event.clientY);
  } else {
    fitViewerImage();
  }
});

elements.imageViewerStage.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, a')) return;
  viewerState.pointerId = event.pointerId;
  viewerState.pointerStartX = event.clientX;
  viewerState.pointerStartY = event.clientY;
  viewerState.panStartX = viewerState.x;
  viewerState.panStartY = viewerState.y;
  elements.imageViewerStage.setPointerCapture(event.pointerId);
  elements.imageViewerStage.classList.add('is-dragging');
});

elements.imageViewerStage.addEventListener('pointermove', (event) => {
  if (event.pointerId !== viewerState.pointerId) return;
  viewerState.x = viewerState.panStartX + event.clientX - viewerState.pointerStartX;
  viewerState.y = viewerState.panStartY + event.clientY - viewerState.pointerStartY;
  applyViewerTransform();
});

function finishViewerDrag(event) {
  if (event.pointerId !== viewerState.pointerId) return;
  viewerState.pointerId = null;
  elements.imageViewerStage.classList.remove('is-dragging');
}

elements.imageViewerStage.addEventListener('pointerup', finishViewerDrag);
elements.imageViewerStage.addEventListener('pointercancel', finishViewerDrag);
elements.imageViewer.addEventListener('close', () => {
  viewerState.images = [];
  viewerState.pointerId = null;
  elements.imageViewerImage.removeAttribute('src');
  elements.imageViewerImage.style.transform = '';
});

elements.libraryToggle.addEventListener('click', () => toggleLibraryPanel());
elements.panelResizer.addEventListener('pointerdown', (event) => {
  if (window.innerWidth <= 820 || layoutState.collapsed) return;
  event.preventDefault();
  elements.panelResizer.focus({ preventScroll: true });
  layoutState.dragging = true;
  layoutState.pointerId = event.pointerId;
  layoutState.pointerStartX = event.clientX;
  layoutState.widthStart = getAppliedLibraryWidth();
  elements.panelResizer.setPointerCapture(event.pointerId);
  elements.contentGrid.classList.add('is-resizing');
});

elements.panelResizer.addEventListener('pointermove', (event) => {
  if (!layoutState.dragging || event.pointerId !== layoutState.pointerId) return;
  adjustLibraryWidth(layoutState.widthStart + event.clientX - layoutState.pointerStartX);
});

function finishLibraryResize(event) {
  if (!layoutState.dragging || event.pointerId !== layoutState.pointerId) return;
  layoutState.dragging = false;
  layoutState.pointerId = null;
  elements.contentGrid.classList.remove('is-resizing');
  persistLibraryLayout();
}

elements.panelResizer.addEventListener('pointerup', finishLibraryResize);
elements.panelResizer.addEventListener('pointercancel', finishLibraryResize);
elements.panelResizer.addEventListener('dblclick', () => adjustLibraryWidth(410, true));
elements.panelResizer.addEventListener('keydown', (event) => {
  const { minimum, maximum } = getLibraryBounds();
  const current = getAppliedLibraryWidth();
  let next = null;
  if (event.key === 'ArrowLeft') next = current - 24;
  if (event.key === 'ArrowRight') next = current + 24;
  if (event.key === 'Home') next = minimum;
  if (event.key === 'End') next = maximum;
  if (event.key === 'Enter') {
    event.preventDefault();
    toggleLibraryPanel();
    return;
  }
  if (next != null) {
    event.preventDefault();
    adjustLibraryWidth(next, true);
  }
});

window.addEventListener('resize', () => {
  if (elements.imageViewer.open) fitViewerImage();
  syncLibraryLayout();
});

document.querySelector('#mobile-menu').addEventListener('click', () => document.body.classList.add('sidebar-open'));
document.querySelector('#sidebar-close').addEventListener('click', closeSidebar);
document.querySelector('#sidebar-backdrop').addEventListener('click', closeSidebar);

document.addEventListener('keydown', (event) => {
  if (elements.imageViewer.open) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveViewerImage(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveViewerImage(1);
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomViewer(1.25);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomViewer(0.8);
    } else if (event.key === '0') {
      event.preventDefault();
      fitViewerImage();
    }
    return;
  }
  const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (event.key === '/' && !isTyping) {
    event.preventDefault();
    elements.search.focus();
  }
});

configureRuntime();
syncLibraryLayout();
refreshIcons();
loadLibrary();
