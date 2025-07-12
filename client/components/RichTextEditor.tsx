import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const insertAtCursor = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText = selectedText || "text";
    const replacement = before + newText + after;

    const newValue =
      value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + newText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertAtCursor("**", "**");
        break;
      case "italic":
        insertAtCursor("_", "_");
        break;
      case "strikethrough":
        insertAtCursor("~~", "~~");
        break;
      case "code":
        insertAtCursor("`", "`");
        break;
      case "bullet":
        insertAtCursor("\n- ");
        break;
      case "numbered":
        insertAtCursor("\n1. ");
        break;
      case "alignLeft":
        insertAtCursor('\n<div style="text-align: left">\n', "\n</div>\n");
        break;
      case "alignCenter":
        insertAtCursor('\n<div style="text-align: center">\n', "\n</div>\n");
        break;
      case "alignRight":
        insertAtCursor('\n<div style="text-align: right">\n', "\n</div>\n");
        break;
    }
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      insertAtCursor(`[${linkText}](${linkUrl})`);
      setLinkUrl("");
      setLinkText("");
      setShowLinkDialog(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server and get back a URL
      const imageUrl = URL.createObjectURL(file);
      insertAtCursor(`![Image](${imageUrl})`);
    }
  };

  const commonEmojis = [
    "😀",
    "😂",
    "😍",
    "🤔",
    "👍",
    "👎",
    "❤️",
    "🎉",
    "😊",
    "😎",
    "🚀",
    "💻",
    "🔥",
    "⚡",
    "💡",
    "🎯",
  ];

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted rounded-md border border-border overflow-x-auto">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("strikethrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

        {/* Links and Code */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowLinkDialog(true)}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("code")}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("bullet")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("numbered")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("alignLeft")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("alignCenter")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => formatText("alignRight")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

        {/* Media */}
        <label htmlFor="image-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Upload Image"
            asChild
          >
            <span>
              <Image className="h-4 w-4" />
            </span>
          </Button>
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Emoji */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert Emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {showEmojiPicker && (
            <Card className="absolute top-full left-0 mt-1 p-2 bg-card border-border shadow-lg z-50">
              <div className="grid grid-cols-8 gap-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="p-1 hover:bg-muted rounded text-lg"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background border-border resize-none"
        style={{ minHeight }}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-medium mb-3">Insert Link</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-text" className="text-xs">
                Link Text
              </Label>
              <Input
                id="link-text"
                placeholder="Enter link text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="link-url" className="text-xs">
                URL
              </Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={insertLink}>
                Insert Link
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Markdown Help */}
      <div className="text-xs text-muted-foreground">
        <p>
          Supports Markdown: **bold**, _italic_, ~~strikethrough~~, `code`,
          [links](url), and more
        </p>
      </div>
    </div>
  );
}
