const runtimeConfig = window.ECHO_ARCHIVE_CONFIG || { mode: 'server' };
const isReadOnly = runtimeConfig.mode === 'static';
const categoryColors = ['#5667c9', '#42a998', '#e96f92', '#f0a64a', '#7d67b8', '#3f8eb5', '#d65f72'];

function readExpandedCollections() {
  try {
    const value = JSON.parse(localStorage.getItem('echo-expanded-collections') || '[]');
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

const state = {
  entries: [],
  collections: [],
  selectedId: null,
  selectedEntry: null,
  category: 'all',
  categoryId: null,
  groupId: null,
  expandedCollections: readExpandedCollections(),
  deleteTarget: null,
  query: '',
  sort: 'newest',
  importFiles: [],
  requestToken: 0
};

const editorState = {
  existingAssets: [],
  pendingImages: []
};

const moveState = {
  selectedValue: '',
  createMode: 'group',
  previousPlacement: null
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
  scopeDescription: document.querySelector('#scope-description'),
  scopeActions: document.querySelector('#scope-actions'),
  scopeNewEntry: document.querySelector('#scope-new-entry'),
  editScope: document.querySelector('#edit-scope'),
  newGroup: document.querySelector('#new-group'),
  search: document.querySelector('#search-input'),
  sort: document.querySelector('#sort-select'),
  entryDialog: document.querySelector('#entry-dialog'),
  entryForm: document.querySelector('#entry-form'),
  entryDialogTitle: document.querySelector('#entry-dialog-title'),
  entryId: document.querySelector('#entry-id'),
  entryTitle: document.querySelector('#entry-title'),
  entryLocation: document.querySelector('#entry-location'),
  entryCategory: document.querySelector('#entry-category'),
  entryGroup: document.querySelector('#entry-group'),
  entryTags: document.querySelector('#entry-tags'),
  entryBody: document.querySelector('#entry-body'),
  entryImageInput: document.querySelector('#entry-image-input'),
  addEntryImages: document.querySelector('#add-entry-images'),
  editorImageList: document.querySelector('#editor-image-list'),
  saveEntry: document.querySelector('#save-entry'),
  importDialog: document.querySelector('#import-dialog'),
  importForm: document.querySelector('#import-form'),
  fileInput: document.querySelector('#file-input'),
  fileQueue: document.querySelector('#file-queue'),
  dropZone: document.querySelector('#drop-zone'),
  dropTitle: document.querySelector('#drop-title'),
  importCategory: document.querySelector('#import-category'),
  importGroup: document.querySelector('#import-group'),
  importLocation: document.querySelector('#import-location'),
  importTags: document.querySelector('#import-tags'),
  startImport: document.querySelector('#start-import'),
  confirmDialog: document.querySelector('#confirm-dialog'),
  confirmTitle: document.querySelector('#confirm-title'),
  confirmDescription: document.querySelector('#confirm-description'),
  confirmDelete: document.querySelector('#confirm-delete'),
  collectionDialog: document.querySelector('#collection-dialog'),
  collectionForm: document.querySelector('#collection-form'),
  collectionDialogTitle: document.querySelector('#collection-dialog-title'),
  collectionId: document.querySelector('#collection-id'),
  collectionName: document.querySelector('#collection-name'),
  collectionDescription: document.querySelector('#collection-description'),
  deleteCollection: document.querySelector('#delete-collection'),
  groupDialog: document.querySelector('#group-dialog'),
  groupForm: document.querySelector('#group-form'),
  groupDialogTitle: document.querySelector('#group-dialog-title'),
  groupParentLabel: document.querySelector('#group-parent-label'),
  groupCollectionId: document.querySelector('#group-collection-id'),
  groupId: document.querySelector('#group-id'),
  groupName: document.querySelector('#group-name'),
  groupDescription: document.querySelector('#group-description'),
  deleteGroup: document.querySelector('#delete-group'),
  moveDialog: document.querySelector('#move-dialog'),
  moveForm: document.querySelector('#move-form'),
  moveEntryId: document.querySelector('#move-entry-id'),
  moveEntryTitle: document.querySelector('#move-entry-title'),
  moveCurrentLocation: document.querySelector('#move-current-location'),
  moveSearch: document.querySelector('#move-search-input'),
  moveLocationList: document.querySelector('#move-location-list'),
  confirmMove: document.querySelector('#confirm-move'),
  quickCreateParentField: document.querySelector('#quick-create-parent-field'),
  quickCreateParent: document.querySelector('#quick-create-parent'),
  quickCreateNameLabel: document.querySelector('#quick-create-name-label'),
  quickCreateName: document.querySelector('#quick-create-name'),
  quickCreateSubmit: document.querySelector('#quick-create-submit'),
  publishSite: document.querySelector('#publish-site'),
  publishDialog: document.querySelector('#publish-dialog'),
  publishForm: document.querySelector('#publish-form'),
  publishSummary: document.querySelector('#publish-summary'),
  confirmPublish: document.querySelector('#confirm-publish'),
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
  toastMessage: document.querySelector('#toast-message'),
  toastAction: document.querySelector('#toast-action'),
  storageLabel: document.querySelector('#storage-label'),
  storageSummary: document.querySelector('#storage-summary')
};

let toastTimer;
let searchTimer;
let staticEntriesPromise;
let staticCollectionsPromise;
let mermaidSequence = 0;

window.mermaid?.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  suppressErrorRendering: true,
  theme: 'base',
  flowchart: {
    htmlLabels: true,
    useMaxWidth: false,
    curve: 'linear',
    nodeSpacing: 34,
    rankSpacing: 50
  },
  themeVariables: {
    background: '#151718',
    primaryColor: '#fff3f7',
    primaryTextColor: '#242634',
    primaryBorderColor: '#e96f92',
    secondaryColor: '#eef0ff',
    tertiaryColor: '#effaf7',
    lineColor: '#5667c9',
    fontFamily: 'Segoe UI Variable Text, Microsoft YaHei UI, sans-serif',
    fontSize: '15px'
  }
});

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

function showToast(message, type = 'success', action = null) {
  clearTimeout(toastTimer);
  elements.toastMessage.textContent = message;
  elements.toast.classList.toggle('is-error', type === 'error');
  elements.toastAction.hidden = !action;
  elements.toastAction.textContent = action?.label || '';
  elements.toastAction.onclick = action?.onClick || null;
  elements.toast.classList.add('is-visible');
  toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), action ? 6200 : 3000);
}

