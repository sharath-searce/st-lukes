import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Paper, Toolbar, IconButton } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  height: '90vh',
  width: 'calc(50vw - 16px)', // Adjust for potential margins/padding
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const TiptapEditor = ({ highlightSentences }) => {
  const [content, setContent] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor || !highlightSentences || highlightSentences.length === 0) {
      return;
    }

    const view = editor.view;
    const doc = view.state.doc;
    const tr = view.state.tr;

    doc.descendants((node, pos) => {
      if (node.isText) {
        highlightSentences.forEach((sentence) => {
          const index = node.textContent.toLowerCase().indexOf(sentence.toLowerCase());
          if (index !== -1) {
            const start = pos + index;
            const end = start + sentence.length;
            tr.addMark(start, end, editor.schema.marks.highlight.create());
          }
        });
      }
    });

    if (tr.docChanged) {
      view.dispatch(tr);
    }
  }, [editor, highlightSentences]);

  useEffect(() => {
    if (editor && !editor.schema.marks.highlight) {
      editor.schema.marks.highlight = editor.schema.mark('highlight', {
        renderHTML() {
          return ['span', { style: 'background-color: yellow' }, 0];
        },
        parseHTML() {
          return [{ tag: 'span', style: 'background-color: yellow' }];
        },
      });
    }
    editor?.view.updateState(editor.state); // Force re-render to recognize the new mark
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <StyledPaper>
      <StyledToolbar>
        <IconButton onClick={() => editor.chain().focus().toggleBold().run()}>
          <FormatBoldIcon />
        </IconButton>
        <IconButton onClick={() => editor.chain().focus().toggleItalic().run()}>
          <FormatItalicIcon />
        </IconButton>
        <IconButton onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <FormatUnderlinedIcon />
        </IconButton>
        {/* Add more formatting options as needed */}
      </StyledToolbar>
      <EditorContent editor={editor} style={{ flexGrow: 1, padding: 16, overflowY: 'auto' }} />
    </StyledPaper>
  );
};

export default TiptapEditor;