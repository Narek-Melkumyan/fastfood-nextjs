/** Require a correctly typed element within this component's root. */
export function requireElement<T extends HTMLElement>(root: ParentNode, selector: string, elementType: {
  new(): T;
}): T {
  const element = root.querySelector(selector);
  if (!(element instanceof elementType))
    throw new Error(`Missing or invalid element: ${selector}`);
  return element;
}
/** Keep native listeners and delayed callbacks tied to an effect's lifetime. */
export function createEffects() {
  const controller = new AbortController();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  return {
    listen<K extends keyof HTMLElementEventMap>(element: HTMLElement, event: K, callback: (event: HTMLElementEventMap[K]) => void) {
      element.addEventListener(event, callback, { signal: controller.signal });
    },
    delay(callback: () => void, milliseconds: number) {
      const timer = setTimeout(() => {
        timers.delete(timer); if (!controller.signal.aborted)
          callback();
      }, milliseconds);
      timers.add(timer);
    },
    cleanup() { controller.abort(); timers.forEach(clearTimeout); timers.clear(); },
  };
}