function configureRuntime() {
  document.body.classList.toggle('is-read-only', isReadOnly);
  if (!isReadOnly) return;

  elements.storageLabel.textContent = '云端镜像';
  document.querySelector('#blog-link').href = '../';
  document.querySelector('#blog-link').target = '_self';
  document.querySelectorAll('#new-entry, #new-entry-sidebar, #scope-new-entry, #import-entry, #publish-site, #new-collection-inline, #new-group, #edit-scope').forEach((button) => {
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
  const label = isCollapsed ? '显示笔记列表' : '隐藏笔记列表';
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
      if (!response.ok) throw new Error(`云端笔记读取失败 (${response.status})`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    });
  }
  return staticEntriesPromise;
}

async function getStaticCollections() {
  if (!staticCollectionsPromise) {
    staticCollectionsPromise = (async () => {
      let savedCollections = [];
      if (runtimeConfig.collectionsUrl) {
        const url = new URL(runtimeConfig.collectionsUrl, window.location.href);
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) savedCollections = data;
        }
      }

      const entries = await getStaticEntries();
      const byName = new Map(savedCollections.map((collection) => [collection.name, collection]));
      for (const entry of entries) {
        if (!byName.has(entry.category)) {
          byName.set(entry.category, {
            id: entry.categoryId || `static-${byName.size + 1}`,
            name: entry.category,
            description: '',
            color: categoryColors[byName.size % categoryColors.length],
            groups: []
          });
        }
      }
      return [...byName.values()];
    })();
  }
  return staticCollectionsPromise;
}

