'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const QuestionReview = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [comment, setComment] = useState('');
  const [jumpToDate, setJumpToDate] = useState('');

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/questions.json');
        const data = await response.json();
        setQuestions(data);
        
        // Load saved responses from localStorage
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

  const handleVote = (liked) => {
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
    
    // Automatically move to next question after voting
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

  const jumpToQuestion = (dateStr) => {
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
    // First, collect all questions that need feedback
    const feedbackNeeded = questions.reduce((acc, question, index) => {
      const response = responses[index];
      // Check if there's a response and if it's either a dislike or has a comment
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

    // If no feedback needed, show alert
    if (feedbackNeeded.length === 0) {
      alert('No questions with dislikes or comments to export.');
      return;
    }

    // Create CSV content
    const header = ['Month', 'Day', 'Question', 'Response', 'Comment'];
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

    // Create and trigger download
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
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Now & Then Question Review Tool</h1>
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h2 className="font-semibold mb-2">How to Review:</h2>
            <ol className="space-y-2 mb-4">
              <li>1. Read each question</li>
              <li>2. Add optional comments for suggestions or concerns</li>
              <li>3. Click 'Like' if the question is good as is</li>
              <li>4. Click 'Dislike' if the question needs improvement</li>
              <li>5. Once you have reviewed all the questions, export your feedback and send them to Ben</li>
            </ol>
            <p>Keep in mind that some of the questions are relevant to the time of year they are being asked.</p><br />
            <p className="text-sm text-gray-600">
              You can jump to any date using the MM-DD format, or click "Next Unanswered" to find questions you haven't reviewed yet. Your progress is automatically saved, so you can return later to continue where you left off.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="MM-DD"
                value={jumpToDate}
                onChange={(e) => setJumpToDate(e.target.value)}
                className="w-24"
              />
              <Button 
                variant="outline" 
                onClick={() => jumpToQuestion(jumpToDate)}
              >
                Jump
              </Button>
              <Button 
                variant="outline"
                onClick={jumpToFirstUnanswered}
                className="whitespace-nowrap"
              >
                Next Unanswered
              </Button>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">
            {currentQuestion.month}/{currentQuestion.day_of_month}
          </h2>
          
          <p className="text-lg mb-6">{currentQuestion.question}</p>

          <div className="flex flex-col gap-4">
            <Input
              placeholder="Optional comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-4"
            />

            <div className="flex justify-between gap-4">
              <Button
                variant={currentResponse?.liked === false ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => handleVote(false)}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Dislike
              </Button>
              <Button
                variant={currentResponse?.liked === true ? "default" : "outline"}
                className="flex-1"
                onClick={() => handleVote(true)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Like
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
                  <div className="flex-1 mx-4">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-center items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% Complete
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              onClick={() => {
                if (window.confirm('Are you sure you want to start over? This will delete all your responses.')) {
                  setResponses({});
                  setCurrentIndex(0);
                  setComment('');
                  localStorage.removeItem('questionResponses');
                }
              }}
            >
              Reset Progress
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {progressPercentage === 100 && (
        <div className="mt-6">
          <Alert>
            <AlertDescription>
              You've reviewed all questions! You can now export questions that need attention.
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