// src/interface.ts (or inside your renderer folder)
export interface ListItem {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

export interface Contact {
  email: string;
  isOnline: boolean;
}