async function staticApi(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  if (method !== 'GET') throw new Error('公网镜像仅支持浏览');
  const requestUrl = new URL(path, 'https://echo-archive.local');
  const entries = await getStaticEntries();

  if (requestUrl.pathname === '/api/health') return { ok: true, storage: 'cloud-mirror' };
  if (requestUrl.pathname === '/api/collections') {
    const collections = await getStaticCollections();
    return collections.map((collection) => ({
      ...collection,
      count: entries.filter((entry) => entry.categoryId === collection.id || (!entry.categoryId && entry.category === collection.name)).length,
      groups: (collection.groups || []).map((group) => ({
        ...group,
        count: entries.filter((entry) => entry.groupId === group.id).length
      }))
    }));
  }
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
    if (!entry) throw new Error('没有找到这篇笔记');
    return entry;
  }

  if (requestUrl.pathname === '/api/entries') {
    const query = requestUrl.searchParams.get('query')?.trim().toLocaleLowerCase('zh-CN') || '';
    const category = requestUrl.searchParams.get('category') || 'all';
    const categoryId = requestUrl.searchParams.get('categoryId') || '';
    const groupId = requestUrl.searchParams.get('groupId') || '';
    const sort = requestUrl.searchParams.get('sort') || 'newest';
    const selectedCollection = categoryId
      ? (await getStaticCollections()).find((collection) => collection.id === categoryId)
      : null;
    const filtered = entries.filter((entry) => {
      if (category === 'favorite' && !entry.favorite) return false;
      if (categoryId && entry.categoryId !== categoryId && entry.category !== selectedCollection?.name) return false;
      if (groupId && entry.groupId !== groupId) return false;
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

function collectionForEntry(entry) {
  return state.collections.find((collection) => collection.id === entry?.categoryId)
    || state.collections.find((collection) => collection.name === entry?.category)
    || null;
}

function currentCollection() {
  return state.collections.find((collection) => collection.id === state.categoryId) || null;
}

function currentGroup() {
  return currentCollection()?.groups.find((group) => group.id === state.groupId) || null;
}

function categoryFor(value, categoryId = null) {
  if (value === 'all') return { label: '全部笔记', color: '#68747e' };
  if (value === 'favorite') return { label: '已收藏', color: '#c08317' };
  const collection = state.collections.find((item) => item.id === categoryId)
    || state.collections.find((item) => item.name === value);
  if (collection) return { label: collection.name, color: collection.color };
  const hash = [...String(value)].reduce((total, character) => ((total * 31) + character.codePointAt(0)) >>> 0, 0);
  return { label: value || '默认笔记本组', color: categoryColors[hash % categoryColors.length] };
}

function renderList() {
  elements.resultCount.textContent = `${state.entries.length} 篇`;

  if (!state.entries.length) {
    const isSearching = Boolean(state.query || state.category !== 'all' || state.categoryId || state.groupId);
    elements.entryList.innerHTML = `
      <div class="list-empty">
        <div>
          <i data-lucide="${isSearching ? 'search-x' : 'archive'}"></i>
          <h2>${isSearching ? '没有找到笔记' : '还没有笔记'}</h2>
          <p>${isSearching ? '换个关键词，或者在当前笔记本中新建一篇。' : isReadOnly ? '云端镜像暂时没有笔记。' : '新建第一篇笔记。'}</p>
          ${isReadOnly ? '' : '<button class="primary-action" type="button" data-empty-create><i data-lucide="plus"></i><span>新建笔记</span></button>'}
        </div>
      </div>`;
    elements.entryList.querySelector('[data-empty-create]')?.addEventListener('click', () => openEntryDialog());
    refreshIcons(elements.entryList);
    return;
  }

  elements.entryList.innerHTML = state.entries.map((entry, index) => {
    const category = categoryFor(entry.category, entry.categoryId);
    const collection = collectionForEntry(entry);
    const group = collection?.groups.find((item) => item.id === entry.groupId);
    const tags = entry.tags?.length ? entry.tags.join(' · ') : '未加标签';
    return `
      <button class="entry-row${entry.id === state.selectedId ? ' is-selected' : ''}" type="button"
        data-entry-id="${escapeHtml(entry.id)}" style="--category-color:${category.color}; animation-delay:${Math.min(index * 24, 144)}ms">
        <span class="entry-row-top">
          <span class="entry-date">${escapeHtml(formatListDate(entry.updatedAt || entry.createdAt))}</span>
          <span class="entry-category">${escapeHtml(group ? group.name : category.label)}</span>
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
  const category = categoryFor(entry.category, entry.categoryId);
  const collection = collectionForEntry(entry);
  const group = collection?.groups.find((item) => item.id === entry.groupId);
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
          ${isReadOnly ? '' : `<button class="icon-button" type="button" data-reader-move aria-label="移动笔记" title="移动笔记">
            <i data-lucide="folder-input"></i>
          </button>`}
          <button class="icon-button" type="button" data-reader-copy aria-label="复制正文" title="复制正文">
            <i data-lucide="copy"></i>
          </button>
          ${isReadOnly ? '' : `<button class="icon-button" type="button" data-reader-edit aria-label="编辑笔记" title="编辑笔记">
            <i data-lucide="square-pen"></i>
          </button>
          <button class="icon-button" type="button" data-reader-delete aria-label="删除笔记" title="删除笔记">
            <i data-lucide="trash-2"></i>
          </button>`}
        </div>
      </div>
      <div class="reader-category-line"><span></span>${escapeHtml(group ? `${category.label} / ${group.name}` : category.label)}</div>
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
  elements.readerContent.querySelector('[data-reader-move]')?.addEventListener('click', () => openMoveDialog(entry));
  elements.readerContent.querySelector('[data-reader-edit]')?.addEventListener('click', () => openEntryDialog(entry));
  elements.readerContent.querySelector('[data-reader-delete]')?.addEventListener('click', () => openDeleteConfirm({
    type: 'entry',
    id: entry.id,
    title: '删除这篇笔记？',
    description: '笔记内容与关联图片会一起删除，且无法恢复。',
    buttonLabel: '删除笔记'
  }));
  elements.readerContent.querySelector('[data-reader-favorite]')?.addEventListener('click', () => toggleFavorite(entry));
  renderMermaidDiagrams(elements.readerContent);
  enhanceReaderImages();
  refreshIcons(elements.readerContent);
}

async function renderMermaidDiagrams(root) {
  if (!window.mermaid) return;
  const blocks = [...root.querySelectorAll('pre > code.language-mermaid')];

  for (const code of blocks) {
    const pre = code.parentElement;
    const source = code.textContent.trim();
    if (!source) continue;

    try {
      const id = `echo-mermaid-${Date.now()}-${mermaidSequence += 1}`;
      const { svg, bindFunctions } = await window.mermaid.render(id, source);
      const shell = document.createElement('figure');
      shell.className = 'mermaid-shell';
      shell.setAttribute('aria-label', '流程图');

      const viewport = document.createElement('div');
      viewport.className = 'mermaid-viewport';
      viewport.innerHTML = svg;
      shell.append(viewport);

      const copyButton = document.createElement('button');
      copyButton.className = 'diagram-copy';
      copyButton.type = 'button';
      copyButton.setAttribute('aria-label', '复制流程图源码');
      copyButton.title = '复制流程图源码';
      copyButton.innerHTML = '<i data-lucide="copy"></i>';
      copyButton.addEventListener('click', () => copyText(source, '流程图源码已复制'));
      shell.append(copyButton);

      pre.replaceWith(shell);
      bindFunctions?.(viewport);
      refreshIcons(shell);
    } catch (error) {
      pre.classList.add('mermaid-error');
      pre.title = `流程图渲染失败：${error.message}`;
    }
  }
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

async function copyText(text, successMessage = '正文已复制') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
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
  elements.readerEmpty.innerHTML = '<div class="list-loading">正在打开笔记…</div>';
  try {
    const entry = await api(`/api/entries/${id}`);
    if (state.selectedId !== id) return;
    state.selectedEntry = entry;
    renderReader(entry);
  } catch (error) {
    elements.readerEmpty.innerHTML = `<div class="list-error"><div><h2>无法打开笔记</h2><p>${escapeHtml(error.message)}</p></div></div>`;
    showToast(error.message, 'error');
  }
}

async function loadLibrary({ preferredId = state.selectedId, skipDetail = false } = {}) {
  const token = ++state.requestToken;
  elements.entryList.innerHTML = '<div class="list-loading">正在加载笔记…</div>';
  const params = new URLSearchParams({ category: state.category, sort: state.sort });
  if (state.query) params.set('query', state.query);
  if (state.categoryId) params.set('categoryId', state.categoryId);
  if (state.groupId) params.set('groupId', state.groupId);

  try {
    const [entries, stats, collections] = await Promise.all([
      api(`/api/entries?${params}`),
      api('/api/stats'),
      api('/api/collections')
    ]);
    if (token !== state.requestToken) return;
    state.entries = entries;
    state.collections = collections;
    updateNavigation(stats);

    const nextId = entries.some((entry) => entry.id === preferredId)
      ? preferredId
      : entries[0]?.id || null;
    state.selectedId = nextId;
    renderList();

    if (!nextId) {
      state.selectedEntry = null;
      elements.readerEmpty.hidden = false;
      elements.readerEmpty.innerHTML = '<div class="empty-index" aria-hidden="true">⌁</div><h2>选择一篇笔记</h2><p>笔记内容将在这里打开。</p>';
      elements.readerContent.hidden = true;
      document.body.classList.remove('view-reader');
    } else if (!skipDetail && (!state.selectedEntry || state.selectedEntry.id !== nextId)) {
      await openEntry(nextId);
      if (window.innerWidth <= 820) document.body.classList.remove('view-reader');
    }
  } catch (error) {
    if (token !== state.requestToken) return;
    elements.entryList.innerHTML = `<div class="list-error"><div><i data-lucide="wifi-off"></i><h2>无法读取笔记</h2><p>${escapeHtml(error.message)}</p><button class="secondary-action" type="button" data-retry>重新加载</button></div></div>`;
    elements.entryList.querySelector('[data-retry]')?.addEventListener('click', () => loadLibrary());
    refreshIcons(elements.entryList);
  }
}

function renderCollectionTree() {
  if (!state.collections.length) {
    elements.categoryNav.innerHTML = `
      <div class="tree-empty">
        <i data-lucide="folder-open"></i>
        <span>还没有笔记本组</span>
        ${isReadOnly ? '' : '<button type="button" data-create-collection>新建笔记本组</button>'}
      </div>`;
    refreshIcons(elements.categoryNav);
    return;
  }

  elements.categoryNav.innerHTML = state.collections.map((collection) => {
    const isExpanded = state.expandedCollections.has(collection.id) || state.categoryId === collection.id;
    const isCollectionActive = state.categoryId === collection.id && !state.groupId;
    const groups = collection.groups || [];
    return `
      <div class="collection-node${isExpanded ? ' is-expanded' : ''}" style="--tree-color:${escapeHtml(collection.color)}">
        <div class="collection-row${isCollectionActive ? ' is-active' : ''}">
          ${groups.length
            ? `<button class="tree-expander" type="button" data-expand-collection="${escapeHtml(collection.id)}" aria-label="${isExpanded ? '收起' : '展开'} ${escapeHtml(collection.name)}" aria-expanded="${isExpanded}"><i data-lucide="chevron-right"></i></button>`
            : '<span class="tree-expander-spacer"></span>'}
          <button class="tree-select" type="button" data-collection-id="${escapeHtml(collection.id)}">
            <i data-lucide="layers-3"></i>
            <span>${escapeHtml(collection.name)}</span>
            <b>${collection.count || 0}</b>
          </button>
          ${isReadOnly ? '' : `<button class="tree-icon-button tree-edit" type="button" data-edit-collection="${escapeHtml(collection.id)}" aria-label="编辑 ${escapeHtml(collection.name)}" title="编辑笔记本组"><i data-lucide="ellipsis"></i></button>`}
        </div>
        <div class="group-branch" ${isExpanded ? '' : 'hidden'}>
          ${groups.map((group) => `
            <div class="group-row${state.groupId === group.id ? ' is-active' : ''}">
              <span class="branch-line" aria-hidden="true"></span>
              <button class="tree-select group-select" type="button" data-collection-id="${escapeHtml(collection.id)}" data-group-id="${escapeHtml(group.id)}">
                <i data-lucide="notebook"></i>
                <span>${escapeHtml(group.name)}</span>
                <b>${group.count || 0}</b>
              </button>
              ${isReadOnly ? '' : `<button class="tree-icon-button tree-edit" type="button" data-edit-group="${escapeHtml(group.id)}" data-parent-id="${escapeHtml(collection.id)}" aria-label="编辑 ${escapeHtml(group.name)}" title="编辑笔记本"><i data-lucide="ellipsis"></i></button>`}
            </div>`).join('')}
          ${isReadOnly ? '' : `<button class="add-group-row" type="button" data-add-group="${escapeHtml(collection.id)}"><i data-lucide="plus"></i><span>新建笔记本</span></button>`}
        </div>
      </div>`;
  }).join('');
  refreshIcons(elements.categoryNav);
}

function updateScopeHeader() {
  const collection = currentCollection();
  const group = currentGroup();
  elements.scopeActions.hidden = isReadOnly || !collection;
  elements.newGroup.hidden = Boolean(group);
  elements.libraryPanel.style.setProperty('--scope-color', collection?.color || '#68747e');

  if (group) {
    elements.activeCategoryLabel.textContent = collection.name;
    document.querySelector('#library-heading').textContent = group.name;
    elements.scopeDescription.textContent = group.description || '这个笔记本还没有说明。';
    elements.editScope.setAttribute('aria-label', '编辑当前笔记本');
    elements.editScope.setAttribute('title', '编辑笔记本');
    elements.scopeNewEntry.setAttribute('aria-label', `在${group.name}中新建笔记`);
    elements.scopeNewEntry.setAttribute('title', `在${group.name}中新建笔记`);
    return;
  }
  if (collection) {
    elements.activeCategoryLabel.textContent = `${collection.groups.length} 个笔记本`;
    document.querySelector('#library-heading').textContent = collection.name;
    elements.scopeDescription.textContent = collection.description || '这个笔记本组还没有说明。';
    elements.editScope.setAttribute('aria-label', '编辑当前笔记本组');
    elements.editScope.setAttribute('title', '编辑笔记本组');
    elements.scopeNewEntry.setAttribute('aria-label', `在${collection.name}中新建笔记`);
    elements.scopeNewEntry.setAttribute('title', `在${collection.name}中新建笔记`);
    return;
  }

  const isFavorite = state.category === 'favorite';
  elements.activeCategoryLabel.textContent = '笔记';
  document.querySelector('#library-heading').textContent = isFavorite ? '已收藏' : '全部笔记';
  elements.scopeDescription.textContent = isFavorite ? '收藏的笔记都在这里。' : '所有笔记都在这里。';
}

function updateNavigation(stats) {
  document.querySelector('[data-count="all"]').textContent = stats.total;
  document.querySelector('[data-count="favorite"]').textContent = stats.favorites;
  document.querySelectorAll('[data-category]').forEach((button) => {
    button.classList.toggle('is-active', !state.categoryId && state.category === button.dataset.category);
  });
  renderCollectionTree();
  updateScopeHeader();
  elements.storageSummary.textContent = `${stats.total} 篇笔记 · ${isReadOnly ? '已同步' : '已保存'}`;
}

function clearPendingEditorImages() {
  editorState.pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  editorState.pendingImages = [];
}

function resetEditorImages(entry = null) {
  clearPendingEditorImages();
  editorState.existingAssets = (entry?.assets || []).map((asset) => ({ ...asset }));
  elements.entryImageInput.value = '';
  renderEditorImages();
}

function markdownAlt(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/[\[\]\\]/g, '\\$&').trim() || '图片';
}

function insertIntoEntryBody(text) {
  const textarea = elements.entryBody;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const prefix = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const suffix = after && !after.startsWith('\n') ? '\n\n' : '';
  const insertion = `${prefix}${text}${suffix}`;
  textarea.setRangeText(insertion, start, end, 'end');
  textarea.focus();
}

function addEditorImages(files) {
  const candidates = [...files];
  if (!candidates.length) return;

  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  const remaining = Math.max(0, 12 - editorState.existingAssets.length - editorState.pendingImages.length);
  const accepted = [];

  for (const file of candidates.slice(0, remaining)) {
    if (!acceptedTypes.has(file.type)) {
      showToast(`${file.name} 格式不受支持`, 'error');
      continue;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast(`${file.name} 超过 8 MB`, 'error');
      continue;
    }
    const image = {
      token: crypto.randomUUID(),
      file,
      alt: markdownAlt(file.name),
      previewUrl: URL.createObjectURL(file)
    };
    editorState.pendingImages.push(image);
    accepted.push(image);
  }

  if (candidates.length > remaining) showToast('每篇笔记最多添加 12 张图片', 'error');
  if (accepted.length) {
    insertIntoEntryBody(accepted.map((image) => `![${image.alt}](echo-upload:${image.token})`).join('\n\n'));
    renderEditorImages();
  }
  elements.entryImageInput.value = '';
}

function removeMarkdownImage(content, url) {
  const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const imagePattern = new RegExp(`!\\[[^\\]]*\\]\\(\\s*${escapedUrl}\\s*(?:["'][^"']*["'])?\\)`, 'g');
  return content.replace(imagePattern, '').replace(/\n{3,}/g, '\n\n').trim();
}

function removeEditorImage(kind, key) {
  if (kind === 'pending') {
    const index = editorState.pendingImages.findIndex((image) => image.token === key);
    if (index < 0) return;
    const [image] = editorState.pendingImages.splice(index, 1);
    URL.revokeObjectURL(image.previewUrl);
    elements.entryBody.value = removeMarkdownImage(elements.entryBody.value, `echo-upload:${image.token}`);
  } else {
    const index = editorState.existingAssets.findIndex((asset) => asset.name === key);
    if (index < 0) return;
    const [asset] = editorState.existingAssets.splice(index, 1);
    elements.entryBody.value = removeMarkdownImage(elements.entryBody.value, asset.url);
  }
  renderEditorImages();
}

function renderEditorImages() {
  const items = [
    ...editorState.existingAssets.map((asset) => ({
      kind: 'existing',
      key: asset.name,
      src: asset.url,
      name: asset.alt || asset.name,
      size: asset.size,
      status: '已保存'
    })),
    ...editorState.pendingImages.map((image) => ({
      kind: 'pending',
      key: image.token,
      src: image.previewUrl,
      name: image.file.name,
      size: image.file.size,
      status: '待上传'
    }))
  ];

  elements.editorImageList.hidden = items.length === 0;
  elements.editorImageList.innerHTML = items.map((item) => `
    <div class="editor-image-item" data-image-kind="${item.kind}" data-image-key="${escapeHtml(item.key)}">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}">
      <span class="editor-image-name">${escapeHtml(item.name)}</span>
      <span class="editor-image-meta">${escapeHtml(item.status)} · ${escapeHtml(formatFileSize(item.size || 0))}</span>
      <button class="icon-button editor-image-remove" type="button" aria-label="移除 ${escapeHtml(item.name)}" title="移除图片">
        <i data-lucide="x"></i>
      </button>
    </div>`).join('');
  refreshIcons(elements.editorImageList);
}

function fillPlacementFields(locationSelect, categorySelect, groupSelect, categoryId = '', groupId = '') {
  categorySelect.innerHTML = `
    <option value="">未选择笔记本组</option>
    ${state.collections.map((collection) => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`).join('')}`;
  categorySelect.value = categoryId || '';
  fillGroupSelect(categorySelect, groupSelect, groupId);
  locationSelect.innerHTML = `
    <option value="">未选择笔记本</option>
    ${state.collections.map((collection) => `
      <optgroup label="${escapeHtml(collection.name)}">
        <option value="${escapeHtml(`${collection.id}::`)}">${escapeHtml(collection.name)}（未分组）</option>
        ${(collection.groups || []).map((group) => `<option value="${escapeHtml(`${collection.id}::${group.id}`)}">${escapeHtml(group.name)}</option>`).join('')}
      </optgroup>`).join('')}`;
  const selectedValue = categoryId ? `${categoryId}::${groupId || ''}` : '';
  locationSelect.value = selectedValue;
}

function fillGroupSelect(categorySelect, groupSelect, groupId = '') {
  const collection = state.collections.find((item) => item.id === categorySelect.value);
  const groups = collection?.groups || [];
  groupSelect.innerHTML = `
    <option value="">未选择笔记本</option>
    ${groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join('')}`;
  groupSelect.disabled = groups.length === 0;
  groupSelect.value = groups.some((group) => group.id === groupId) ? groupId : '';
}

function syncPlacementFromLocation(locationSelect, categorySelect, groupSelect) {
  const [categoryId = '', groupId = ''] = locationSelect.value.split('::');
  categorySelect.value = categoryId;
  fillGroupSelect(categorySelect, groupSelect, groupId);
}

function placementDetails(entry) {
  const collection = collectionForEntry(entry);
  const group = collection?.groups.find((item) => item.id === entry?.groupId);
  return {
    categoryId: collection?.id || null,
    groupId: group?.id || null,
    value: collection ? `${collection.id}::${group?.id || ''}` : '',
    label: collection ? (group ? `${collection.name} / ${group.name}` : `${collection.name} / 未分组`) : '未选择笔记本'
  };
}

function renderMoveLocations() {
  const query = elements.moveSearch.value.trim().toLocaleLowerCase('zh-CN');
  const sections = state.collections.map((collection) => {
    const collectionMatches = collection.name.toLocaleLowerCase('zh-CN').includes(query);
    const groups = (collection.groups || []).filter((group) => (
      !query || collectionMatches || group.name.toLocaleLowerCase('zh-CN').includes(query)
    ));
    if (query && !collectionMatches && !groups.length) return '';

    const options = [
      { value: `${collection.id}::`, label: '未分组笔记', description: `直接放在“${collection.name}”下`, icon: 'files' },
      ...groups.map((group) => ({
        value: `${collection.id}::${group.id}`,
        label: group.name,
        description: group.description || `${group.count || 0} 篇笔记`,
        icon: 'notebook'
      }))
    ];

    return `<section class="move-location-group" style="--location-color:${escapeHtml(collection.color || categoryColors[0])}">
      <h3><span></span>${escapeHtml(collection.name)}<b>${collection.count || 0}</b></h3>
      ${options.map((option) => {
        const isSelected = moveState.selectedValue === option.value;
        return `<button class="move-location-option${isSelected ? ' is-selected' : ''}" type="button"
          data-move-value="${escapeHtml(option.value)}" role="radio" aria-checked="${isSelected}">
          <i data-lucide="${option.icon}"></i>
          <span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.description)}</small></span>
          <i class="move-check" data-lucide="${isSelected ? 'circle-check' : 'circle'}"></i>
        </button>`;
      }).join('')}
    </section>`;
  }).filter(Boolean).join('');

  elements.moveLocationList.innerHTML = sections || `
    <div class="move-no-results">
      <i data-lucide="search-x"></i>
      <strong>没有找到“${escapeHtml(elements.moveSearch.value.trim())}”</strong>
      <span>可以在下方直接创建新位置。</span>
    </div>`;
  elements.confirmMove.disabled = !moveState.selectedValue;
  refreshIcons(elements.moveLocationList);
}

function syncQuickCreateMode(mode = moveState.createMode) {
  moveState.createMode = mode;
  document.querySelectorAll('[data-create-mode]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.createMode === mode);
  });
  const createsNotebook = mode === 'notebook';
  elements.quickCreateParentField.hidden = !createsNotebook;
  elements.quickCreateNameLabel.textContent = createsNotebook ? '笔记本名称' : '笔记本组名称';
  elements.quickCreateName.placeholder = createsNotebook ? '例如：第一周学习' : '例如：Unity 学习';
}

function refreshQuickCreateParents(preferredId = '') {
  elements.quickCreateParent.innerHTML = state.collections.map((collection) => (
    `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`
  )).join('');
  const fallback = preferredId || state.categoryId || state.collections[0]?.id || '';
  elements.quickCreateParent.value = state.collections.some((collection) => collection.id === fallback) ? fallback : '';
}

function openMoveDialog(entry) {
  const placement = placementDetails(entry);
  moveState.selectedValue = placement.value;
  moveState.previousPlacement = { categoryId: placement.categoryId, groupId: placement.groupId };
  elements.moveEntryId.value = entry.id;
  elements.moveEntryTitle.textContent = entry.title;
  elements.moveCurrentLocation.textContent = placement.label;
  elements.moveSearch.value = '';
  elements.quickCreateName.value = '';
  refreshQuickCreateParents(placement.categoryId);
  syncQuickCreateMode('group');
  renderMoveLocations();
  elements.moveDialog.showModal();
  requestAnimationFrame(() => elements.moveSearch.focus());
}

async function createMoveLocation() {
  const name = elements.quickCreateName.value.trim();
  if (!name) {
    elements.quickCreateName.focus();
    return showToast('先填写位置名称', 'error');
  }

  elements.quickCreateSubmit.disabled = true;
  try {
    if (moveState.createMode === 'group') {
      const collection = await api('/api/collections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, color: categoryColors[state.collections.length % categoryColors.length] })
      });
      moveState.selectedValue = `${collection.id}::`;
      state.expandedCollections.add(collection.id);
    } else {
      const collectionId = elements.quickCreateParent.value;
      if (!collectionId) throw new Error('请先选择所属笔记本组');
      const group = await api(`/api/collections/${collectionId}/groups`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name })
      });
      moveState.selectedValue = `${collectionId}::${group.id}`;
      state.expandedCollections.add(collectionId);
    }
    state.collections = await api('/api/collections');
    elements.moveSearch.value = '';
    elements.quickCreateName.value = '';
    refreshQuickCreateParents(moveState.selectedValue.split('::')[0]);
    renderMoveLocations();
    showToast('新位置已创建并选中');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.quickCreateSubmit.disabled = false;
  }
}

