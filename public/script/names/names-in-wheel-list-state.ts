export const MIN_ITEMS: number = 2;
export const MAX_ITEMS: number = 16;

type NameSubscriber = (names: string[]) => void;

export const ADD_NAME_REJECTION = {
  MAX_REACHED: "max_reached",
  DUPLICATE: "duplicate",
} as const;

export type AddNameRejectionCode =
  (typeof ADD_NAME_REJECTION)[keyof typeof ADD_NAME_REJECTION];

export type AddNameResult =
  | { added: true }
  | { added: false; code: AddNameRejectionCode };

// Namen sind auf dem Rad eindeutig — sonst liesse sich ein Eintrag weder
// zuverlaessig einem Account zuordnen noch beim Entfernen auseinanderhalten.
// Gross-/Kleinschreibung zaehlt dabei nicht als Unterschied.
export function isNameInWheelList(names: string[], candidate: string): boolean {
  const normalizedCandidate = candidate.trim().toLowerCase();
  return names.some((name) => name.trim().toLowerCase() === normalizedCandidate);
}

function dropDuplicateNames(names: string[]): string[] {
  return names.filter((name, index) => !isNameInWheelList(names.slice(0, index), name));
}

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
    this.namesInWheel = dropDuplicateNames(names).slice(0, MAX_ITEMS);
    this.notify();
  }

  addNameToWheelList(name: string): AddNameResult {
    if (this.namesInWheel.length >= MAX_ITEMS) {
      return { added: false, code: ADD_NAME_REJECTION.MAX_REACHED };
    }
    if (isNameInWheelList(this.namesInWheel, name)) {
      return { added: false, code: ADD_NAME_REJECTION.DUPLICATE };
    }

    this.namesInWheel = [...this.namesInWheel, name];
    this.notify();
    return { added: true };
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
