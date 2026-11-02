declare module "tabulator-tables" {
  export interface CellComponent {
    getValue(): unknown;
    getField(): string;
    getRow(): { getData(): unknown; update(data: Record<string, unknown>): void };
    restoreOldValue(): void;
  }
  export class TabulatorFull {
    constructor(element: HTMLElement, options: {
      columns?: Array<{ formatter?: string | ((cell: CellComponent) => string); [key: string]: unknown }>;
      [key: string]: unknown;
    });
    on(event: string, callback: (cell: CellComponent) => void): void;
    destroy(): void;
  }
}
