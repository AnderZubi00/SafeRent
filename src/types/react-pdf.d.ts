declare module "@react-pdf/renderer" {
  import type { ComponentType } from "react";
  export const Document: ComponentType<any>;
  export const Page: ComponentType<any>;
  export const Text: ComponentType<any>;
  export const View: ComponentType<any>;
  export const StyleSheet: {
    create: (styles: Record<string, Record<string, unknown>>) => Record<string, Record<string, unknown>>;
  };
  export const Font: { register: (opts: unknown) => void };
  export const Image: ComponentType<any>;
  export const Link: ComponentType<any>;
}
