// src/components/VirtualList.ts

// Configuration options needed to initialize the list
export interface VirtualListOptions<T> {
  container: HTMLUListElement;           // The target UL element
  itemHeight: number;                     // Fixed height of each row in pixels
  bufferItems?: number;                   // Optional item buffer (defaults to 5)
  renderItem: (item: T, index: number) => HTMLLIElement; // Factory function for rows
}

export class VirtualList<T> {
  private container: HTMLUListElement;
  private runway: HTMLDivElement;
  private itemHeight: number;
  private bufferItems: number;
  private renderItem: (item: T, index: number) => HTMLLIElement;
  
  private items: T[] = [];
  private isTicking = false;

  constructor(options: VirtualListOptions<T>) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.bufferItems = options.bufferItems ?? 5;
    this.renderItem = options.renderItem;

    // 1. Force critical CSS styles programmatically if not set
    this.container.style.position = 'relative';
    this.container.style.overflowY = 'auto';

    // 2. Initialize the physical scrollbar runway
    this.runway = document.createElement('div');
    this.runway.className = 'virtual-runway';
    this.runway.style.position = 'absolute';
    this.runway.style.top = '0';
    this.runway.style.left = '0';
    this.runway.style.width = '100%';
    this.runway.style.visibility = 'hidden';
    this.container.appendChild(this.runway);

    // 3. Attach scroll and resize events safely
    this.container.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
  }

  // Set or update the dataset
  public updateData(newData: T[]): void {
    this.items = newData;
    this.refresh();
  }

  // Force a visual recalculation
  public refresh = (): void => {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const totalItems = this.items.length;

    // Expand the structural runway size
    this.runway.style.height = `${totalItems * this.itemHeight}px`;

    // Map the viewable boundaries
    let startIndex = Math.floor(scrollTop / this.itemHeight) - this.bufferItems;
    let endIndex = Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.bufferItems;

    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(totalItems - 1, endIndex);

    // Clear old visible rows
    const oldRows = this.container.querySelectorAll('.list-item');
    oldRows.forEach(row => row.remove());

    // Render the active subset
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      if (item === undefined) continue;

      const itemEl = this.renderItem(item, i);
      itemEl.classList.add('list-item');
      itemEl.style.position = 'absolute';
      itemEl.style.left = '0';
      itemEl.style.width = '100%';
      itemEl.style.height = `${this.itemHeight}px`;
      itemEl.style.boxSizing = 'border-box';
      itemEl.style.transform = `translateY(${i * this.itemHeight}px)`;

      fragment.appendChild(itemEl);
    }

    this.container.appendChild(fragment);
  };

  // requestAnimationFrame prevents UI stuttering
  private onScroll = (): void => {
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        this.refresh();
        this.isTicking = false;
      });
      this.isTicking = true;
    }
  };

  private onResize = (): void => {
    this.refresh();
  };

  // Cleanup references to avoid memory leaks if component destroys
  public destroy(): void {
    this.container.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    this.container.innerHTML = '';
  }
}
