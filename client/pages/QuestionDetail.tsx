import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, Check } from "lucide-react";
import {
  Question,
  Answer,
  QuestionDetailResponse,
  CreateAnswerRequest,
} from "@shared/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import RichTextEditor from "@/components/RichTextEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch question and answers from API
  const fetchQuestionData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/questions/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setQuestion(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch question: ${response.statusText}`);
      }

      const data: QuestionDetailResponse = await response.json();
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load question. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionData();
  }, [id]);

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

  const handleVote = async (
    targetId: string,
    targetType: "question" | "answer",
    value: 1 | -1,
  ) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!hasPermission("vote")) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to vote.",
      });
      return;
    }

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId,
          targetType,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const result = await response.json();

      if (targetType === "question" && question) {
        setQuestion({ ...question, votes: result.votes });
      } else if (targetType === "answer") {
        setAnswers((prev) =>
          prev.map((answer) =>
            answer.id === targetId
              ? { ...answer, votes: result.votes }
              : answer,
          ),
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to vote. Please try again.",
      });
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!isAuthenticated || !question || question.author.id !== user?.id) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only the question author can accept answers.",
      });
      return;
    }

    try {
      const response = await fetch(`/api/answers/${answerId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to accept answer");
      }

      // Update local state
      setAnswers((prev) =>
        prev.map((answer) => ({
          ...answer,
          isAccepted: answer.id === answerId,
        })),
      );

      toast({
        title: "Answer Accepted",
        description: "The answer has been marked as accepted.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept answer. Please try again.",
      });
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!hasPermission("post_answer")) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to post answers.",
      });
      return;
    }

    if (!newAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please write an answer before submitting.",
      });
      return;
    }

    try {
      const requestData: CreateAnswerRequest = {
        questionId: id!,
        content: newAnswer.trim(),
      };

      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to post answer: ${response.statusText}`);
      }

      const newAnswerObj: Answer = await response.json();
      setAnswers((prev) => [...prev, newAnswerObj]);
      setNewAnswer("");

      // Update question answer count
      if (question) {
        setQuestion({
          ...question,
          answersCount: question.answersCount + 1,
        });
      }

      toast({
        title: "Answer Posted",
        description: "Your answer has been published successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to post answer. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-6"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Question not found</p>
            <Link to="/">
              <Button className="mt-4">Back to Questions</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            to="/"
            className="text-primary hover:text-primary/80 text-sm flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all questions
          </Link>
        </div>

        {/* Question */}
        <Card className="p-6 bg-card border-border mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Vote Section */}
            <div className="flex flex-row sm:flex-col items-center gap-2 min-w-[60px] justify-center sm:justify-start order-2 sm:order-1">
              <button
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={() => handleVote(question.id, "question", 1)}
                disabled={!isAuthenticated}
              >
                <ArrowUp
                  className={`h-6 w-6 transition-colors ${
                    isAuthenticated
                      ? "text-muted-foreground hover:text-primary"
                      : "text-muted-foreground/50"
                  }`}
                />
              </button>
              <span className="text-xl font-semibold text-foreground">
                {question.votes}
              </span>
              <button
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={() => handleVote(question.id, "question", -1)}
                disabled={!isAuthenticated}
              >
                <ArrowDown
                  className={`h-6 w-6 transition-colors ${
                    isAuthenticated
                      ? "text-muted-foreground hover:text-destructive"
                      : "text-muted-foreground/50"
                  }`}
                />
              </button>
            </div>

            {/* Question Content */}
            <div className="flex-1 order-1 sm:order-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 break-words">
                {question.title}
              </h1>

              <div className="prose prose-invert max-w-none mb-6">
                <div className="whitespace-pre-wrap text-muted-foreground break-words overflow-hidden">
                  {question.description}
                </div>
              </div>

              {/* Tags and Meta */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-muted text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground break-words">
                  asked by{" "}
                  <span className="text-primary">
                    {question.author.username}
                  </span>{" "}
                  {formatTimeAgo(question.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Answers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </h2>

          <div className="space-y-6">
            {answers.map((answer) => (
              <Card
                key={answer.id}
                className={`p-6 bg-card border-border ${
                  answer.isAccepted ? "border-primary/50" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Vote Section */}
                  <div className="flex flex-row sm:flex-col items-center gap-2 min-w-[60px] justify-center sm:justify-start order-2 sm:order-1">
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={() => handleVote(answer.id, "answer", 1)}
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
                      {answer.votes}
                    </span>
                    <button
                      className="p-1 hover:bg-muted rounded transition-colors"
                      onClick={() => handleVote(answer.id, "answer", -1)}
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
                    {answer.isAccepted ? (
                      <div className="mt-2 p-1 bg-primary/20 rounded">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      question &&
                      isAuthenticated &&
                      question.author.id === user?.id && (
                        <button
                          className="mt-2 p-1 hover:bg-primary/20 rounded transition-colors"
                          onClick={() => handleAcceptAnswer(answer.id)}
                          title="Accept this answer"
                        >
                          <Check className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        </button>
                      )
                    )}
                  </div>

                  {/* Answer Content */}
                  <div className="flex-1 order-1 sm:order-2 min-w-0">
                    <div className="prose prose-invert max-w-none mb-4">
                      <div className="whitespace-pre-wrap text-muted-foreground break-words overflow-hidden">
                        {answer.content}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground break-words">
                      answered by{" "}
                      <span className="text-primary">
                        {answer.author.username}
                      </span>{" "}
                      {formatTimeAgo(answer.createdAt)}
                      {answer.isAccepted && (
                        <Badge className="ml-2 bg-primary/20 text-primary">
                          Accepted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Add Answer Form */}
        {isAuthenticated ? (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Your Answer
            </h3>

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <RichTextEditor
                value={newAnswer}
                onChange={setNewAnswer}
                placeholder="Write your answer here... Be specific and provide examples if possible."
                minHeight="150px"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newAnswer.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Post Answer
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card className="p-6 bg-card border-border">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Want to answer this question?
              </h3>
              <p className="text-muted-foreground mb-4">
                Sign in to post your answer and help the community.
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
          </Card>
        )}
      </main>
    </div>
  );
}
