import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/electron-vite.svg'
import { setupCounter } from './counter.ts'
import { setupList } from './list.ts'
import { ListItem } from './interface';
import { VirtualList } from './components/VirtualList.ts'

// Tell TS that window.api exists from preload
declare global {
  interface Window {
    api: {
      fetchListItems: () => Promise<ListItem[]>;
    };
  }
}

//// 1. Config Variables
//const ITEM_HEIGHT = 72;   /* Must match the CSS height perfectly */
//const BUFFER_ITEMS = 5;   /* Extra elements above/below viewport to prevent flickering */

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

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})

const listElement = document.getElementById('list-container') as HTMLUListElement;

// 1. Define how your task rows should look
const taskList = new VirtualList<ListItem>({
  container: listElement,
  itemHeight: 72,
  renderItem: (item) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-content">
        <span class="item-title">${item.title}</span>
        <p class="item-desc">${item.description}</p>
      </div>
      <button class="delete-btn">Complete</button>
    `;
    
    li.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Handle delete actions here
    });
    
    return li;
  }
});

// 2. Feed it data whenever you receive it
async function init() {
  const items = await window.api.fetchListItems();
  taskList.updateData(items);
}
init();
