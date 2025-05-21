import React, { useState, useEffect, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// --- Tiptap/ProseMirror Imports for Plugin ---
import { Extension } from '@tiptap/core'; // Import Tiptap Extension
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import Fuse from "fuse.js";

// MUI Components
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  ListItemIcon,
  CircularProgress,
  useTheme,
  GlobalStyles,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import ChecklistIcon from "@mui/icons-material/Checklist";
import HealingIcon from "@mui/icons-material/Healing";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

// --- Config Data ---

// Mock Medicine List
const mockMedicineList = [
  { name: "Aspirin", commonDosages: ["81mg", "100mg", "325mg"] },
  { name: "Paracetamol", commonDosages: ["500mg", "650mg", "1000mg"] },
  { name: "Amoxicillin", commonDosages: ["250mg", "500mg", "875mg"] },
  { name: "Metformin", commonDosages: ["500mg", "850mg", "1000mg"] },
  { name: "Lisinopril", commonDosages: ["5mg", "10mg", "20mg"] },
  { name: "Atorvastatin", commonDosages: ["10mg", "20mg", "40mg", "80mg"] },
  { name: "Ibuprofen", commonDosages: ["200mg", "400mg", "600mg", "800mg"] },
  { name: "Omeprazole", commonDosages: ["20mg", "40mg"] },
  { name: "Simvastatin", commonDosages: ["10mg", "20mg", "40mg"] },
  { name: "Levothyroxine", commonDosages: ["25mcg", "50mcg", "100mcg"] },
  // Add your full list here
];

// Configuration for Keywords
const keywordConfig = {
  fever: {
    tasks: [
      "Check patient temperature regularly.",
      "Administer antipyretics if ordered.",
    ],
  },
  pain: {
    tasks: [
      "Assess pain level (scale 1-10).",
      "Administer pain medication as prescribed.",
      "Consider non-pharmacological pain relief methods.",
    ],
  },
  cough: {
    tasks: [
      "Assess respiratory status.",
      "Encourage fluid intake.",
      "Administer cough suppressants/expectorants if ordered.",
    ],
  },
  "shortness of breath": {
    tasks: [
      "Assess SpO2 levels.",
      "Administer oxygen if prescribed.",
      "Position patient for optimal breathing (e.g., Fowler's).",
      "Notify physician immediately if worsening.",
    ],
  },
  "administer medication": {
    tasks: [
      "Verify medication order (5 Rights).",
      "Prepare and administer medication.",
      "Document administration.",
    ],
  },
  "check vital signs": {
    tasks: [
      "Measure BP, HR, RR, Temp, SpO2.",
      "Record vital signs.",
      "Report any abnormal findings.",
    ],
  },
  "wound care": {
    tasks: [
      "Assess wound condition.",
      "Perform dressing change using sterile technique.",
      "Document wound assessment and care provided.",
    ],
  },
  // Add any other keywords and their tasks
};

// Fuse Options
const fuseOptions = {
  includeScore: true,
  keys: ["name"],
  threshold: 0.4, // Lower value means stricter match
};

// --- Highlight Styles ---
const highlightStyles = (theme) => ({
  ".highlight-unmatched": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 165, 0, 0.2)" // Amber/Orange tint for dark mode
        : "rgba(255, 165, 0, 0.15)", // Amber/Orange tint for light mode
    boxDecorationBreak: "clone", // Ensures background wraps correctly on line breaks
    WebkitBoxDecorationBreak: "clone",
    borderRadius: "3px", // Subtle rounding
  },
});


