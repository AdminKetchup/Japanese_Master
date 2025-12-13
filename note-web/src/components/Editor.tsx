"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Heading1, Heading2, Code } from 'lucide-react';

const Editor = ({ content, onChange }: { content: string, onChange?: (html: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: 'Type something... or "/" for commands',
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[50vh]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    const ToolbarButton = ({ onClick, isActive, icon: Icon }: any) => (
        <button
            onClick={onClick}
            className={`p-2 rounded hover:bg-gray-200 transition ${isActive ? 'bg-gray-200 text-black' : 'text-gray-500'}`}
        >
            <Icon size={18} />
        </button>
    );

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-3 border-b border-gray-100 bg-gray-50 overflow-x-auto">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    icon={UnderlineIcon}
                />
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={Heading1}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                />
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    icon={Code}
                />
            </div>

            {/* Editor Area */}
            <div className="p-8 md:p-12 min-h-[500px] cursor-text" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default Editor;
