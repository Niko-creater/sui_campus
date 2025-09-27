import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  User, 
  Coins, 
  Zap, 
  TrendingUp, 
  MessageCircle, 
  Calendar,
  Award,
  Users
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  balance: number;
  gasSpent: number;
  reputation: number;
  friends: string[];
  friendRequests: string[];
}

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const totalTokensEarned = 1000; // Initial balance - current balance + gas spent would give earned tokens
  const reputationLevel = Math.floor(user.reputation / 100) + 1;
  const reputationProgress = (user.reputation % 100);

  const stats = [
    {
      label: 'Current Balance',
      value: user.balance,
      icon: Coins,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Gas Spent',
      value: user.gasSpent,
      icon: Zap,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: 'Reputation',
      value: user.reputation,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Level',
      value: reputationLevel,
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Friends',
      value: user.friends?.length || 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-gray-600">Community Member</p>
            <Badge variant="outline" className="mt-1">
              Level {reputationLevel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`p-4 rounded-lg ${stat.bg}`}>
              <div className="flex items-center space-x-2 mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reputation Progress</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Level {reputationLevel}</span>
            <span>Level {reputationLevel + 1}</span>
          </div>
          <Progress value={reputationProgress} className="h-3" />
          <p className="text-sm text-gray-600 text-center">
            {100 - reputationProgress} more reputation points to reach Level {reputationLevel + 1}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>Total Gas Spent</span>
            </div>
            <Badge variant="outline">{user.gasSpent} tokens</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Coins className="h-5 w-5 text-green-600" />
              <span>Starting Balance</span>
            </div>
            <Badge variant="outline">1000 tokens</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Tokens Earned</span>
            </div>
            <Badge variant="outline">{Math.max(0, user.balance + user.gasSpent - 1000)} tokens</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">How to Earn More</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
            <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Create Quality Posts</p>
              <p className="text-sm text-blue-600">Write valuable content that others want to tip</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
            <Coins className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Receive Tips</p>
              <p className="text-sm text-green-600">Other users tip posts they find valuable</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 border-l-4 border-purple-500 bg-purple-50">
            <Award className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-800">Build Reputation</p>
              <p className="text-sm text-purple-600">Consistent engagement increases your reputation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}