async function restorePlacement(entryId, placement) {
  const restored = await api(`/api/entries/${entryId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ categoryId: placement.categoryId, groupId: placement.groupId })
  });
  state.category = 'all';
  state.categoryId = restored.categoryId || null;
  state.groupId = restored.groupId || null;
  if (restored.categoryId) state.expandedCollections.add(restored.categoryId);
  await loadLibrary({ preferredId: restored.id, skipDetail: true });
  renderReader(restored);
  document.body.classList.add('view-reader');
  showToast('已撤销移动');
}

async function moveEntry(event) {
  event.preventDefault();
  const entryId = elements.moveEntryId.value;
  const [categoryId = '', groupId = ''] = moveState.selectedValue.split('::');
  const previous = moveState.previousPlacement;
  if (!entryId || !categoryId) return;
  if (categoryId === previous?.categoryId && (groupId || null) === previous?.groupId) {
    elements.moveDialog.close();
    return showToast('笔记已经在这个位置');
  }

  elements.confirmMove.disabled = true;
  try {
    const moved = await api(`/api/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ categoryId, groupId: groupId || null })
    });
    elements.moveDialog.close();
    state.category = 'all';
    state.categoryId = moved.categoryId;
    state.groupId = moved.groupId || null;
    state.expandedCollections.add(moved.categoryId);
    await loadLibrary({ preferredId: moved.id, skipDetail: true });
    renderReader(moved);
    document.body.classList.add('view-reader');
    const destination = placementDetails(moved).label;
    showToast(`已移动到 ${destination}`, 'success', {
      label: '撤销',
      onClick: () => restorePlacement(moved.id, previous).catch((error) => showToast(error.message, 'error'))
    });
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.confirmMove.disabled = !moveState.selectedValue;
  }
}