// --- Sentence Finder Function ---
const findSentences = (doc) => {
    const sentences = [];
    let currentSentenceStart = 1; // ProseMirror positions are 1-based within the doc

    // Iterate through all nodes in the document
    doc.descendants((node, pos) => {
        // Handle block nodes (like paragraphs) to ensure sentences don't cross them incorrectly
        if (node.isBlock && pos > 0) {
             // If we were tracking a sentence, end it before the block node starts
             if (currentSentenceStart < pos) {
                const textInBetween = doc.textBetween(currentSentenceStart, pos, ' ').trim();
                if(textInBetween.length > 0){
                   sentences.push({ from: currentSentenceStart, to: pos });
                }
             }
            // Start the next potential sentence after this block node's opening tag
            currentSentenceStart = pos + 1;
        }

        // Process text nodes to find sentence endings
        if (!node.isText) {
            return true; // Continue descending if not a text node
        }

        const text = node.text;
        if (!text) return false; // Stop descending if empty text node

        // Regex to find sentence-ending punctuation (. ! ?) followed by space or end of text
        const sentenceEndRegex = /([.!?])(\s+|$)/g;
        let match;
        while ((match = sentenceEndRegex.exec(text)) !== null) {
            // Calculate the end position *after* the punctuation mark
            const endPos = pos + match.index + match[1].length;
            // Ensure we have a valid sentence range
            if (endPos > currentSentenceStart) {
                 sentences.push({ from: currentSentenceStart, to: endPos });
            }
            // The next sentence starts after the punctuation and any trailing space
            currentSentenceStart = endPos + (match[2] ? match[2].length : 0);
        }
        return false; // Don't descend further into this text node's content
    });

    // After iterating, check if there's a remaining part of the document
    const docEnd = doc.content.size;
    if (currentSentenceStart < docEnd) {
        const remainingText = doc.textBetween(currentSentenceStart, docEnd, ' ').trim();
        if (remainingText.length > 0) {
            sentences.push({ from: currentSentenceStart, to: docEnd });
        }
    }
    return sentences;
};


// --- Tiptap Extension for Highlighting Sentences with NO Matches ---

