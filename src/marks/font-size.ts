import { FontSize as TFontSize, FontSizeOptions as TFontSizeOptions } from "@tiptap/extension-text-style";
import { FloatMenuItemStorage } from "../extensions/float-menu/menu";
import { icon } from "../utils/icons";
import tippy from "tippy.js";

export interface FontSizeOptions extends TFontSizeOptions {
  sizes: string[];
  dictionary: Record<string, string> & {
    name: string;
  };
}

export const FontSize = TFontSize.extend<FontSizeOptions>({  
  name: "fontSize",
  addOptions() {
    return {
      ...this.parent?.(),
      dictionary: {
        name: "Font Size",
      },
      sizes: [
        "8px",
        "9px",
        "10px",
        "11px",
        "12px",
        "14px",
        "16px",
        "18px",
        "20px",
        "22px",
        "24px",
        "26px",
        "28px",
        "30px",
        "32px",
        "34px",
        "38px",
        "40px",
        "44px",
        "48px",
        "54px",
        "60px",
        "68px",
        "76px",
        "82px",
      ]
    };
  },
  addStorage() {
    return {
      floatMenu: {
        items: [
          {
            // expose id "fontSize" so the float menu's default items can reference it
            id: "fontSize",
            render: ({ editor, view, root }) => {
              const node = view.createButton({
                id: this.name,
                name: this.options.dictionary?.name ?? "Font Size",
                icon: icon("font-size")
              });

              const container = document.createElement("div");
              container.classList.add("ProseMirror-fm-color-picker");

              const reset = document.createElement("button");
              reset.classList.add("ProseMirror-fm-button");
              reset.setAttribute("data-size", icon("close"));
              reset.innerHTML = `Reset`;
              const resetPopover = document.createElement("span");
              resetPopover.classList.add("ProseMirror-fm-button-popover");
              resetPopover.innerHTML = "Reset";
              tippy(reset, {
                appendTo: () => document.body,
                content: resetPopover,
                arrow: false,
                theme: "ProseMirror-dark",
                animation: "shift-away",
                duration: [200, 150],
              });
              reset.addEventListener("click", (e) => {
                e.stopPropagation();
                editor.chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().focus().run();
              });
              container.append(reset);

              for (const size of this.options.sizes ?? []) {
                const btn = document.createElement("button");
                btn.classList.add("ProseMirror-fm-button");
                btn.setAttribute("data-size", size.replace("px", ""));
                btn.innerHTML = `<span>${size}</span>`;
                // tooltip for each size
                const popover = document.createElement("span");
                popover.classList.add("ProseMirror-fm-button-popover");
                popover.innerHTML = size;
                tippy(btn, {
                  appendTo: () => document.body,
                  content: popover,
                  arrow: false,
                  theme: "ProseMirror-dark",
                  animation: "shift-away",
                  duration: [200, 150],
                });
                btn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  editor.chain().setMark("textStyle", { fontSize: size }).focus().run();
                });
                container.append(btn);
              }

              const pick = document.createElement("div");
              pick.classList.add("ProseMirror-fm-color-picker");
              pick.append(container);

              tippy(node, {
                appendTo: () => node,
                content: pick,
                arrow: false,
                interactive: true,
                hideOnClick: false,
                theme: "ProseMirror",
                placement: "bottom-start",
                maxWidth: "none",
                animation: "shift-away",
                duration: [200, 150],
                onShow: (i) => {
                  const current = editor.getAttributes("textStyle")?.fontSize || "";
                  for (const item of i.popper.querySelectorAll(`[data-size]`)) {
                    const s = item.getAttribute("data-size");
                    if (`${s}px` === current) {
                      item.innerHTML = icon("check");
                    } else {
                      item.innerHTML = `<span>${s}</span>`;
                    }
                  }
                },
              });

              // reflect active state
              const current = editor.getAttributes("textStyle")?.fontSize;
              if (current) {
                node.setAttribute("data-active", "true");
              }

              root.append(node);
            },
            update: ({ editor, root }) => {
              const node = root.firstElementChild!;
              const current = editor.getAttributes("textStyle")?.fontSize;
              if (current) {
                node.setAttribute("data-active", "true");
              } else {
                node.removeAttribute("data-active");
              }
            },
          },
        ],
      },
    } satisfies FloatMenuItemStorage;
  },
});

export default FontSize;
