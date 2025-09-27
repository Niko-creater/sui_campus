import React from 'react';
import { Badge } from './ui/badge';
import { Coins, Zap } from 'lucide-react';

interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  gasSpent: number;
  reputation: number;
}

interface GasTrackerProps {
  user: User;
}

export function GasTracker({ user }: GasTrackerProps) {
  const getBalanceColor = (balance: number) => {
    if (balance > 500) return 'text-emerald-600';
    if (balance > 100) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getBalanceBg = (balance: number) => {
    if (balance > 500) return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
    if (balance > 100) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    return 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200';
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`px-4 py-2 rounded-lg border ${getBalanceBg(user.balance)} shadow-sm`}>
        <div className="flex items-center space-x-2">
          <Coins className={`h-4 w-4 ${getBalanceColor(user.balance)}`} />
          <span className={`font-medium ${getBalanceColor(user.balance)}`}>
            {user.balance}
          </span>
        </div>
      </div>
      
      <Badge variant="outline" className="flex items-center space-x-1 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700">
        <Zap className="h-3 w-3" />
        <span>{user.gasSpent} Gas</span>
      </Badge>
    </div>
  );
}