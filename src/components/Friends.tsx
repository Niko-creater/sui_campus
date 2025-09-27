import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Users, 
  Search,
  Mail
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  gasSpent: number;
  reputation: number;
  friends: string[];
  friendRequests: string[];
}

interface FriendsProps {
  currentUser: User;
  users: User[];
  onSendFriendRequest: (targetUserId: string) => void;
  onAcceptFriendRequest: (requesterId: string) => void;
  onRejectFriendRequest: (requesterId: string) => void;
}

export function Friends({ 
  currentUser, 
  users, 
  onSendFriendRequest, 
  onAcceptFriendRequest, 
  onRejectFriendRequest 
}: FriendsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const friends = users.filter(user => (currentUser.friends || []).includes(user.id));
  const friendRequests = users.filter(user => (currentUser.friendRequests || []).includes(user.id));
  const searchResults = users.filter(user => 
    user.id !== currentUser.id &&
    !(currentUser.friends || []).includes(user.id) &&
    !(currentUser.friendRequests || []).includes(user.id) &&
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    searchTerm.trim() !== ''
  );

  return (
    <div className="space-y-6">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-white to-indigo-50 border-indigo-100">
          <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-indigo-600" />
            Friend Requests ({friendRequests.length})
          </h3>
          <div className="space-y-3">
            {friendRequests.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-indigo-50 rounded-lg border border-indigo-100">
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-600">Reputation: {user.reputation}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onAcceptFriendRequest(user.id)}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => onRejectFriendRequest(user.id)}
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Users */}
      <Card className="p-6 bg-gradient-to-br from-white to-indigo-50 border-indigo-100">
        <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2 text-indigo-600" />
          Find Friends
        </h3>
        <div className="space-y-4">
          <Input
            placeholder="Search users by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/70 border-indigo-200 focus:border-indigo-400"
          />
          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.slice(0, 5).map((user) => (
                <div key={user.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-indigo-50 rounded-lg border border-indigo-100">
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">Reputation: {user.reputation}</p>
                  </div>
                  <Button
                    onClick={() => onSendFriendRequest(user.id)}
                    size="sm"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Friends List */}
      <Card className="p-6 bg-gradient-to-br from-white to-indigo-50 border-indigo-100">
        <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-indigo-600" />
          My Friends ({friends.length})
        </h3>
        {friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-indigo-50 rounded-lg border border-indigo-100">
                <div>
                  <p className="font-medium text-gray-900">{friend.username}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Reputation: {friend.reputation}</span>
                    <span>Balance: {friend.balance}</span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Friend
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No friends yet. Search and add friends to build your network!</p>
          </div>
        )}
      </Card>
    </div>
  );
}