const HighlightUnmatchedSentencesExtension = Extension.create({
    name: 'highlightUnmatchedSentences',

    // Define options that can be passed via .configure()
    addOptions() {
        return {
            fuseInstance: null,       // Expect a Fuse instance
            keywordConfigData: {},    // Expect the keyword config object
        };
    },

    // Add the ProseMirror plugin
    addProseMirrorPlugins() {
        const { fuseInstance, keywordConfigData } = this.options;

        if (!fuseInstance || !keywordConfigData) {
             console.error("HighlightUnmatchedSentencesExtension requires fuseInstance and keywordConfigData options!");
             return [];
        }

        const lowerCaseKeywords = new Set(Object.keys(keywordConfigData).map(k => k.toLowerCase()));

        // Helper function to check if a sentence contains any match
        const sentenceHasMatch = (sentenceText) => {
            if (!sentenceText.trim()) return false; // Ignore empty sentences

            // Tokenize words using Unicode properties for letters/numbers
            const words = sentenceText.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

            for (const word of words) {
                if (!word) continue;
                const lowerWord = word.toLowerCase();
                // Check keywords (case-insensitive)
                if (lowerCaseKeywords.has(lowerWord)) {
                    return true; // Found keyword match
                }
                // Check medicines via Fuse
                const results = fuseInstance.search(word);
                if (results.length > 0 && results[0].score <= fuseOptions.threshold) {
                    return true; // Found medicine match
                }
            }
            return false; // No match found for any word
        };

        // Return the ProseMirror plugin configuration
        return [
            new Plugin({
                key: new PluginKey('highlightUnmatchedSentences'),
                state: {
                    // Initialize decorations when the editor loads
                    init(_, { doc }) {
                        const sentences = findSentences(doc);
                        const decorations = [];
                        sentences.forEach(sentence => {
                            const sentenceText = doc.textBetween(sentence.from, sentence.to);
                            // Add decoration if sentence has NO match
                            if (!sentenceHasMatch(sentenceText)) {
                                decorations.push(
                                    Decoration.inline(sentence.from, sentence.to, {
                                        class: 'highlight-unmatched',
                                    })
                                );
                            }
                        });
                        return DecorationSet.create(doc, decorations);
                    },
                    // Apply changes and recalculate decorations
                    apply(tr, oldSet, oldState, newState) {
                        // Only recalculate if the document content changed
                        if (!tr.docChanged) {
                            return oldSet.map(tr.mapping, tr.doc);
                        }

                        // Recalculate decorations for the new document state
                        const doc = tr.doc;
                        const sentences = findSentences(doc);
                        const decorations = [];
                        sentences.forEach(sentence => {
                            const sentenceText = doc.textBetween(sentence.from, sentence.to);
                            // Add decoration if sentence has NO match
                            if (!sentenceHasMatch(sentenceText)) {
                                decorations.push(
                                    Decoration.inline(sentence.from, sentence.to, {
                                        class: 'highlight-unmatched',
                                    })
                                );
                            }
                        });
                        return DecorationSet.create(doc, decorations);
                    },
                },
                props: {
                    // Provide the decorations to the editor view
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            })
        ];
    },
});


// --- React Component ---
function DoctorNurseInterface() {
  const [nurseTasks, setNurseTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const theme = useTheme();

  // Memoize Fuse instance
  const fuse = useMemo(() => new Fuse(mockMedicineList, fuseOptions), []);

  // Setup Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
          // Configure StarterKit if needed (e.g., disable history, heading)
          // history: false,
          // heading: false,
      }),
      // Configure and use the custom highlighting extension
      HighlightUnmatchedSentencesExtension.configure({
          fuseInstance: fuse,
          keywordConfigData: keywordConfig,
      }),
    ],
    // Initial content for demonstration
    content: "<p>Patient presents with fever and headache. Prescribed Paracetamol 500mg. No signs of cough. Assess pain levels regularly. Check vital signs q4h. Needs wound care on left leg.</p><p>This sentence has no keywords or meds. This one also lacks matches.</p><p>Administer medication as needed.</p><p>asdf qwert zxcvb.</p>",
    // Handle updates for task generation (debounced)
    onUpdate: ({ editor }) => {
      setIsProcessing(true);
      // Clear previous debounce timer
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      // Set new debounce timer
      debounceTimeoutRef.current = setTimeout(() => {
          const doc = editor.state.doc;
          const text = doc.textContent;
          const tasks = new Set();

          // --- Task Generation Logic (using keywords and Fuse) ---
           const taskKeywords = Object.keys(keywordConfig);
           // Use first word of medicine name for broader initial matching in task generation
           const taskMeds = mockMedicineList.map((m) => m.name.split(" ")[0]);
           // Regex to find keywords OR potential medicine names for task generation
           const combinedRegexForTasks = new RegExp(
             `(?:\\b(${taskKeywords.join("|")})\\b)|(?:\\b(${taskMeds.join("|")})\\b[\\w\\s\\d]*)`, // Added word boundary \b for meds
             "gi"
           );

          const rawMatchesForTasks = Array.from(text.matchAll(combinedRegexForTasks));

          for (const match of rawMatchesForTasks) {
            const keywordMatch = match[1];
            const potentialMedMatch = match[2]; // Index depends on regex groups

            if (keywordMatch) {
                // Found a keyword match
                const keywordLower = keywordMatch.toLowerCase().trim();
                if (keywordConfig[keywordLower]?.tasks) {
                    keywordConfig[keywordLower].tasks.forEach((task) => tasks.add(task));
                }
            } else if (potentialMedMatch) {
                // Found a potential medicine name start
                const searchTerm = match[0].trim(); // Full text matched by the medicine part
                // Extract potential name part before numbers/units for Fuse search
                const namePart = searchTerm.split(/[\s\d]/)[0];

                if (namePart.length > 2) { // Avoid searching very short strings
                    const results = fuse.search(namePart); // Use Fuse for better matching
                    if (results.length > 0 && results[0].score <= fuseOptions.threshold) {
                        const matchedMedicine = results[0].item;
                        // Add a task related to the found medicine
                        tasks.add(
                        `Verify order for ${matchedMedicine.name} (found based on "${searchTerm}"). Check dosage.`
                        );
                    }
                }
            }
          }
          setNurseTasks(Array.from(tasks));
          // --- End Task Generation ---

          setIsProcessing(false);
      }, 700); // Debounce duration (700ms)
    },
  });

  // Cleanup debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  // --- Editor Styles ---
  const editorStyle = {
    border: `1px solid ${
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.23)" // Border color for dark mode
        : "rgba(0, 0, 0, 0.23)" // Border color for light mode
    }`,
    borderRadius: theme.shape.borderRadius,
    padding: "16.5px 14px", // Standard padding
    minHeight: "calc(85vh - 160px)", // Adjust height as needed
    maxHeight: "calc(85vh - 120px)", // Adjust height as needed
    overflowY: "auto", // Enable vertical scroll
    flexGrow: 1,
    cursor: "text",
    width:"48vw",
    backgroundColor: theme.palette.background.paper, // Use theme background
    "&:hover": { borderColor: theme.palette.text.primary }, // Border color on hover
    "&.is-focused": { // Styles when editor is focused
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
      padding: "15.5px 13px", // Adjust padding for thicker border
    },
    // ProseMirror specific styles
    ".ProseMirror": {
      outline: "none", // Remove default focus outline
      lineHeight: 1.6,
      height: "100%", // Ensure ProseMirror fills the container
      "& p": { margin: 0, marginBottom: '0.5em' }, // Basic paragraph spacing
      // Highlight styles are applied via the class from GlobalStyles
    },
  };


  // --- Component JSX ---
  return (
    <>
      {/* Apply global styles including the .highlight-unmatched class */}
      <GlobalStyles styles={highlightStyles(theme)} />
      <Grid container spacing={2} sx={{ height: "90vh", width: "100%" }}>
        {/* Doctor's Notes Column (Left) */}
        <Grid item xs={12} sm={6} sx={{ height: "100%", display: "flex" }}>
          <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, height: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 1, flexShrink: 0 }}>
              <NotesIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Doctor's Notes</Typography>
              {isProcessing && <CircularProgress size={20} sx={{ ml: "auto" }} />}
            </Box>
            {/* Editor Container */}
            <Box
              sx={editorStyle}
              className={editor?.isFocused ? "is-focused" : ""}
              onClick={() => editor?.chain().focus().run()} // Focus editor on click
            >
              <EditorContent editor={editor} />
            </Box>
          </Paper>
        </Grid>

        {/* Suggested Tasks Column (Right) */}
        <Grid item xs={12} sm={6} sx={{ height: "100%", display: "flex" }}>
           <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, height: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
             {/* Header */}
             <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexShrink: 0 }}>
               <ChecklistIcon sx={{ mr: 1 }} color="secondary" />
               <Typography variant="h6">Suggested Tasks</Typography>
             </Box>
             {/* Task List Area */}
             <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                {nurseTasks.length > 0 ? (
                    <List dense>
                    {nurseTasks.map((task, index) => {
                        // Determine icon based on task content
                        let IconComponent = HealingIcon; // Default icon
                        if (task.toLowerCase().includes("verify order for")) IconComponent = MedicalServicesIcon;
                        if (task.toLowerCase().includes("vital signs")) IconComponent = ChecklistIcon;
                        // Add more specific icons if needed
                        return (
                        <ListItem key={index} divider sx={{ py: 0.8 }}>
                            <ListItemIcon sx={{ minWidth: "auto", mr: 1.5 }}>
                                <IconComponent fontSize="small" color="action" />
                            </ListItemIcon>
                            <ListItemText primary={task} />
                        </ListItem>
                        );
                    })}
                    </List>
                ) : (
                    // Placeholder text when no tasks are generated
                    <Typography variant="body2" sx={{ color: "text.secondary", px: 1 }}>
                    {editor?.state.doc.textContent.trim()
                        ? "No tasks suggested based on current notes."
                        : "Enter doctor's notes to automatically generate suggested tasks."}
                    </Typography>
                )}
             </Box>
           </Paper>
        </Grid>
      </Grid>
    </>
  );
}

export default DoctorNurseInterface;
