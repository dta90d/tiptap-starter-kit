# Image extension

Use this extension to render Image element. This extension extend from [@tiptap/extension-image](https://tiptap.dev/docs/editor/extensions/nodes/image).

Paste images can be uploaded automatically.

## Options

### HTMLAttributes

Custom HTML attributes that should be added to the rendered HTML tag.

```typescript
Image.configure({
  HTMLAttributes: {
    class: "my-custom-class",
  },
});
```

### dictionary

If you need to internationalize this extension, you can use this option.

```typescript
Image.configure({
  dictionary: {
    name: "Image",
    empty: "Add image",
    error: "Error loading image",
    loading: "Loading image...",
    inputSrc: "Enter or paste link",
    inputAlt: "Image description",
    inputTitle: "Image title",
    imageOpen: "Open image",
    imageUpload: "Upload image",
    imageDelete: "Delete image",
    alignLeft: "Left alignment",
    alignCenter: "Center alignment",
    alignRight: "Right alignment",
  },
});
```

### inline

Whether to set the image extension to inline mode.

```typescript
Image.configure({
  inline: false,
});
```

## Commands

### setImage()

Insert a new image element.

```typescript
editor.commands.setImage({
  src: "https://example.com",
  alt: "example alt",
  title: "example title",
  align: "center",
  width: "100px"
});
```

## Deletion behavior

When the image `remove` action is used in the float menu, the extension will call the uploader storage's `delete` method with the image `src` URL. By default `delete` is a no-op; to actually remove files from remote storage you should implement the `delete` handler on the `Uploader` extension or provide `uploader.delete` in editor storage.

```typescript
// remove will call
editor.storage.uploader.delete([editor.getAttributes('image').src]);
```

## InputRules

```markdown
[example alt](https://example.com "example title")
```

## Markdown

```markdown
[example alt](https://example.com "example title")
```
