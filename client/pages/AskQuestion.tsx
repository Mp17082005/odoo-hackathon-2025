import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import RichTextEditor from "@/components/RichTextEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CreateQuestionRequest, Question } from "@shared/api";
import { fetchWithAuth } from "@/lib/auth";

export default function AskQuestion() {
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  if (!hasPermission("post_question")) {
    toast({
      variant: "destructive",
      title: "Permission Denied",
      description: "You don't have permission to ask questions.",
    });
    navigate("/");
    return null;
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in both title and description.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreateQuestionRequest = {
        title: title.trim(),
        description: description.trim(),
        tags,
      };

      const response = await fetchWithAuth("/api/questions", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create question: ${response.statusText}`);
      }

      const newQuestion: Question = await response.json();

      toast({
        title: "Question Posted!",
        description: "Your question has been published successfully.",
      });

      // Navigate to the new question
      navigate(`/questions/${newQuestion.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to post question. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Ask a Question
          </h1>
          <p className="text-muted-foreground">
            Get help from the community by asking a clear, detailed question.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </Label>
              <p className="text-xs text-muted-foreground">
                Be specific and imagine you're asking a question to another
                person.
              </p>
              <Input
                id="title"
                placeholder="e.g. How do I center a div with CSS?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-border"
                required
              />
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-3">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </Label>
              <p className="text-xs text-muted-foreground">
                Provide all the details someone would need to answer your
                question. Use the formatting tools to make your question clear.
              </p>

              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your question in detail. Include what you've tried and what you expect to happen."
                minHeight="200px"
              />
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-3">
              <Label
                htmlFor="tags"
                className="text-sm font-medium text-foreground"
              >
                Tags
              </Label>
              <p className="text-xs text-muted-foreground">
                Add up to 5 tags to help people find your question. Press Enter
                or comma to add.
              </p>

              {/* Tag Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-primary/20 text-primary border-primary/30 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Input
                id="tags"
                placeholder="e.g. react, css, javascript"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-background border-border"
                disabled={tags.length >= 5}
              />

              {tags.length >= 5 && (
                <p className="text-xs text-destructive">
                  Maximum of 5 tags allowed
                </p>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!title.trim() || !description.trim() || isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            >
              {isSubmitting ? "Publishing..." : "Submit"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