async function openPublishDialog() {
  try {
    const stats = await api('/api/stats');
    elements.publishSummary.textContent = `${stats.total} 篇笔记和关联图片会生成公开静态页面。`;
  } catch {
    elements.publishSummary.textContent = '当前笔记和图片会生成公开静态页面。';
  }
  elements.publishDialog.showModal();
}

async function publishSite(event) {
  event.preventDefault();
  elements.confirmPublish.disabled = true;
  elements.confirmPublish.querySelector('span').textContent = '正在构建并发布…';
  try {
    const result = await api('/api/publish', { method: 'POST' });
    elements.publishDialog.close();
    showToast(result.published ? '博客已发布，GitHub Pages 正在更新' : '线上内容已经是最新版本');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.confirmPublish.disabled = false;
    elements.confirmPublish.querySelector('span').textContent = '确认发布';
  }
}

function openEntryDialog(entry = null) {
  elements.entryForm.reset();
  elements.entryId.value = entry?.id || '';
  elements.entryTitle.value = entry?.title || '';
  const legacyCollection = state.collections.find((collection) => collection.name === entry?.category);
  const categoryId = entry?.categoryId || legacyCollection?.id || state.categoryId || '';
  const groupId = entry?.groupId || (!entry ? state.groupId : '') || '';
  fillPlacementFields(elements.entryLocation, elements.entryCategory, elements.entryGroup, categoryId, groupId);
  elements.entryTags.value = entry?.tags?.join(', ') || '';
  elements.entryBody.value = entry?.content || '';
  resetEditorImages(entry);
  elements.entryDialogTitle.textContent = entry ? '编辑笔记' : '新建笔记';
  elements.entryDialog.showModal();
  requestAnimationFrame(() => elements.entryTitle.focus());
}

