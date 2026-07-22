declare module 'bootstrap' {
  export class Modal {
    constructor(element: HTMLElement, options?: Partial<{ backdrop: boolean | 'static'; keyboard: boolean; focus: boolean }>)
    show(): void
    hide(): void
    dispose(): void
  }
}
