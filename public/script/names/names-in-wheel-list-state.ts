export const MIN_ITEMS: number = 2;
export const MAX_ITEMS: number = 16;

type NameSubscriber = (names: string[]) => void;

class NamesInWheelState {
  private namesInWheel: string[] = [];
  private subscribers = new Set<NameSubscriber>();

  getNamesInWheelList(): string[] {
    return [...this.namesInWheel];
  }

  getCountOfNamesInWheelList(): number {
    return this.namesInWheel.length;
  }

  subscribe(subscriber: NameSubscriber): void {
    this.subscribers.add(subscriber);
    subscriber(this.getNamesInWheelList());
  }

  setNamesInWheelList(names: string[]): void {
    this.namesInWheel = names.slice(0, MAX_ITEMS);
    this.notify();
  }

  addNameToWheelList(name: string): boolean {
    if (this.namesInWheel.length >= MAX_ITEMS) return false;

    this.namesInWheel = [...this.namesInWheel, name];
    this.notify();
    return true;
  }

  removeNameInWheelListAt(index: number): boolean {
    if (index < 0 || index >= this.namesInWheel.length) return false;

    this.namesInWheel = this.namesInWheel.filter((_, currentIndex) => currentIndex !== index);
    this.notify();
    return true;
  }

  clearNamesInWheelList(): void {
    this.namesInWheel = [];
    this.notify();
  }

  private notify(): void {
    const snapshot = this.getNamesInWheelList();
    this.subscribers.forEach((subscriber) => subscriber(snapshot));
  }
}

export const namesInWheelListState = new NamesInWheelState();
