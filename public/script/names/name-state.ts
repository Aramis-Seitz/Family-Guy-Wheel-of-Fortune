import { MAX_ITEMS } from "../shared/constants.js";

type NameSubscriber = (names: string[]) => void;

class NameState {
  private names: string[] = [];
  private subscribers = new Set<NameSubscriber>();

  getNames(): string[] {
    return [...this.names];
  }

  getCount(): number {
    return this.names.length;
  }

  subscribe(subscriber: NameSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.getNames());

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  setNames(names: string[]): void {
    this.names = names.slice(0, MAX_ITEMS);
    this.notify();
  }

  addName(name: string): boolean {
    if (this.names.length >= MAX_ITEMS) return false;

    this.names = [...this.names, name];
    this.notify();
    return true;
  }

  removeAt(index: number): boolean {
    if (index < 0 || index >= this.names.length) return false;

    this.names = this.names.filter((_, currentIndex) => currentIndex !== index);
    this.notify();
    return true;
  }

  clear(): void {
    this.names = [];
    this.notify();
  }

  private notify(): void {
    const snapshot = this.getNames();
    this.subscribers.forEach((subscriber) => subscriber(snapshot));
  }
}

export const nameState = new NameState();
