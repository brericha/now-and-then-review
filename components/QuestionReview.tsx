'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, Menu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Question {
  month: number;
  day_of_month: number;
  question: string;
}

interface Response {
  liked: boolean;
  comment?: string;
}

interface Responses {
  [key: number]: Response;
}

interface FeedbackItem {
  month: number;
  day_of_month: number;
  question: string;
  liked: boolean;
  comment: string;
}

const QuestionReview = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [comment, setComment] = useState('');
  const [jumpToDate, setJumpToDate] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  // Load existing comment when currentIndex changes
  useEffect(() => {
    const currentResponse = responses[currentIndex];
    setComment(currentResponse?.comment || '');
  }, [currentIndex, responses]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/questions.json');
        const data = await response.json();
        setQuestions(data);
        const savedResponses = localStorage.getItem('questionResponses');
        if (savedResponses) {
          setResponses(JSON.parse(savedResponses));
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    };
    loadQuestions();
  }, []);

  const handleVote = (liked: boolean) => {
    const updatedResponses = {
      ...responses,
      [currentIndex]: {
        ...responses[currentIndex],
        liked,
        comment
      }
    };
    setResponses(updatedResponses);
    localStorage.setItem('questionResponses', JSON.stringify(updatedResponses));
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setComment('');
    }
  };

  const jumpToFirstUnanswered = () => {
    const firstUnanswered = questions.findIndex((_, index) => !responses[index]);
    if (firstUnanswered !== -1) {
      setCurrentIndex(firstUnanswered);
    }
  };

  const jumpToQuestion = (dateStr: string) => {
    const [month, day] = dateStr.split('-').map(num => parseInt(num));
    const questionIndex = questions.findIndex(q => 
      q.month === month && q.day_of_month === day
    );
    if (questionIndex !== -1) {
      setCurrentIndex(questionIndex);
      setJumpToDate('');
    }
  };

  function exportResults() {
    const feedbackNeeded = questions.reduce<FeedbackItem[]>((acc, question, index) => {
      const response = responses[index];
      if (response && (response.liked === false || response.comment)) {
        acc.push({
          month: question.month,
          day_of_month: question.day_of_month,
          question: question.question,
          liked: response.liked,
          comment: response.comment || ''
        });
      }
      return acc;
    }, []);

    if (feedbackNeeded.length === 0) {
      alert('No questions with dislikes or comments to export.');
      return;
    }

    const header = ['month', 'day_of_month', 'question', 'response', 'comment'];
    const rows = feedbackNeeded.map(item => [
      item.month,
      item.day_of_month,
      item.question,
      item.liked ? 'Like' : 'Dislike',
      item.comment
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map(row => 
        row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'question_feedback.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const progressPercentage = (Object.keys(responses).length / questions.length) * 100;

  if (!questions.length) {
    return <div className="p-4">Loading questions...</div>;
  }

  const currentQuestion = questions[currentIndex];
  const currentResponse = responses[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Now & Then Question Review</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            className="sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <Card className={`mb-4 ${!showInstructions && 'hidden sm:block'}`}>
          <CardContent className="pt-4 sm:pt-6">
            <h2 className="font-semibold mb-2">How to Review:</h2>
            <ol className="space-y-1 sm:space-y-2 mb-4 text-sm sm:text-base">
              <li>1. Read each question</li>
              <li>2. Add optional comments for suggestions</li>
              <li>3. Click 'Like' if the question is good</li>
              <li>4. Click 'Dislike' if it needs improvement</li>
              <li>5. Export and send feedback to Ben when done</li>
            </ol>
            <p className="text-sm text-gray-600">
              Some questions are time-of-year relevant. Use MM-DD format to jump to dates. Use Next to jump to next unreviewed question.
            </p>
            <br />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(false)}
              className="sm:hidden">
                Got it!
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="text"
                placeholder="MM-DD"
                value={jumpToDate}
                onChange={(e) => setJumpToDate(e.target.value)}
                className="w-20 sm:w-24"
              />
              <Button 
                variant="outline"
                size="sm"
                onClick={() => jumpToQuestion(jumpToDate)}
              >
                Jump
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={jumpToFirstUnanswered}
                className="whitespace-nowrap"
              >
                Next
              </Button>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            {currentQuestion.month}/{currentQuestion.day_of_month}
          </h2>
          
          <p className="text-base sm:text-lg mb-4 sm:mb-6">{currentQuestion.question}</p>

          <div className="flex flex-col gap-3 sm:gap-4">
            <Input
              placeholder="Optional comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-2 sm:mb-4"
            />

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Button
                variant={currentResponse?.liked === false ? "destructive" : "outline"}
                className="h-12 sm:h-10"
                onClick={() => handleVote(false)}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Dislike
              </Button>
              <Button
                variant={currentResponse?.liked === true ? "default" : "outline"}
                className="h-12 sm:h-10"
                onClick={() => handleVote(true)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Like
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex justify-between w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 sm:flex-none"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-full sm:flex-1 sm:mx-4">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between sm:justify-center items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% Done
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
              onClick={() => {
                if (window.confirm('Reset all progress?')) {
                  setResponses({});
                  setCurrentIndex(0);
                  setComment('');
                  localStorage.removeItem('questionResponses');
                }
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {progressPercentage === 100 && (
        <div className="mt-4 sm:mt-6">
          <Alert>
            <AlertDescription>
              All questions reviewed! Export questions that need attention.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={exportResults}
            className="w-full mt-4"
          >
            Export Feedback
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionReview;