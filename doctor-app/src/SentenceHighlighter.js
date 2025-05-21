// src/SentenceHighlighter.js
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const SentenceHighlightPluginKey = new PluginKey('sentenceHighlight');

// Basic sentence splitter (can be improved for edge cases)
// This function finds potential sentence boundaries and returns their start/end positions.
const findSentences = (doc) => {
    const sentences = [];
    let currentPos = 1; // Start searching from position 1 (after the opening doc tag)
    const docEnd = doc.content.size;

    doc.descendants((node, pos) => {
        if (!node.isText) {
            return true; // Continue descending if not a text node
        }

        const text = node.text;
        if (!text) {
            return false; // Stop descending if empty text node
        }

        // Regex to find potential sentence endings (. ! ?) followed by space or end of text
        const sentenceEndRegex = /([.!?])(\s+|$)/g;
        let match;

        while ((match = sentenceEndRegex.exec(text)) !== null) {
            const endPos = pos + match.index + match[1].length; // Position *after* the punctuation

            // Basic check to avoid highlighting just punctuation after another block
            if (endPos > currentPos) {
                 sentences.push({
                    from: currentPos,
                    to: endPos,
                });
            }
            // Update start position for the next sentence
            currentPos = endPos + (match[2] ? match[2].length : 0); // Advance past the space too
        }
         // Handle the case where the last part of the text node doesn't end with punctuation
         // or if the loop didn't run at all for this node
         if (pos + text.length > currentPos && currentPos <= docEnd) {
            // If there's remaining text in this node that hasn't been marked as the end of a sentence,
            // consider it part of the current sentence segment ending at the node's end.
            // This is tricky because a sentence might span multiple nodes.
            // A simpler approach for decoration is to mark what we find.
            // Let's refine: the last found `currentPos` might be the start of the *next* sentence.
         }

        // Important: prevent descending into text nodes further
        return false;
    });

     // Check if there's a remaining segment from the last `currentPos` to the end of the doc
    if (currentPos < docEnd) {
       // Check if the content between currentPos and docEnd isn't just whitespace
       const remainingText = doc.textBetween(currentPos, docEnd, ' ');
       if (remainingText.trim().length > 0) {
            sentences.push({
                from: currentPos,
                to: docEnd,
            });
       }
    }


    // console.log("Found Sentences:", sentences);
    return sentences;
};


export const SentenceHighlighter = Extension.create({
    name: 'sentenceHighlighter',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: SentenceHighlightPluginKey,
                state: {
                    init(_, { doc }) {
                        const sentences = findSentences(doc);
                        const decorations = sentences.map(sentence =>
                            Decoration.inline(sentence.from, sentence.to, {
                                class: 'sentence-highlight',
                                // You could use style directly too:
                                // style: 'background-color: rgba(200, 255, 200, 0.5);'
                            })
                        );
                        return DecorationSet.create(doc, decorations);
                    },
                    apply(tr, oldSet, oldState, newState) {
                        // Only recalculate decorations if the document has changed
                        if (!tr.docChanged) {
                            // If only selection changed, map old decorations
                            return oldSet.map(tr.mapping, tr.doc);
                        }

                        const sentences = findSentences(tr.doc);
                        const decorations = sentences.map(sentence =>
                            Decoration.inline(sentence.from, sentence.to, {
                                class: 'sentence-highlight',
                            })
                        );
                        return DecorationSet.create(tr.doc, decorations);
                    },
                },
                props: {
                    decorations(state) {
                        // Provide the decorations to the editor view
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});