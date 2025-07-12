import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { Question, QuestionsResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch questions from API
  const fetchQuestions = async (search = "") => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        limit: "10",
        ...(search && { search }),
      });

      const response = await fetch(`/api/questions?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const data: QuestionsResponse = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch questions",
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchQuestions(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Questions are already filtered by the API when searching
  const filteredQuestions = questions;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleVote = async (questionId: string, value: 1 | -1) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!hasPermission("vote")) {
      return;
    }

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: questionId,
          targetType: "question",
          value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();

      // Update local state with new vote count
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, votes: result.votes } : q,
        ),
      );
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to vote. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            All Questions
          </h1>
          <div className="text-sm text-muted-foreground">
            {filteredQuestions.length} questions
          </div>
        </div>

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchQuestions(searchQuery)}>
              Try Again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 bg-card border-border">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <Card
                key={question.id}
                className="p-6 bg-card border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Vote Section */}
                  <div className="flex flex-row sm:flex-col items-center gap-2 min-w-[60px] sm:min-w-[60px] justify-center sm:justify-start">
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={() => handleVote(question.id, 1)}
                      disabled={!isAuthenticated}
                    >
                      <ArrowUp
                        className={`h-5 w-5 transition-colors ${
                          isAuthenticated
                            ? "text-muted-foreground hover:text-primary"
                            : "text-muted-foreground/50"
                        }`}
                      />
                    </button>
                    <span className="text-lg font-semibold text-foreground">
                      {question.votes}
                    </span>
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={() => handleVote(question.id, -1)}
                      disabled={!isAuthenticated}
                    >
                      <ArrowDown
                        className={`h-5 w-5 transition-colors ${
                          isAuthenticated
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-muted-foreground/50"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1">
                    <Link
                      to={`/questions/${question.id}`}
                      className="block group"
                    >
                      <h3 className="text-base sm:text-lg font-medium text-foreground group-hover:text-primary mb-2 transition-colors break-words">
                        {question.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 break-words">
                        {question.description}
                      </p>
                    </Link>

                    {/* Tags and Meta */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary cursor-pointer"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{question.answersCount}</span>
                        </div>
                        <div className="break-words">
                          asked by{" "}
                          <span className="text-primary">
                            {question.author.username}
                          </span>
                        </div>
                        <div className="whitespace-nowrap">
                          {formatTimeAgo(question.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No questions found matching your search."
                : "No questions yet."}
            </p>
            {isAuthenticated ? (
              <Link to="/ask">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Ask the First Question
                </Button>
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sign in to ask questions and participate in the community
                </p>
                <div className="flex gap-2 justify-center">
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
