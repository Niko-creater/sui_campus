import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ThumbsDown, 
  MessageCircle, 
  Coins, 
  TrendingUp, 
  Trash2, 
  Clock,
  User
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  gasSpent: number;
  reputation: number;
}

interface Comment {
  id: string;
  authorId: string;
  postId: string;
  content: string;
  timestamp: number;
  tips: number;
}

interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  timestamp: number;
  tips: number;
  downvotes: number;
  gasSpent: number;
  comments: Comment[];
  votesForDeletion: number;
  votesForPromotion: number;
  isPromoted: boolean;
}

interface PostCardProps {
  post: Post;
  author?: User;
  currentUser: User | null;
  onTip: (postId: string, amount: number) => void;
  onDownvote: (postId: string) => void;
  onComment: (postId: string, content: string) => boolean;
  onVotePromotion?: (postId: string) => void;
  onVoteDeletion?: (postId: string) => void;
}

const DOWNVOTE_GAS_FEE = 5;
const COMMENT_GAS_FEE = 3;

export function PostCard({ 
  post, 
  author, 
  currentUser, 
  onTip, 
  onDownvote, 
  onComment,
  onVotePromotion,
  onVoteDeletion
}: PostCardProps) {
  const [tipAmount, setTipAmount] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const handleTip = () => {
    if (!currentUser) return;
    const amount = parseInt(tipAmount);
    if (amount > 0 && amount <= currentUser.balance) {
      onTip(post.id, amount);
      setTipAmount('');
    }
  };

  const handleDownvote = () => {
    if (!currentUser || currentUser.balance < DOWNVOTE_GAS_FEE) return;
    onDownvote(post.id);
  };

  const handleComment = () => {
    if (!currentUser) return;
    if (commentContent.trim() && currentUser.balance >= COMMENT_GAS_FEE) {
      const success = onComment(post.id, commentContent.trim());
      if (success) {
        setCommentContent('');
      }
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

  return (
    <Card className={`p-6 ${post.isPromoted ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg' : 'bg-gradient-to-r from-white to-indigo-50 border-indigo-100'} hover:shadow-lg transition-shadow`}>
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          {post.category}
        </Badge>
        {post.isPromoted && (
          <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 shadow-sm">
            <TrendingUp className="h-3 w-3 mr-1" />
            Promoted Post
          </Badge>
        )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{author?.username || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(post.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Badge variant="outline">
            <Coins className="h-3 w-3 mr-1" />
            {post.tips} tips
          </Badge>
          {post.downvotes > 0 && (
            <Badge variant="destructive">
              <ThumbsDown className="h-3 w-3 mr-1" />
              {post.downvotes}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        {currentUser ? (
          <>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Tip amount"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-24"
                min="1"
                max={currentUser.balance}
              />
              <Button
                onClick={handleTip}
                disabled={!tipAmount || parseInt(tipAmount) <= 0 || parseInt(tipAmount) > currentUser.balance}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
              >
                <Coins className="h-4 w-4 mr-1" />
                Tip
              </Button>
            </div>

            <Button
              onClick={handleDownvote}
              variant="outline"
              size="sm"
              disabled={currentUser.balance < DOWNVOTE_GAS_FEE}
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Downvote ({DOWNVOTE_GAS_FEE})
            </Button>

            {onVotePromotion && (
              <Button
                onClick={() => onVotePromotion(post.id)}
                variant="outline"
                size="sm"
                disabled={currentUser.balance < 15 || post.isPromoted}
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Promote (15)
              </Button>
            )}

            {onVoteDeletion && currentUser.id !== post.authorId && (
              <Button
                onClick={() => onVoteDeletion(post.id)}
                variant="outline"
                size="sm"
                disabled={currentUser.balance < 20}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete (20)
              </Button>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500">
            Login to tip, vote and interact
          </div>
        )}

        <Button
          onClick={() => setShowComments(!showComments)}
          variant="outline"
          size="sm"
          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Reviews ({post.comments.length})
        </Button>
      </div>

      {showComments && (
        <>
          <Separator className="my-4" />
          
          <div className="space-y-4">
            {currentUser ? (
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a review..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment();
                    }
                  }}
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentContent.trim() || currentUser.balance < COMMENT_GAS_FEE}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  Review ({COMMENT_GAS_FEE})
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border border-indigo-100">
                Login to review posts
              </div>
            )}

            {post.comments.length > 0 && (
              <div className="space-y-3">
                {post.comments.map((comment) => {
                  const commentAuthor = comment.authorId; // In a real app, you'd look up the user
                  return (
                    <div key={comment.id} className="bg-gradient-to-r from-white to-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          <span>User {comment.authorId.slice(-8)}</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(comment.timestamp)}</span>
                        </div>
                        {comment.tips > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Coins className="h-3 w-3 mr-1" />
                            {comment.tips}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Gas spent: {post.gasSpent} tokens</span>
          <div className="flex space-x-4">
            <span>Deletion votes: {post.votesForDeletion}</span>
            <span>Promotion votes: {post.votesForPromotion}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}