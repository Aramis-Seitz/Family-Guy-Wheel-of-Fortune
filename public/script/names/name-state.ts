import { MAX_ITEMS, MIN_ITEMS } from "../shared/constants.js";

type NameEntry = {
  value: string;
  active: boolean;
};

type NameSubscriber = (entries: NameEntry[]) => void;

class NameState {
  private names: NameEntry[] = [];
  private subscribers = new Set<NameSubscriber>();

  getNames(): string[] {
    return this.names.filter((entry) => entry.active).map((entry) => entry.value);
  }

  getEntries(): NameEntry[] {
    return this.names.map((entry) => ({ ...entry }));
  }

  getCount(): number {
    return this.names.length;
  }

  getActiveCount(): number {
    return this.names.filter((entry) => entry.active).length;
  }

  subscribe(subscriber: NameSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.getEntries());

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  setNames(names: string[]): void {
    this.names = names.slice(0, MAX_ITEMS).map((value) => ({ value, active: true }));
    this.notify();
  }

  addName(name: string): boolean {
    if (this.names.length >= MAX_ITEMS) return false;

    this.names = [...this.names, { value: name, active: true }];
    this.notify();
    return true;
  }

  removeAt(index: number): boolean {
    if (index < 0 || index >= this.names.length) return false;

    this.names = this.names.filter((_, currentIndex) => currentIndex !== index);
    this.notify();
    return true;
  }

  toggleActiveAt(index: number): boolean {
    if (index < 0 || index >= this.names.length) return false;
    const entry = this.names[index];
    if (entry.active && this.getActiveCount() <= MIN_ITEMS) return false;

    this.names = this.names.map((item, currentIndex) =>
      currentIndex === index ? { ...item, active: !item.active } : item
    );
    this.notify();
    return true;
  }

  clear(): void {
    this.names = [];
    this.notify();
  }

  private notify(): void {
    const snapshot = this.getEntries();
    this.subscribers.forEach((subscriber) => subscriber(snapshot));
  }
}

export type { NameEntry };
export const nameState = new NameState();
