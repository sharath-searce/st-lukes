import { Mark } from "@tiptap/core";

const HighlightMark = Mark.create({
  name: "customHighlight",
  inclusive: true, // Make the mark inclusive of its boundaries

  renderHTML({ HTMLAttributes }) {
    return ["span", { class: "custom-highlight", ...HTMLAttributes }, 0];
  },

  parseHTML() {
    return [
      {
        tag: "span.custom-highlight",
      },
    ];
  },
});

export default HighlightMark;