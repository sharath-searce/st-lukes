import React, { useRef, useEffect, useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TiptapEditorUI from "./DoctorInput";
import MedicalDataRenderer from "./tasks_list";
import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";

function parsePrescriptionData(inputString) {
  try {
    const jsonStartIndex = inputString.indexOf("{");
    const jsonEndIndex = inputString.lastIndexOf("}");

    if (
      jsonStartIndex === -1 ||
      jsonEndIndex === -1 ||
      jsonStartIndex >= jsonEndIndex
    ) {
      console.error("Error: Could not find valid JSON within the input string.");
      return null;
    }

    const jsonString = inputString.substring(jsonStartIndex, jsonEndIndex + 1);
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

const TiptapEditorWrapper = () => {
  const debounceRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medicalData, setMedicalData] = useState({});
  const [highlightedTerms, setHighlightedTerms] = useState([]);

  const highlightText = (terms) => {
    if (!editor) return;
  
    // Clear all existing highlights first
    editor.commands.unsetHighlight();
  
    if (!terms || terms.length === 0) return;
  
    let transaction = editor.state.tr;
    let hasChanges = false;
  
    terms.forEach(term => {
      if (!term.trim()) return;
  
      const searchTerm = term.toLowerCase();
      const textContent = editor.getText().toLowerCase();
      let pos = 0;
  
      while (pos < textContent.length) {
        const index = textContent.indexOf(searchTerm, pos);
        if (index === -1) break;
  
        // Calculate positions in the text
        const fromPos = index;
        const toPos = index + term.length; // This now correctly includes the last character
  
        // Convert to document positions
        const resolvedFrom = editor.state.doc.resolve(fromPos);
        const resolvedTo = editor.state.doc.resolve(toPos);
  
        // Add highlight mark
        transaction.addMark(
          resolvedFrom.pos,
          resolvedTo.pos,
          editor.schema.marks.highlight.create({ color: '#FFFB8F' })
        );
  
        pos = toPos;
        hasChanges = true;
      }
    });
  
    if (hasChanges) {
      editor.view.dispatch(transaction);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlight',
        },
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        setIsProcessing(true);
        const content = editor.getText();
        console.log({content});
        

        // Mock highlight terms - replace with your actual terms
        // const mockHighlightTerms = ["aspirin", "I am batman", "mg"];
        // setHighlightedTerms(mockHighlightTerms);
        
        try {
          const res = await fetch("http://localhost:3000/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input_value: content,
            }),
          });

          if (!res.ok) throw new Error("Network response was not ok");

          const data = await res.json();
          console.log(data);
          const parsedData = parsePrescriptionData(
            data.outputs[0].outputs[0].messages[0].message
          );
          setMedicalData(parsedData);

          
          // Extract terms to highlight from your data if needed
          const termsToHighlight = parsedData.unparsed || [];
          setHighlightedTerms(termsToHighlight);
        } catch (err) {
          console.error("Failed to fetch medical data:", err);
          setMedicalData(null);
        } finally {
          setIsProcessing(false);
        }
      }, 2000);
    },
  });

  console.log({medicalData, highlightedTerms});
  

  // Apply highlighting when highlightedTerms changes
  useEffect(() => {
    if (editor && highlightedTerms.length > 0) {
      highlightText(highlightedTerms);
    }
  }, [highlightedTerms, editor]);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Grid container spacing={2}>
      {/* Left: Doctor's Notes */}
      <Grid item xs={12} sm={6} sx={{ height: "90vh" }}>
        <Box
          elevation={2}
          sx={{
            p: { xs: 1, sm: 2 },
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box
            sx={{ display: "flex", alignItems: "center", mb: 1, flexShrink: 0 }}
            px={2}
          >
            <NotesIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">Doctor's Notes</Typography>
            <Box sx={{ ml: "auto", pr: 2 }}>
              {isProcessing && <CircularProgress size={20} />}
            </Box>
          </Box>

          {/* Tiptap Editor UI */}
          <TiptapEditorUI editor={editor} />
        </Box>
      </Grid>

      {/* Right: Processed Medical Tasks */}
      <Grid item xs={12} sm={6} sx={{}}>
        <Box
          elevation={2}
          sx={{
            p: { xs: 1, sm: 2 },
            height: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              flexShrink: 0,
              position: "sticky",
            }}
            px={2}
          >
            <NotesIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">Doctor's Orders</Typography>
          </Box>
          <Box
            sx={{
              maxHeight: "85vh",
              minWidth:"47vw"
            }}
          >
            <MedicalDataRenderer data={medicalData} />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default TiptapEditorWrapper;