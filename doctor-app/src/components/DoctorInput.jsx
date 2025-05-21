// TiptapEditorUI.jsx
import React from "react";
import { EditorContent } from "@tiptap/react";
import { Box, useTheme } from "@mui/material";

const TiptapEditorUI = ({ editor }) => {
  const theme = useTheme();

  const editorStyle = {
    border: `1px solid ${
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.23)"
        : "rgba(0, 0, 0, 0.23)"
    }`,
    borderRadius: theme.shape.borderRadius,
    padding: "16.5px 14px",
    minHeight: "calc(85vh)",
    maxHeight: "calc(85vh)",
    overflowY: "auto",
    flexGrow: 1,
    cursor: "text",
    width: "43vw",
    backgroundColor: theme.palette.background.paper,
    "&:hover": { borderColor: theme.palette.text.primary },
    "&.is-focused": {
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
      padding: "15.5px 13px",
    },
    ".ProseMirror": {
      outline: "none",
      lineHeight: 1.6,
      height: "100%",
      "& p": { margin: 0, marginBottom: "0.5em" },
    },
  };

  return (
    <Box
      sx={editorStyle}
      className={editor?.isFocused ? "is-focused" : ""}
      onClick={() => editor?.chain().focus().run()}
    >
      <EditorContent editor={editor} />
    </Box>
  );
};

export default TiptapEditorUI;
