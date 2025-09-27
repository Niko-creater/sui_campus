import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { CreatePost } from './components/CreatePost';
import { PostCard } from './components/PostCard';
import { EventCard } from './components/EventCard';
import { CreateEvent } from './components/CreateEvent';
import { UserProfile } from './components/UserProfile';
import { GasTracker } from './components/GasTracker';
import { Friends } from './components/Friends';
import { Coins, Users, Vote, Calendar, Home, User, LogIn } from 'lucide-react';

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

interface Comment {
  id: string;
  authorId: string;
  postId: string;
  content: string;
  timestamp: number;
  tips: number;
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

interface AdminVote {
  id: string;
  candidateId: string;
  votes: number;
  timestamp: number;
}

const INITIAL_BALANCE = 1000;
const POST_GAS_FEE = 10;
const DOWNVOTE_GAS_FEE = 5;
const COMMENT_GAS_FEE = 3;

const POST_CATEGORIES = {
  'Academics': [
    'Course Selection',
    'Study Groups & Tutoring',
    'Research & Labs'
  ],
  'Campus Life': [
    'Newcomers Q&A',
    'Campus Activities',
    'Associations & Societies',
    'Sports & Fitness'
  ],
  'Careers & Opportunities': [
    'Internships & Jobs',
    'Exchange & Study Abroad'
  ],
  'Marketplace & Living': [
    'Marketplace',
    'Housing & Roommates',
    'Lost & Found',
    'Transportation'
  ],
  'Meta': [
    'Tech Support',
    'Feedback & Feature Requests',
    'Off-topic / Social'
  ]
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [adminVotes, setAdminVotes] = useState<AdminVote[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Posts');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('forumUsers');
    const savedPosts = localStorage.getItem('forumPosts');
    const savedEvents = localStorage.getItem('forumEvents');
    const savedCurrentUser = localStorage.getItem('currentUser');
    const savedAdmin = localStorage.getItem('currentAdmin');

    // Migrate users to include friends and friendRequests if they don't have them
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers).map((user: any) => ({
        ...user,
        friends: user.friends || [],
        friendRequests: user.friendRequests || []
      }));
      setUsers(parsedUsers);
    }
    
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    
    // Migrate current user as well
    if (savedCurrentUser) {
      const parsedCurrentUser = JSON.parse(savedCurrentUser);
      setCurrentUser({
        ...parsedCurrentUser,
        friends: parsedCurrentUser.friends || [],
        friendRequests: parsedCurrentUser.friendRequests || []
      });
    }
    
    if (savedAdmin) setCurrentAdmin(JSON.parse(savedAdmin));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('forumUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('forumPosts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('forumEvents', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
  }, [currentAdmin]);

  const createAccount = (username: string, password: string) => {
    if (users.find(u => u.username === username)) {
      setLoginError('Username already exists');
      return false;
    }

    if (password.length < 4) {
      setLoginError('Password must be at least 4 characters');
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      balance: INITIAL_BALANCE,
      gasSpent: 0,
      reputation: 0,
      friends: [],
      friendRequests: []
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setIsLoginOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    return true;
  };

  const loginUser = (username: string, password: string) => {
    const user = users.find(u => u.username === username);
    if (!user) {
      setLoginError('User does not exist');
      return false;
    }

    if (user.password !== password) {
      setLoginError('Incorrect password');
      return false;
    }

    setCurrentUser(user);
    setIsLoginOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    return true;
  };

  const handleLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please enter username and password');
      return;
    }

