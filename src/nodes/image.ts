import { mergeAttributes } from "@tiptap/core";
import { Image as TImage, ImageOptions as TImageOptions } from "@tiptap/extension-image";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { BlockMenuItemStorage } from "../extensions/block-menu/menu";
import { FloatMenuItemStorage } from "../extensions/float-menu/menu";
import { FloatMenuView } from "../extensions/float-menu/view";
import { NodeMarkdownStorage } from "../extensions/markdown";
import { unwrap, wrap } from "../extensions/markdown/plugins/wrap";
import { InnerResizerView } from "../extensions/node-view/inner-resizer";
import { UploaderItemStorage, UploaderStorage } from "../extensions/uploader";
import { icon } from "../utils/icons";

export interface ImageOptions extends TImageOptions {
  dictionary: {
    name: string;
    empty: string;
    error: string;
    loading: string;
    inputSrc: string;
    inputImageSource: string;
    inputAlt: string;
    inputTitle: string;
    imageOpen: string;
    imageUpload: string;
    imageDelete: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
  };
}

export const Image = TImage.extend<ImageOptions>({
  name: "image",
  addOptions() {
    return {
      ...this.parent?.(),
      dictionary: {
        name: "Image",
        empty: "Add image",
        error: "Error loading image",
        loading: "Loading image...",
        inputSrc: "Image url",
        inputImageSource: "Image source",
        inputAlt: "Image description",
        inputTitle: "Image title",
        imageOpen: "Open image",
        imageUpload: "Upload image",
        imageDelete: "Delete image",
        alignLeft: "Left alignment",
        alignCenter: "Center alignment",
        alignRight: "Right alignment",
      },
    };
  },
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: node => node.type === "image",
          apply: (state, node, type) => {
            const src = node.url as string;
            const alt = node.alt as string;
            const title = node.title as string;
            state.addNode(type, {
              src,
              alt,
              title,
            });
          },
        },
        serializer: {
          match: node => node.type.name === this.name,
          apply: (state, node) => {
            state.addNode({
              type: "image",
              title: node.attrs.title,
              url: node.attrs.src,
              alt: node.attrs.alt,
            });
          },
        },
        hooks: {
          afterParse: root => this.options.inline ? root : unwrap(root, node => node.type === "image"),
          beforeSerialize: root => this.options.inline ? root : wrap(root, node => node.type === "image"),
        },
      },
      uploader: {
        match: (_editor, data) => data.type.startsWith("image"),
        // Do not pre-fill alt with the file name when inserting programmatically
        apply: (editor, data) => editor.chain().setImage({ src: data.url }).run(),
      },
      floatMenu: {
        hide: true,
      },
      blockMenu: {
        items: [
          {
            id: this.name,
            name: this.options.dictionary.name,
            icon: icon("image"),
            keywords: "image,picture,tp,zp",
            action: editor => editor.chain().setImage({ src: "" }).focus().run(),
          },
        ],
      },
    } satisfies NodeMarkdownStorage & UploaderItemStorage & FloatMenuItemStorage & BlockMenuItemStorage;
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      imageSource: {
        default: null,
      },
      align: {
        default: "center",
      },
      width: {
        default: null,
      },
    };
  },
  addNodeView() {
    return InnerResizerView.create({
      resize: ["width"],
      HTMLAttributes: this.options.HTMLAttributes,
      onInit: ({ view }) => {
        const img = document.createElement("img");
        for (const [key, value] of Object.entries(mergeAttributes(view.HTMLAttributes))) {
          if (value !== undefined && value !== null) {
            img.setAttribute(key, value);
          }
        }

        img.src = view.node.attrs.src ?? "";
        img.alt = view.node.attrs.alt ?? "";
        img.title = view.node.attrs.title ?? "";
        view.$root.setAttribute("data-status", "loading");
        img.addEventListener("load", () => {
          view.$root.removeAttribute("data-status");
        });
        img.addEventListener("error", () => {
          if (img.getAttribute("src")) {
            view.$root.setAttribute("data-status", "error");
          } else {
            view.$root.setAttribute("data-status", "empty");
          }
        });

        const empty = document.createElement("span");
        empty.innerHTML = `${icon("empty")}<span>${this.options.dictionary.empty}</span>`;

        const error = document.createElement("span");
        error.innerHTML = `${icon("error")}<span>${this.options.dictionary.error}</span>`;

        const loading = document.createElement("span");
        loading.innerHTML = `${icon("loading")}<span>${this.options.dictionary.loading}</span>`;

        view.$root.append(img);
        view.$root.append(empty);
        view.$root.append(error);
        view.$root.append(loading);
      },
      onUpdate: ({ view }) => {
        const img = view.$root.firstElementChild as HTMLImageElement;
        if (img) {
          const src = view.node.attrs.src ?? "";
          if (img.getAttribute("src") !== src) {
            img.src = src;
          }
          const alt = view.node.attrs.alt ?? "";
          if (img.getAttribute("alt") !== alt) {
            img.alt = alt;
          }
          const title = view.node.attrs.title ?? "";
          if (img.getAttribute("title") !== title) {
            img.title = title;
          }
        }
      },
    });
  },
  addProseMirrorPlugins() {
    return [
      ...TImage.config.addProseMirrorPlugins?.apply(this) ?? [],
      new Plugin({
        key: new PluginKey(`${this.name}-float-menu`),
        view: FloatMenuView.create({
          editor: this.editor,
          tippy: {
            placement: "bottom",
          },
          show: ({ editor }) => {
            return editor.isEditable && editor.isActive(this.name);
          },
          onInit: ({ view, editor, root }) => {
            const src = view.createInput({
              id: "src",
              name: this.options.dictionary.inputSrc,
              attributes: {
                style: "display: none;",
              },
              onKey: ({ key }) => {
                if (key === "ArrowDown") {
                  const node = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
              onBoundary: (boundary) => {
                if (boundary === "left") {
                  editor.chain().focus().run();
                }
                if (boundary === "right") {
                  const node = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
            });
            const imageSource = view.createInput({
              id: "imageSource",
              name: this.options.dictionary.inputImageSource,
              onKey: ({ key }) => {
                if (key === "ArrowUp") {
                  const node = root.querySelector(`input[name="src"]`) as HTMLInputElement;
                  node?.focus();
                }
                if (key === "ArrowDown") {
                  const node = root.querySelector(`input[name="title"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
              onBoundary: (boundary) => {
                if (boundary === "left") {
                  const node = root.querySelector(`input[name="src"]`) as HTMLInputElement;
                  node?.focus();
                }
                if (boundary === "right") {
                  const node = root.querySelector(`input[name="title"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
            });
            const alt = view.createInput({
              id: "alt",
              name: this.options.dictionary.inputAlt,
              onKey: ({ key }) => {
                if (key === "ArrowUp") {
                  const node = root.querySelector(`input[name="src"]`) as HTMLInputElement;
                  node?.focus();
                }
                if (key === "ArrowDown") {
                  const node = root.querySelector(`input[name="title"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
              onBoundary: (boundary) => {
                if (boundary === "left") {
                  const node = root.querySelector(`input[name="src"]`) as HTMLInputElement;
                  node?.focus();
                }
                if (boundary === "right") {
                  const node = root.querySelector(`input[name="title"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
            });
            const title = view.createInput({
              id: "title",
              name: this.options.dictionary.inputTitle,
              onKey: ({ key }) => {
                if (key === "ArrowUp") {
                  const node = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
                  node?.focus();
                }
              },
              onBoundary: (boundary) => {
                if (boundary === "left") {
                  const node = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
                  node?.focus();
                }
                if (boundary === "right") {
                  editor.chain().focus().run();
                }
              },
            });

            const open = view.createButton({
              id: "open",
              name: this.options.dictionary.imageOpen,
              icon: icon("open"),
              onClick: () => {
                const attrs = editor.getAttributes(this.name);
                if (attrs.src) {
                  window.open(attrs.src, attrs.target);
                }
              },
            });
            const upload = view.createUpload({
              id: "upload",
              name: this.options.dictionary.imageUpload,
              icon: icon("upload"),
              accept: "image/*",
              onUpload: (element) => {
                const uploader = this.editor.storage.uploader as UploaderStorage;
                if (element.files && uploader) {
                  uploader.upload(element.files).then(items => items.forEach((item) => {
                    if (item.type.startsWith("image")) {
                      // Preserve current title (if any) and avoid using file name as alt
                      const attrs = editor.getAttributes(this.name);
                      editor.chain().setImage({ src: item.url, alt: attrs.alt, title: attrs.title }).run();
                    }
                  }));
                }
              },
            });
            const remove = view.createButton({
              id: "remove",
              name: this.options.dictionary.imageDelete,
              icon: icon("remove"),
              onClick: () => {
                const uploader = this.editor.storage.uploader as UploaderStorage;
                const attrs = editor.getAttributes(this.name);
                uploader.delete([attrs.src]);
                editor.chain().deleteSelection().focus().run();
              },
            });
            const alignLeft = view.createButton({
              id: "align-left",
              name: this.options.dictionary.alignLeft,
              icon: icon("align-left"),
              onClick: () => editor.chain().updateAttributes(this.name, { align: "left" }).run(),
            });
            const alignCenter = view.createButton({
              id: "align-center",
              name: this.options.dictionary.alignCenter,
              icon: icon("align-center"),
              onClick: () => editor.chain().updateAttributes(this.name, { align: "center" }).run(),
            });
            const alignRight = view.createButton({
              id: "align-right",
              name: this.options.dictionary.alignRight,
              icon: icon("align-right"),
              onClick: () => editor.chain().updateAttributes(this.name, { align: "right" }).run(),
            });

            const form = view.createForm();
            const action = view.createAction();

            form.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                editor
                  .chain()
                  .updateAttributes(this.name, {
                    src: src.querySelector("input")!.value,
                    imageSource: imageSource.querySelector("input")!.value,
                    alt: alt.querySelector("input")!.value,
                    title: title.querySelector("input")!.value,
                  })
                  .focus()
                  .run();
              }
            });

            form.append(src);
            form.append(title);
            form.append(alt);
            form.append(imageSource);
            form.append(action);
            action.append(open);
            action.append(upload);
            action.append(alignLeft);
            action.append(alignCenter);
            action.append(alignRight);
            action.append(remove);
            root.append(form);

            // Auto-save on input changes
            const srcInput = src.querySelector("input") as HTMLInputElement | null;
            const imageSourceInput = imageSource.querySelector("input") as HTMLInputElement | null;
            const altInput = alt.querySelector("input") as HTMLInputElement | null;
            const titleInput = title.querySelector("input") as HTMLInputElement | null;

            // Persist sync state on the form element so it survives node changes
            const getIsAltSynced = () => form.getAttribute("data-alt-synced") === "true";
            const setIsAltSynced = (v: boolean) => form.setAttribute("data-alt-synced", v ? "true" : "false");
            // Default to not synced; will be recomputed correctly in onMount
            setIsAltSynced(false);

            const applyUpdate = () => {
              editor
                .chain()
                .updateAttributes(this.name, {
                  src: srcInput?.value ?? "",
                  imageSource: imageSourceInput?.value ?? "",
                  alt: altInput?.value ?? "",
                  title: titleInput?.value ?? "",
                })
                .run();
            };

            srcInput?.addEventListener("input", applyUpdate);
            imageSourceInput?.addEventListener("input", applyUpdate);
            altInput?.addEventListener("input", () => {
              // If user types in alt and diverges from title, stop syncing for this session
              if (altInput && titleInput && altInput.value !== titleInput.value) {
                setIsAltSynced(false);
              }
              applyUpdate();
            });
            titleInput?.addEventListener("input", () => {
              if (getIsAltSynced() && altInput && titleInput) {
                altInput.value = titleInput.value;
              }
              applyUpdate();
            });
          },
          onMount: ({ root }) => {
            const form = root.querySelector(`div.ProseMirror-fm-form`) as HTMLFormElement;
            const altInput = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
            const titleInput = root.querySelector(`input[name="title"]`) as HTMLInputElement;
            // Determine initial sync state: copy title -> alt if alt is empty or equals title
            const setIsAltSynced = (v: boolean) => form?.setAttribute("data-alt-synced", v ? "true" : "false");
            setIsAltSynced(!!(altInput && titleInput && ((altInput.value ?? "") === "" || (altInput.value ?? "") === (titleInput.value ?? ""))));
          },
          onUpdate: ({ editor, root }) => {
            const attrs = editor.getAttributes(this.name);

            const src = root.querySelector(`input[name="src"]`) as HTMLInputElement;
            const imageSource = root.querySelector(`input[name="imageSource"]`) as HTMLInputElement;
            const alt = root.querySelector(`input[name="alt"]`) as HTMLInputElement;
            const title = root.querySelector(`input[name="title"]`) as HTMLInputElement;

            src.value = attrs.src ?? "";
            imageSource.value = attrs.imageSource ?? "";
            alt.value = attrs.alt ?? "";
            title.value = attrs.title ?? "";
          },
        }),
      }),
    ];
  },
});