async function saveEntry(event) {
  event.preventDefault();
  const id = elements.entryId.value;
  const sourceContent = elements.entryBody.value;
  const pending = editorState.pendingImages.filter((image) => sourceContent.includes(`echo-upload:${image.token}`));
  let uploadedAssets = [];
  let entrySaved = false;

  elements.saveEntry.disabled = true;
  try {
    let content = sourceContent;
    if (pending.length) {
      const formData = new FormData();
      pending.forEach((image) => formData.append('images', image.file, image.file.name));
      const uploaded = await api('/api/uploads', { method: 'POST', body: formData });
      uploadedAssets = uploaded.assets || [];
      pending.forEach((image, index) => {
        content = content.replaceAll(`echo-upload:${image.token}`, uploadedAssets[index].url);
      });
    }

    const retainedAssets = editorState.existingAssets.filter((asset) => content.includes(asset.url));
    const payload = {
      title: elements.entryTitle.value,
      categoryId: elements.entryCategory.value || null,
      groupId: elements.entryGroup.value || null,
      tags: elements.entryTags.value.split(','),
      content,
      assets: [...retainedAssets, ...uploadedAssets]
    };
    const entry = await api(id ? `/api/entries/${id}` : '/api/entries', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    entrySaved = true;
    elements.entryDialog.close();
    state.selectedEntry = entry;
    state.selectedId = entry.id;
    if (entry.categoryId) {
      state.category = 'all';
      state.categoryId = entry.categoryId;
      state.groupId = entry.groupId || null;
      state.expandedCollections.add(entry.categoryId);
    }
    await loadLibrary({ preferredId: entry.id, skipDetail: true });
    renderReader(entry);
    document.body.classList.add('view-reader');
    showToast(id ? '笔记已更新' : '笔记已保存');
  } catch (error) {
    if (!entrySaved && uploadedAssets.length) {
      await Promise.allSettled(uploadedAssets.map((asset) => (
        api(`/api/uploads/${encodeURIComponent(asset.name)}`, { method: 'DELETE' })
      )));
    }
    showToast(error.message, 'error');
  } finally {
    elements.saveEntry.disabled = false;
  }
}

function openImportDialog() {
  state.importFiles = [];
  elements.importForm.reset();
  fillPlacementFields(elements.importLocation, elements.importCategory, elements.importGroup, state.categoryId || '', state.groupId || '');
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
  formData.append('categoryId', elements.importCategory.value);
  formData.append('groupId', elements.importGroup.value);
  formData.append('tags', elements.importTags.value);
  elements.startImport.disabled = true;

  try {
    const created = await api('/api/import', { method: 'POST', body: formData });
    elements.importDialog.close();
    const newest = created.at(-1);
    state.selectedId = newest?.id || null;
    state.selectedEntry = newest || null;
    if (newest?.categoryId) {
      state.category = 'all';
      state.categoryId = newest.categoryId;
      state.groupId = newest.groupId || null;
      state.expandedCollections.add(newest.categoryId);
    }
    await loadLibrary({ preferredId: newest?.id, skipDetail: true });
    if (newest) renderReader(newest);
    showToast(`已导入 ${created.length} 篇笔记`);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.startImport.disabled = state.importFiles.length === 0;
  }
}

function openCollectionDialog(collection = null) {
  elements.collectionForm.reset();
  elements.collectionId.value = collection?.id || '';
  elements.collectionName.value = collection?.name || '';
  elements.collectionDescription.value = collection?.description || '';
  elements.collectionDialogTitle.textContent = collection ? '编辑笔记本组' : '新建笔记本组';
  elements.deleteCollection.hidden = !collection;
  const legacyColorMap = {
    '#2f6fdb': '#5667c9', '#2e8b6d': '#42a998', '#b65f3d': '#f0a64a', '#8a5da8': '#7d67b8',
    '#9a6d12': '#f0a64a', '#39788a': '#3f8eb5', '#a4496d': '#d65f72'
  };
  const color = legacyColorMap[collection?.color] || collection?.color || categoryColors[0];
  const colorInput = elements.collectionForm.querySelector(`input[name="collection-color"][value="${color}"]`)
    || elements.collectionForm.querySelector('input[name="collection-color"]');
  colorInput.checked = true;
  elements.collectionDialog.showModal();
  requestAnimationFrame(() => elements.collectionName.focus());
}

async function saveCollection(event) {
  event.preventDefault();
  const id = elements.collectionId.value;
  const submit = document.querySelector('#save-collection');
  submit.disabled = true;
  try {
    const collection = await api(id ? `/api/collections/${id}` : '/api/collections', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: elements.collectionName.value,
        description: elements.collectionDescription.value,
        color: elements.collectionForm.querySelector('input[name="collection-color"]:checked')?.value
      })
    });
    elements.collectionDialog.close();
    state.category = 'all';
    state.categoryId = collection.id;
    state.groupId = null;
    state.expandedCollections.add(collection.id);
    await loadLibrary({ preferredId: null });
    showToast(id ? '笔记本组已更新' : '笔记本组已创建');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submit.disabled = false;
  }
}