    if (isLoginMode) {
      loginUser(loginUsername, loginPassword);
    } else {
      createAccount(loginUsername, loginPassword);
    }
  };

  const updateUserBalance = (userId: string, amount: number, gasSpent: number = 0) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          balance: user.balance + amount,
          gasSpent: user.gasSpent + gasSpent
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUsers.find(u => u.id === userId) || currentUser);
    }
  };

  const createPost = (title: string, content: string, category: string) => {
    if (!currentUser || currentUser.balance < POST_GAS_FEE) return false;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      title,
      content,
      category,
      timestamp: Date.now(),
      tips: 0,
      downvotes: 0,
      gasSpent: POST_GAS_FEE,
      comments: [],
      votesForDeletion: 0,
      votesForPromotion: 0,
      isPromoted: false
    };

    setPosts([newPost, ...posts]);
    updateUserBalance(currentUser.id, -POST_GAS_FEE, POST_GAS_FEE);
    return true;
  };

  const tipPost = (postId: string, amount: number) => {
    if (!currentUser || currentUser.balance < amount) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, tips: post.tips + amount };
      }
      return post;
    });

    setPosts(updatedPosts);
    updateUserBalance(currentUser.id, -amount);
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      updateUserBalance(post.authorId, amount);
    }
  };

  const downvotePost = (postId: string) => {
    if (!currentUser || currentUser.balance < DOWNVOTE_GAS_FEE) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, downvotes: post.downvotes + 1 };
      }
      return post;
    });

    setPosts(updatedPosts);
    updateUserBalance(currentUser.id, -DOWNVOTE_GAS_FEE, DOWNVOTE_GAS_FEE);
  };

  const addComment = (postId: string, content: string) => {
    if (!currentUser || currentUser.balance < COMMENT_GAS_FEE) return false;

    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      postId,
      content,
      timestamp: Date.now(),
      tips: 0
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });

    setPosts(updatedPosts);
    updateUserBalance(currentUser.id, -COMMENT_GAS_FEE, COMMENT_GAS_FEE);
    return true;
  };

  const createEvent = (title: string, description: string) => {
    if (!currentUser) return false;

    const newEvent: Event = {
      id: Date.now().toString(),
      creatorId: currentUser.id,
      title,
      description,
      timestamp: Date.now(),
      totalTips: 0,
      supporters: [],
      opposers: []
    };

    setEvents([newEvent, ...events]);
    return true;
  };

  const voteOnEvent = (eventId: string, amount: number, support: boolean) => {
    if (!currentUser || currentUser.balance < amount) return;

    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const vote = { userId: currentUser.id, amount };
        return {
          ...event,
          totalTips: event.totalTips + amount,
          supporters: support ? [...event.supporters, vote] : event.supporters,
          opposers: !support ? [...event.opposers, vote] : event.opposers
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    updateUserBalance(currentUser.id, -amount);
  };

  const sendFriendRequest = (targetUserId: string) => {
    if (!currentUser || currentUser.id === targetUserId) return;

    const updatedUsers = users.map(user => {
      if (user.id === targetUserId) {
        return {
          ...user,
          friendRequests: [...(user.friendRequests || []), currentUser.id]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
  };

  const acceptFriendRequest = (requesterId: string) => {
    if (!currentUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          friends: [...(user.friends || []), requesterId],
          friendRequests: (user.friendRequests || []).filter(id => id !== requesterId)
        };
      }
      if (user.id === requesterId) {
        return {
          ...user,
          friends: [...(user.friends || []), currentUser.id]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
    if (updatedCurrentUser) {
      setCurrentUser(updatedCurrentUser);
    }
  };

  const rejectFriendRequest = (requesterId: string) => {
    if (!currentUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          friendRequests: (user.friendRequests || []).filter(id => id !== requesterId)
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
    if (updatedCurrentUser) {
      setCurrentUser(updatedCurrentUser);
    }
  };

  const voteForPostPromotion = (postId: string) => {
    if (!currentUser || currentUser.balance < 15) return; // Higher cost for promotion vote

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newVotes = post.votesForPromotion + 1;
        return { 
          ...post, 
          votesForPromotion: newVotes,
          isPromoted: newVotes >= 3 // Promote if gets 3+ votes
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    updateUserBalance(currentUser.id, -15, 15);
  };

  const voteForPostDeletion = (postId: string) => {
    if (!currentUser || currentUser.balance < 20) return; // High cost for deletion vote

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newVotes = post.votesForDeletion + 1;
        return { 
          ...post, 
          votesForDeletion: newVotes
        };
      }
      return post;
    });

    // Remove post if it gets 5+ deletion votes
    const filteredPosts = updatedPosts.filter(post => 
      post.id !== postId || post.votesForDeletion < 5
    );

    setPosts(filteredPosts);
    updateUserBalance(currentUser.id, -20, 20);
  };

  const filteredAndSortedPosts = [...posts]
    .filter(post => selectedCategory === 'All Posts' || post.category === selectedCategory)
    .sort((a, b) => {
      // Always put promoted posts first
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      
      // Calculate post popularity score: tips weighted heavily, downvotes penalize, newer posts get slight boost
      const aAge = (Date.now() - a.timestamp) / 3600000; // Hours since posting
      const bAge = (Date.now() - b.timestamp) / 3600000;
      const aScore = a.tips * 3 - a.downvotes * 2 - aAge * 0.1; // Newer = higher score
      const bScore = b.tips * 3 - b.downvotes * 2 - bAge * 0.1;
      
      // Sort by score descending (higher score = more popular)
      if (Math.abs(aScore - bScore) > 1) {
        return bScore - aScore;
      }
      
      // If scores are similar, sort by timestamp (newer first)
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-indigo-600" />
              <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">EduForum</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <GasTracker user={currentUser} />
                  {(currentUser.friendRequests?.length || 0) > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('friends')}
                      className="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {currentUser.friendRequests?.length || 0}
                      </span>
                      Friends
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('currentUser');
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Dialog open={isLoginOpen} onOpenChange={(open: boolean) => {
                  setIsLoginOpen(open);
                  if (!open) {
                    setLoginError('');
                    setLoginUsername('');
                    setLoginPassword('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700">
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-white to-indigo-50">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Coins className="h-5 w-5 text-indigo-600" />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {isLoginMode ? 'Login to Account' : 'Create Account'}
                        </span>
                      </DialogTitle>
                      <DialogDescription>
                        {isLoginMode ? 'Login to your account to participate in the educational community' : 'Create a new account to start your journey in EduForum. Consider using your switch_edu_ID for easy identification.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      {loginError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{loginError}</p>
                        </div>
                      )}
                      <div>
                        <Input
                          placeholder={isLoginMode ? "Username" : "Username (consider using switch_edu_ID)"}
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="bg-white/70 border-indigo-200 focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleLogin();
                            }
                          }}
                          className="bg-white/70 border-indigo-200 focus:border-indigo-400"
                        />
                      </div>
                      <Button 
                        onClick={handleLogin} 
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        {isLoginMode ? 'Login' : 'Create Account'}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setLoginError('');
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {isLoginMode ? "Don't have an account? Create new account" : 'Already have an account? Login now'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        {isLoginMode ? 'Enter your username and password to login' : 'New accounts receive 1000 tokens starting balance'}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${currentUser ? 'grid-cols-5' : 'grid-cols-2'} bg-white/70 backdrop-blur-md shadow-lg border border-indigo-100`}>
            <TabsTrigger value="home" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </TabsTrigger>
            {currentUser && (
              <TabsTrigger value="create" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Vote className="h-4 w-4" />
                <span>Create Post</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="events" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calendar className="h-4 w-4" />
              <span>Events</span>
            </TabsTrigger>
            {currentUser && (
              <TabsTrigger value="friends" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Users className="h-4 w-4" />
                <span>Friends</span>
              </TabsTrigger>
            )}
            {currentUser && (
              <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-1/4 min-w-[300px]">
              <Card className="p-4 bg-gradient-to-br from-white to-indigo-50 border-indigo-100 sticky top-4">
                <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-4">
                  Post Categories
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategory('All Posts')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'All Posts'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'hover:bg-indigo-50'
                    }`}
                  >
                    All Posts
                  </button>
                  
                  {Object.entries(POST_CATEGORIES).map(([mainCategory, subCategories]) => (
                    <div key={mainCategory} className="space-y-1">
                      <h4 className="font-medium text-gray-800 px-3 py-1 bg-gray-100 rounded text-sm">
                        {mainCategory}
                      </h4>
                      {subCategories.map((subCategory) => (
                        <button
                          key={subCategory}
                          onClick={() => setSelectedCategory(subCategory)}
                          className={`w-full text-left px-4 py-1.5 rounded text-sm transition-colors ${
                            selectedCategory === subCategory
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                              : 'hover:bg-indigo-50 text-gray-700'
                          }`}
                        >
                          {subCategory}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {!currentUser && (
                <Card className="p-8 bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 border-0 shadow-xl">
                  <div className="text-center">
                    <div className="relative mb-4">
                      <Coins className="mx-auto h-12 w-12 text-indigo-600 animate-pulse" />
                      <div className="absolute inset-0 bg-indigo-400 opacity-20 rounded-full blur-xl"></div>
                    </div>
                    <h3 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-3">
                      Welcome to EduForum
                    </h3>
                    <p className="text-gray-700 mb-6 max-w-md mx-auto">
                      Browse posts and events, or login to participate in our educational community with gas fees and tipping mechanisms. Experience a blockchain-inspired social platform.
                    </p>
                    <Button 
                      onClick={() => setIsLoginOpen(true)} 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Join Community
                    </Button>
                  </div>
                </Card>
              )}
              
              <div className="flex justify-between items-center">
                <h2 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  {selectedCategory === 'All Posts' ? 'All Posts' : `${selectedCategory} Posts`}
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredAndSortedPosts.length} {filteredAndSortedPosts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              
              <div className="grid gap-6">
                {filteredAndSortedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    author={users.find(u => u.id === post.authorId)}
                    currentUser={currentUser}
                    onTip={tipPost}
                    onDownvote={downvotePost}
                    onComment={addComment}
                    onVotePromotion={voteForPostPromotion}
                    onVoteDeletion={voteForPostDeletion}
                  />
                ))}
                {filteredAndSortedPosts.length === 0 && (
                  <Card className="p-8 text-center bg-gradient-to-r from-gray-50 to-indigo-50 border-indigo-100">
                    <p className="text-gray-600">
                      {selectedCategory === 'All Posts' 
                        ? (currentUser ? "No posts yet. Create the first one!" : "No posts yet. Login to create the first post!")
                        : `No posts in ${selectedCategory} yet. ${currentUser ? 'Be the first to post!' : 'Login to create posts!'}`
                      }
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {currentUser && (
            <TabsContent value="create">
              <CreatePost onCreatePost={createPost} userBalance={currentUser.balance} categories={POST_CATEGORIES} />
            </TabsContent>
          )}

          <TabsContent value="events" className="space-y-6">
            {currentUser && <CreateEvent onCreateEvent={createEvent} />}
            <div className="grid gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  creator={users.find(u => u.id === event.creatorId)}
                  currentUser={currentUser}
                  onVote={voteOnEvent}
                />
              ))}
              {events.length === 0 && (
                <Card className="p-8 text-center bg-gradient-to-r from-gray-50 to-purple-50 border-purple-100">
                  <p className="text-gray-600">
                    {currentUser ? "No events yet. Create the first one!" : "No events yet. Login to create and vote on events!"}
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>



          {currentUser && (
            <TabsContent value="friends">
              <Friends 
                currentUser={currentUser}
                users={users}
                onSendFriendRequest={sendFriendRequest}
                onAcceptFriendRequest={acceptFriendRequest}
                onRejectFriendRequest={rejectFriendRequest}
              />
            </TabsContent>
          )}

          {currentUser && (
            <TabsContent value="profile">
              <UserProfile user={currentUser} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}