import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, User, Clock, Coins, ThumbsUp, ThumbsDown } from 'lucide-react';

interface User {
  id: string;
  username: string;
  balance: number;
  gasSpent: number;
  reputation: number;
}

interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  timestamp: number;
  totalTips: number;
  supporters: { userId: string; amount: number }[];
  opposers: { userId: string; amount: number }[];
}

interface EventCardProps {
  event: Event;
  creator?: User;
  currentUser: User | null;
  onVote: (eventId: string, amount: number, support: boolean) => void;
}

export function EventCard({ event, creator, currentUser, onVote }: EventCardProps) {
  const [voteAmount, setVoteAmount] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleVote = (support: boolean) => {
    if (!currentUser) return;
    const amount = parseInt(voteAmount);
    if (amount > 0 && amount <= currentUser.balance) {
      onVote(event.id, amount, support);
      setVoteAmount('');
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const supportTotal = event.supporters.reduce((sum, supporter) => sum + supporter.amount, 0);
  const opposeTotal = event.opposers.reduce((sum, opposer) => sum + opposer.amount, 0);
  const totalVotes = supportTotal + opposeTotal;
  
  const supportPercentage = totalVotes > 0 ? (supportTotal / totalVotes) * 100 : 0;
  const opposePercentage = totalVotes > 0 ? (opposeTotal / totalVotes) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h3 className="text-xl font-bold">{event.title}</h3>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{creator?.username || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(event.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <Badge variant="outline">
          <Coins className="h-3 w-3 mr-1" />
          {event.totalTips} total votes
        </Badge>
      </div>

      <p className="text-gray-700 mb-4">{event.description}</p>

      {totalVotes > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center space-x-1 text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span>Support: {supportTotal} tokens ({supportPercentage.toFixed(1)}%)</span>
            </span>
            <span className="flex items-center space-x-1 text-red-600">
              <ThumbsDown className="h-4 w-4" />
              <span>Oppose: {opposeTotal} tokens ({opposePercentage.toFixed(1)}%)</span>
            </span>
          </div>
          
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
              style={{ width: `${supportPercentage}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-300"
              style={{ width: `${opposePercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center mb-4">
        {currentUser ? (
          <>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Vote amount"
                value={voteAmount}
                onChange={(e) => setVoteAmount(e.target.value)}
                className="w-28"
                min="1"
                max={currentUser.balance}
              />
            </div>

            <Button
              onClick={() => handleVote(true)}
              disabled={!voteAmount || parseInt(voteAmount) <= 0 || parseInt(voteAmount) > currentUser.balance}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Support
            </Button>

            <Button
              onClick={() => handleVote(false)}
              disabled={!voteAmount || parseInt(voteAmount) <= 0 || parseInt(voteAmount) > currentUser.balance}
              size="sm"
              variant="destructive"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Oppose
            </Button>
          </>
        ) : (
          <div className="text-sm text-gray-500">
            Login to vote on events with your tokens
          </div>
        )}

        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          size="sm"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {showDetails && (
        <div className="border-t pt-4 space-y-4">
          {event.supporters.length > 0 && (
            <div>
              <h4 className="font-medium text-green-600 mb-2 flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Supporters ({event.supporters.length})
              </h4>
              <div className="space-y-1">
                {event.supporters.map((supporter, index) => (
                  <div key={index} className="flex justify-between text-sm bg-green-50 p-2 rounded">
                    <span>User {supporter.userId.slice(-8)}</span>
                    <span>{supporter.amount} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.opposers.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-2 flex items-center">
                <ThumbsDown className="h-4 w-4 mr-1" />
                Opposers ({event.opposers.length})
              </h4>
              <div className="space-y-1">
                {event.opposers.map((opposer, index) => (
                  <div key={index} className="flex justify-between text-sm bg-red-50 p-2 rounded">
                    <span>User {opposer.userId.slice(-8)}</span>
                    <span>{opposer.amount} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.supporters.length === 0 && event.opposers.length === 0 && (
            <p className="text-gray-500 text-center">No votes yet. Be the first to vote!</p>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>How voting works:</strong> Your vote weight is determined by the amount of tokens you stake. 
          The more tokens you contribute, the stronger your voice in the decision.
        </p>
      </div>
    </Card>
  );
}