function openGroupDialog(collection, group = null) {
  if (!collection) return;
  elements.groupForm.reset();
  elements.groupCollectionId.value = collection.id;
  elements.groupId.value = group?.id || '';
  elements.groupName.value = group?.name || '';
  elements.groupDescription.value = group?.description || '';
  elements.groupParentLabel.textContent = collection.name;
  elements.groupDialogTitle.textContent = group ? '编辑笔记本' : '新建笔记本';
  elements.deleteGroup.hidden = !group;
  elements.groupDialog.showModal();
  requestAnimationFrame(() => elements.groupName.focus());
}

async function saveGroup(event) {
  event.preventDefault();
  const collectionId = elements.groupCollectionId.value;
  const id = elements.groupId.value;
  const submit = document.querySelector('#save-group');
  submit.disabled = true;
  try {
    const group = await api(`/api/collections/${collectionId}/groups${id ? `/${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: elements.groupName.value,
        description: elements.groupDescription.value
      })
    });
    elements.groupDialog.close();
    state.category = 'all';
    state.categoryId = collectionId;
    state.groupId = group.id;
    state.expandedCollections.add(collectionId);
    await loadLibrary({ preferredId: null });
    showToast(id ? '笔记本已更新' : '笔记本已创建');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submit.disabled = false;
  }
}

function openDeleteConfirm(target) {
  state.deleteTarget = target;
  elements.confirmTitle.textContent = target.title;
  elements.confirmDescription.textContent = target.description;
  elements.confirmDelete.textContent = target.buttonLabel;
  elements.confirmDialog.showModal();
}

async function deleteStructure(target) {
  const path = target.type === 'collection'
    ? `/api/collections/${target.collectionId}`
    : `/api/collections/${target.collectionId}/groups/${target.groupId}`;
  await api(path, { method: 'DELETE' });
  state.category = 'all';
  state.categoryId = null;
  state.groupId = null;
  state.selectedId = null;
  state.selectedEntry = null;
  await loadLibrary({ preferredId: null });
  showToast(target.type === 'collection' ? '笔记本组已删除' : '笔记本已删除');
}

