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

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://electron-vite.github.io" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <div id="list_id" class="list">
    </div>
    <header class="list-header">
      <h1>My Tasks</h1>
    </header>
    <!-- The container for our list -->
    <ul id="list-container" class="item-list"></ul>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
setupList(document.querySelector<HTMLDivElement>('#list_id')!);

const listContainer = document.getElementById('list-container') as HTMLUListElement;

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})

// Component function to build an individual list item element
function createListItemElement(item: ListItem): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'list-item';
  li.setAttribute('data-id', item.id);

  li.innerHTML = `
    <div class="item-content">
      <span class="item-title">${item.title}</span>
      <p class="item-desc">${item.description}</p>
    </div>
    <button class="delete-btn">Complete</button>
  `;

  // Attach event listeners directly to the DOM element if needed
  li.querySelector('.delete-btn')?.addEventListener('click', () => {
    li.remove(); 
    // Pro-tip: You'd typically fire window.ipcRenderer.deleteItem(item.id) here to update the back-end
  });

  return li;
}

// Initializer function
async function initList() {
  try {
    const items = await window.api.fetchListItems();
    
    // Clear loader/placeholder
    listContainer.innerHTML = '';
    
    // Efficiently append elements using a DocumentFragment
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const itemEl = createListItemElement(item);
      fragment.appendChild(itemEl);
    });
    
    listContainer.appendChild(fragment);
  } catch (error) {
    console.error('Failed to load list items:', error);
  }
}

initList();
