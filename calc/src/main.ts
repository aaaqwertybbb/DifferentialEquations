import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/electron-vite.svg'
import { setupCounter } from './counter.ts'
import { setupList } from './list.ts'
import { ListItem } from './interface';

// Tell TS that window.api exists from preload
declare global {
  interface Window {
    api: {
      fetchListItems: () => Promise<ListItem[]>;
    };
  }
}

// 1. Config Variables
const ITEM_HEIGHT = 72;   /* Must match the CSS height perfectly */
const BUFFER_ITEMS = 5;   /* Extra elements above/below viewport to prevent flickering */

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="my-custom-layout-sandbox">
    <header class="list-header">
      <h1>My Tasks</h1>
    </header>
    <!-- The container for our list -->
    <ul id="list-container" class="item-list"></ul>
  </div>
`

//setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
//setupList(document.querySelector<HTMLDivElement>('#list_id')!);

const listContainer = document.getElementById('list-container') as HTMLUListElement;

// Create the phantom element to enforce scrollbar size
const runway = document.createElement('div');
runway.className = 'virtual-runway';
listContainer.appendChild(runway);

// Cache for our loaded dataset
let allItems: ListItem[] = [];

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})

// 3. Item Component Builder
function createListItemElement(item: ListItem): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'list-item';
  li.innerHTML = `
    <div class="item-content">
      <span class="item-title">${item.title}</span>
      <p class="item-desc">${item.description}</p>
    </div>
    <button class="delete-btn">Complete</button>
  `;

  li.querySelector('.delete-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    // Remove from our memory array
    allItems = allItems.filter(i => i.id !== item.id);
    // Trigger structural refresh
    renderVirtualList();
  });

  return li;
}

// 4. Core Rendering Engine
function renderVirtualList() {
  const scrollTop = listContainer.scrollTop;
  const containerHeight = listContainer.clientHeight;
  const totalItems = allItems.length;

  // Set total height so the native scrollbar behaves correctly
  runway.style.height = `${totalItems * ITEM_HEIGHT}px`;

  // Calculate indices of items currently visible in viewport
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS;
  let endIndex = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ITEMS;

  // Clamp boundaries to valid array lengths
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(totalItems - 1, endIndex);

  // Clear everything except the runway
  const elementsToRemove = listContainer.querySelectorAll('.list-item');
  elementsToRemove.forEach(el => el.remove());

  // Render only the visible subset
  const fragment = document.createDocumentFragment();
  for (let i = startIndex; i <= endIndex; i++) {
    const item = allItems[i];
    if (!item) continue;

    const itemEl = createListItemElement(item);
    
    // Position the item exactly where it belongs in the long timeline
    const topPosition = i * ITEM_HEIGHT;
    itemEl.style.transform = `translateY(${topPosition}px)`;
    
    fragment.appendChild(itemEl);
  }
  
  listContainer.appendChild(fragment);
}

// 5. Setup Listeners and Initializers
async function initList() {
  try {
    // Fetch dataset from main process (mocking 50,000 items)
    allItems = await window.api.fetchListItems();
    
    // Listen for scrolling
    listContainer.addEventListener('scroll', () => {
      // requestAnimationFrame guarantees calculation matches screen refresh rate (no stutter)
      requestAnimationFrame(renderVirtualList);
    }, { passive: true });

    // Handle window resizing dynamically
    window.addEventListener('resize', renderVirtualList);

    // Initial render pass
    renderVirtualList();
  } catch (error) {
    console.error('Failed to load list items:', error);
  }
}

initList();
