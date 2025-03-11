/**
 * 文件下载扩展
 * 为文件浏览器添加文件夹下载功能
 */

// 获取基础URL
function getBaseUrl() {
  const domain = 'ha_file_explorer';
  return `/${domain}-api`;
}

/**
 * 下载文件夹
 * @param {string} path 文件夹路径
 */
function downloadFolder(path) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}?act=download_folder&path=${encodeURIComponent(path)}`;
  
  // 创建一个隐藏的a标签用于下载
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = path.split('/').pop() + '.zip';
  document.body.appendChild(a);
  a.click();
  
  // 下载开始后移除a标签
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * 下载单个文件
 * @param {string} path 文件路径
 */
function downloadFile(path) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}?act=download_file&path=${encodeURIComponent(path)}`;
  
  // 创建一个隐藏的a标签用于下载
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = path.split('/').pop();
  document.body.appendChild(a);
  a.click();
  
  // 下载开始后移除a标签
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * 修改Vue组件，添加下载按钮
 */
function modifyVueComponents() {
  // 等待Vue应用加载完成
  const checkInterval = setInterval(() => {
    // 检查Vue应用是否已加载
    if (window.app && window.app.__vue__) {
      clearInterval(checkInterval);
      injectDownloadButtons();
    } else if (document.querySelector('.v-app')) {
      // 如果找到了Vue应用的根元素，但还没有获取到Vue实例
      // 尝试通过DOM操作添加按钮
      clearInterval(checkInterval);
      addDownloadButtonsByDOM();
    }
  }, 500);
}

/**
 * 通过DOM操作添加下载按钮
 */
function addDownloadButtonsByDOM() {
  console.log('正在通过DOM添加下载按钮...');
  
  // 监听文件列表变化
  const observer = new MutationObserver((mutations) => {
    // 检查是否有新的文件行添加
    const tableBody = document.querySelector('.v-data-table__wrapper tbody');
    if (tableBody) {
      const rows = tableBody.querySelectorAll('tr');
      processRows(rows);
    }
  });
  
  // 开始监听整个应用
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 立即处理现有行
  const rows = document.querySelectorAll('.v-data-table__wrapper tbody tr');
  if (rows.length > 0) {
    processRows(rows);
  }
  
  // 添加全局下载按钮
  addGlobalDownloadButton();
}

/**
 * 处理表格行，为每行添加下载按钮
 */
function processRows(rows) {
  rows.forEach(row => {
    // 跳过已处理的行
    if (row.querySelector('.download-button')) {
      return;
    }
    
    // 获取文件信息
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;
    
    // 第一个单元格通常包含图标，用于判断是文件还是文件夹
    const typeCell = cells[0];
    // 第二个单元格通常包含名称和路径信息
    const nameCell = cells[1];
    // 最后一个单元格通常是操作按钮区域
    const actionCell = cells[cells.length - 1];
    
    // 确定是否为文件夹
    const folderIcon = typeCell.querySelector('.mdi-folder, .mdi-folder-outline');
    const isFolder = folderIcon !== null || typeCell.textContent.trim().includes('文件夹');
    
    // 尝试获取路径
    let path = '';
    // 查找可能包含路径的元素
    const pathElements = nameCell.querySelectorAll('[data-path], [title], a');
    for (const el of pathElements) {
      if (el.hasAttribute('data-path')) {
        path = el.getAttribute('data-path');
        break;
      } else if (el.hasAttribute('title') && el.title.includes('/')) {
        path = el.title;
        break;
      } else if (el.hasAttribute('href') && el.href.includes('path=')) {
        const match = el.href.match(/path=([^&]+)/);
        if (match) {
          path = decodeURIComponent(match[1]);
          break;
        }
      }
    }
    
    // 如果没有找到路径，尝试从行的data属性或其他属性中获取
    if (!path) {
      if (row.hasAttribute('data-path')) {
        path = row.getAttribute('data-path');
      } else if (row.hasAttribute('data-item')) {
        try {
          const item = JSON.parse(row.getAttribute('data-item'));
          path = item.path || item.name || '';
        } catch (e) {
          // 解析JSON失败，忽略
        }
      } else {
        // 最后尝试使用文件名作为路径
        path = nameCell.textContent.trim();
      }
    }
    
    if (!path) return;
    
    // 创建下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'v-btn v-btn--icon v-btn--round v-btn--text download-button';
    downloadBtn.style.marginRight = '8px';
    downloadBtn.innerHTML = '<span class="v-btn__content"><i aria-hidden="true" class="v-icon notranslate mdi mdi-download" style="font-size: 20px;"></i></span>';
    downloadBtn.title = isFolder ? '下载文件夹' : '下载文件';
    
    // 添加点击事件
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发行点击事件
      console.log(`正在下载${isFolder ? '文件夹' : '文件'}: ${path}`);
      if (isFolder) {
        downloadFolder(path);
      } else {
        downloadFile(path);
      }
    });
    
    // 将按钮添加到操作单元格
    if (actionCell) {
      // 检查是否已经有操作按钮
      const existingButtons = actionCell.querySelectorAll('button, .v-btn');
      if (existingButtons.length > 0) {
        actionCell.insertBefore(downloadBtn, existingButtons[0]);
      } else {
        actionCell.appendChild(downloadBtn);
      }
    }
  });
}

/**
 * 添加全局下载按钮（在工具栏上）
 */
function addGlobalDownloadButton() {
  // 查找工具栏
  const toolbar = document.querySelector('.v-toolbar__items, .v-app-bar__nav-icon').parentElement;
  if (!toolbar || toolbar.querySelector('.global-download-button')) return;
  
  // 获取当前路径
  let currentPath = '';
  // 尝试从URL或面包屑导航中获取当前路径
  const breadcrumbs = document.querySelectorAll('.v-breadcrumbs-item');
  if (breadcrumbs.length > 0) {
    const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
    currentPath = lastBreadcrumb.textContent.trim();
  }
  
  if (!currentPath) {
    // 尝试从页面标题或其他元素获取
    const title = document.querySelector('.v-toolbar__title, h1, h2');
    if (title) {
      currentPath = title.textContent.trim();
    }
  }
  
  // 创建全局下载按钮
  const globalDownloadBtn = document.createElement('button');
  globalDownloadBtn.className = 'v-btn v-btn--text global-download-button';
  globalDownloadBtn.style.margin = '0 8px';
  globalDownloadBtn.innerHTML = '<span class="v-btn__content"><i aria-hidden="true" class="v-icon notranslate mdi mdi-download" style="margin-right: 4px;"></i> 下载当前文件夹</span>';
  globalDownloadBtn.title = '下载当前文件夹';
  
  // 添加点击事件
  globalDownloadBtn.addEventListener('click', () => {
    console.log(`正在下载当前文件夹: ${currentPath}`);
    downloadFolder(currentPath);
  });
  
  // 将按钮添加到工具栏
  toolbar.appendChild(globalDownloadBtn);
}

/**
 * 通过Vue实例注入下载按钮
 */
function injectDownloadButtons() {
  console.log('正在通过Vue注入下载按钮...');
  // 这部分代码需要根据实际的Vue组件结构进行调整
  // 由于无法确定具体的Vue组件结构，这里仅作为示例
  
  // 退回到DOM方式
  addDownloadButtonsByDOM();
}

// 启动下载功能
modifyVueComponents();

// 导出函数以便在其他地方使用
window.haFileExplorerDownload = {
  downloadFolder,
  downloadFile
};