async function deleteSelected(id = state.selectedId) {
  if (!id) return;
  await api(`/api/entries/${id}`, { method: 'DELETE' });
  state.selectedId = null;
  state.selectedEntry = null;
  await loadLibrary();
  showToast('笔记已删除');
}

async function confirmDeleteTarget() {
  const target = state.deleteTarget;
  if (!target) return;
  elements.confirmDelete.disabled = true;
  try {
    if (target.type === 'entry') await deleteSelected(target.id);
    else await deleteStructure(target);
    elements.confirmDialog.close();
    state.deleteTarget = null;
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
      state.categoryId = null;
      state.groupId = null;
      document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('is-active', item === button));
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
document.querySelector('#new-collection-inline').addEventListener('click', () => openCollectionDialog());
document.querySelector('#import-entry').addEventListener('click', openImportDialog);
elements.entryForm.addEventListener('submit', saveEntry);
elements.entryLocation.addEventListener('change', () => (
  syncPlacementFromLocation(elements.entryLocation, elements.entryCategory, elements.entryGroup)
));
elements.addEntryImages.addEventListener('click', () => elements.entryImageInput.click());
elements.entryImageInput.addEventListener('change', () => addEditorImages(elements.entryImageInput.files));
elements.editorImageList.addEventListener('click', (event) => {
  const button = event.target.closest('.editor-image-remove');
  const item = button?.closest('[data-image-kind]');
  if (item) removeEditorImage(item.dataset.imageKind, item.dataset.imageKey);
});
elements.entryBody.addEventListener('paste', (event) => {
  const images = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith('image/'));
  if (!images.length) return;
  event.preventDefault();
  addEditorImages(images);
});
elements.entryBody.addEventListener('dragover', (event) => {
  if ([...(event.dataTransfer?.types || [])].includes('Files')) event.preventDefault();
});
elements.entryBody.addEventListener('drop', (event) => {
  const images = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith('image/'));
  if (!images.length) return;
  event.preventDefault();
  addEditorImages(images);
});
elements.entryDialog.addEventListener('close', () => {
  clearPendingEditorImages();
  editorState.existingAssets = [];
  elements.editorImageList.innerHTML = '';
  elements.editorImageList.hidden = true;
});
elements.importForm.addEventListener('submit', importFiles);
elements.importLocation.addEventListener('change', () => (
  syncPlacementFromLocation(elements.importLocation, elements.importCategory, elements.importGroup)
));
elements.collectionForm.addEventListener('submit', saveCollection);
elements.groupForm.addEventListener('submit', saveGroup);
elements.moveForm.addEventListener('submit', moveEntry);
elements.moveSearch.addEventListener('input', renderMoveLocations);
elements.moveLocationList.addEventListener('click', (event) => {
  const option = event.target.closest('[data-move-value]');
  if (!option) return;
  moveState.selectedValue = option.dataset.moveValue;
  renderMoveLocations();
});
document.querySelectorAll('[data-create-mode]').forEach((button) => {
  button.addEventListener('click', () => syncQuickCreateMode(button.dataset.createMode));
});
elements.quickCreateSubmit.addEventListener('click', createMoveLocation);
elements.quickCreateName.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  createMoveLocation();
});
elements.publishSite.addEventListener('click', openPublishDialog);
elements.publishForm.addEventListener('submit', publishSite);
elements.confirmDelete.addEventListener('click', (event) => {
  event.preventDefault();
  confirmDeleteTarget();
});
elements.confirmDialog.addEventListener('close', () => {
  if (elements.confirmDialog.returnValue === 'cancel') state.deleteTarget = null;
});

elements.deleteCollection.addEventListener('click', () => {
  const collection = state.collections.find((item) => item.id === elements.collectionId.value);
  if (!collection) return;
  elements.collectionDialog.close();
  openDeleteConfirm({
    type: 'collection',
    collectionId: collection.id,
    title: `删除“${collection.name}”？`,
    description: '只有空笔记本组可以删除，请先移动或删除其中的笔记。',
    buttonLabel: '删除笔记本组'
  });
});

elements.deleteGroup.addEventListener('click', () => {
  const collection = state.collections.find((item) => item.id === elements.groupCollectionId.value);
  const group = collection?.groups.find((item) => item.id === elements.groupId.value);
  if (!collection || !group) return;
  elements.groupDialog.close();
  openDeleteConfirm({
    type: 'group',
    collectionId: collection.id,
    groupId: group.id,
    title: `删除“${group.name}”？`,
    description: '只有空笔记本可以删除，请先移动或删除其中的笔记。',
    buttonLabel: '删除笔记本'
  });
});

elements.categoryNav.addEventListener('click', (event) => {
  const createButton = event.target.closest('[data-create-collection]');
  if (createButton) return openCollectionDialog();

  const expandButton = event.target.closest('[data-expand-collection]');
  if (expandButton) {
    const id = expandButton.dataset.expandCollection;
    if (state.expandedCollections.has(id)) state.expandedCollections.delete(id);
    else state.expandedCollections.add(id);
    localStorage.setItem('echo-expanded-collections', JSON.stringify([...state.expandedCollections]));
    renderCollectionTree();
    return;
  }

  const editCollection = event.target.closest('[data-edit-collection]');
  if (editCollection) {
    return openCollectionDialog(state.collections.find((item) => item.id === editCollection.dataset.editCollection));
  }

  const addGroup = event.target.closest('[data-add-group]');
  if (addGroup) return openGroupDialog(state.collections.find((item) => item.id === addGroup.dataset.addGroup));

  const editGroup = event.target.closest('[data-edit-group]');
  if (editGroup) {
    const collection = state.collections.find((item) => item.id === editGroup.dataset.parentId);
    return openGroupDialog(collection, collection?.groups.find((item) => item.id === editGroup.dataset.editGroup));
  }

  const select = event.target.closest('[data-collection-id]');
  if (!select) return;
  state.category = 'all';
  state.categoryId = select.dataset.collectionId;
  state.groupId = select.dataset.groupId || null;
  state.expandedCollections.add(state.categoryId);
  localStorage.setItem('echo-expanded-collections', JSON.stringify([...state.expandedCollections]));
  closeSidebar();
  loadLibrary({ preferredId: null });
});

elements.newGroup.addEventListener('click', () => openGroupDialog(currentCollection()));
elements.scopeNewEntry.addEventListener('click', () => openEntryDialog());
elements.editScope.addEventListener('click', () => {
  const collection = currentCollection();
  const group = currentGroup();
  if (group) openGroupDialog(collection, group);
  else openCollectionDialog(collection);
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
