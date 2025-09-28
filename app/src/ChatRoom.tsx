import { useState } from "react";
import { 
  Card, 
  Flex, 
  Heading, 
  Text, 
  TextField, 
  Button, 
  Badge, 
  Avatar,
  ScrollArea,
  Separator,
  Tabs
} from "@radix-ui/themes";

interface ChatMessage {
  id: string;
  author: string;
  authorNickname: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  isOnline: boolean;
  isTyping?: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  type: 'general' | 'tech' | 'random' | 'private';
}

interface OnlineUser {
  id: string;
  nickname: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: string;
}

export function ChatRoom() {
  const [activeRoom, setActiveRoom] = useState('general');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock data for chat rooms
  const chatRooms: ChatRoom[] = [
    {
      id: 'general',
      name: '💬 General Chat',
      description: 'General discussions and casual talk',
      memberCount: 24,
      isOnline: true,
      lastMessage: 'Hey everyone! How\'s your day going?',
      lastMessageTime: '2m ago',
      unreadCount: 3,
      type: 'general'
    },
    {
      id: 'tech',
      name: '⚡ Tech Talk',
      description: 'Technical discussions about Sui, Move, and blockchain',
      memberCount: 18,
      isOnline: true,
      lastMessage: 'Anyone working on Move smart contracts?',
      lastMessageTime: '5m ago',
      unreadCount: 0,
      type: 'tech'
    },
    {
      id: 'random',
      name: '🎲 Random',
      description: 'Random topics and off-topic discussions',
      memberCount: 12,
      isOnline: false,
      lastMessage: 'This is so random! 😄',
      lastMessageTime: '1h ago',
      unreadCount: 1,
      type: 'random'
    },
    {
      id: 'private',
      name: '🔒 Private Room',
      description: 'Invite-only room for special discussions',
      memberCount: 5,
      isOnline: true,
      lastMessage: 'Meeting at 3 PM today',
      lastMessageTime: '30m ago',
      unreadCount: 0,
      type: 'private'
    }
  ];

  // Mock data for messages
  const messages: ChatMessage[] = [
    {
      id: '1',
      author: '0x1234...5678',
      authorNickname: 'Alice',
      content: 'Hey everyone! How\'s your day going?',
      timestamp: '2 minutes ago',
      type: 'text',
      isOnline: true
    },
    {
      id: '2',
      author: '0xabcd...efgh',
      authorNickname: 'Bob',
      content: 'Great! Just finished working on my Sui project 🚀',
      timestamp: '1 minute ago',
      type: 'text',
      isOnline: true
    },
    {
      id: '3',
      author: '0x9876...5432',
      authorNickname: 'Charlie',
      content: 'That\'s awesome! What kind of project?',
      timestamp: '30 seconds ago',
      type: 'text',
      isOnline: true,
      isTyping: true
    },
    {
      id: '4',
      author: 'system',
      authorNickname: 'System',
      content: 'David joined the chat',
      timestamp: '1 minute ago',
      type: 'system',
      isOnline: false
    }
  ];

  // Mock data for online users
  const onlineUsers: OnlineUser[] = [
    {
      id: '1',
      nickname: 'Alice',
      status: 'online',
      lastSeen: 'now'
    },
    {
      id: '2',
      nickname: 'Bob',
      status: 'online',
      lastSeen: 'now'
    },
    {
      id: '3',
      nickname: 'Charlie',
      status: 'typing',
      lastSeen: 'now'
    },
    {
      id: '4',
      nickname: 'David',
      status: 'away',
      lastSeen: '5m ago'
    },
    {
      id: '5',
      nickname: 'Eve',
      status: 'busy',
      lastSeen: '10m ago'
    }
  ];

  const currentRoom = chatRooms.find(room => room.id === activeRoom);
  const currentMessages = messages; // In real app, filter by room

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    alert('Send message feature not implemented yet. This would:\n- Send message to the current room\n- Update message history\n- Notify other users\n- Handle message encryption');
    
    setMessage('');
  };

  const handleCreateRoom = () => {
    alert('Create room feature not implemented yet. This would:\n- Open a room creation dialog\n- Set room name and description\n- Configure privacy settings\n- Invite users');
  };

  const handleJoinRoom = (roomId: string) => {
    alert(`Join room feature not implemented yet. This would:\n- Join room: ${roomId}\n- Load message history\n- Update online status\n- Subscribe to room updates`);
  };

  const handleUserClick = (userId: string) => {
    alert(`User profile feature not implemented yet. This would:\n- Show user profile\n- View message history\n- Send private message\n- Block/unblock user`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'away': return 'yellow';
      case 'busy': return 'red';
      case 'typing': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'away': return '🟡';
      case 'busy': return '🔴';
      case 'typing': return '✍️';
      default: return '⚪';
    }
  };

  return (
    <Flex direction="row" gap="4" style={{ height: '70vh' }}>
      {/* Left Sidebar - Chat Rooms */}
      <Card style={{ width: '300px', padding: '16px' }}>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">💬 Chat Rooms</Heading>
            <Button size="1" onClick={handleCreateRoom}>
              ➕ New
            </Button>
          </Flex>

          <ScrollArea style={{ height: '400px' }}>
            <Flex direction="column" gap="2">
              {chatRooms.map((room) => (
                <Card 
                  key={room.id}
                  style={{ 
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: activeRoom === room.id ? 'var(--blue-3)' : 'transparent',
                    border: activeRoom === room.id ? '1px solid var(--blue-6)' : '1px solid var(--gray-6)'
                  }}
                  onClick={() => setActiveRoom(room.id)}
                >
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="2" weight="bold">{room.name}</Text>
                      {room.unreadCount > 0 && (
                        <Badge color="red" size="1">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </Flex>
                    <Text size="1" color="gray">{room.description}</Text>
                    <Flex justify="between" align="center">
                      <Text size="1" color="gray">
                        👥 {room.memberCount} members
                      </Text>
                      <Flex align="center" gap="1">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: room.isOnline ? 'var(--green-9)' : 'var(--gray-6)'
                        }} />
                        <Text size="1" color="gray">
                          {room.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </Flex>
                    </Flex>
                    {room.lastMessage && (
                      <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                        "{room.lastMessage}" - {room.lastMessageTime}
                      </Text>
                    )}
                  </Flex>
                </Card>
              ))}
            </Flex>
          </ScrollArea>
        </Flex>
      </Card>

      {/* Main Chat Area */}
      <Flex direction="column" style={{ flex: 1 }}>
        {/* Chat Header */}
        <Card style={{ padding: '16px' }}>
          <Flex justify="between" align="center">
            <Flex direction="column" gap="1">
              <Heading size="4">{currentRoom?.name}</Heading>
              <Text size="2" color="gray">{currentRoom?.description}</Text>
            </Flex>
            <Flex gap="2">
              <Button 
                size="1" 
                variant="outline"
                onClick={() => alert('Room settings not implemented yet')}
              >
                ⚙️ Settings
              </Button>
              <Button 
                size="1" 
                variant="outline"
                onClick={() => alert('Invite users feature not implemented yet')}
              >
                👥 Invite
              </Button>
            </Flex>
          </Flex>
        </Card>

        {/* Messages Area */}
        <Card style={{ flex: 1, padding: '16px' }}>
          <ScrollArea style={{ height: '400px' }}>
            <Flex direction="column" gap="3">
              {currentMessages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'system' ? (
                    <Flex justify="center">
                      <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                        {msg.content}
                      </Text>
                    </Flex>
                  ) : (
                    <Flex gap="3" align="start">
                      <Avatar 
                        size="2" 
                        fallback={msg.authorNickname[0]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleUserClick(msg.author)}
                      />
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Flex align="center" gap="2">
                          <Text size="2" weight="bold">{msg.authorNickname}</Text>
                          <Text size="1" color="gray">{msg.timestamp}</Text>
                          {msg.isOnline && (
                            <Badge color="green" size="1">Online</Badge>
                          )}
                          {msg.isTyping && (
                            <Badge color="blue" size="1">Typing...</Badge>
                          )}
                        </Flex>
                        <Text size="2">{msg.content}</Text>
                      </Flex>
                    </Flex>
                  )}
                </div>
              ))}
            </Flex>
          </ScrollArea>
        </Card>

        {/* Message Input */}
        <Card style={{ padding: '16px' }}>
          <Flex gap="3" align="end">
            <TextField.Root
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              📤 Send
            </Button>
            <Button 
              variant="outline"
              onClick={() => alert('Attach file feature not implemented yet')}
            >
              📎
            </Button>
            <Button 
              variant="outline"
              onClick={() => alert('Emoji picker not implemented yet')}
            >
              😀
            </Button>
          </Flex>
        </Card>
      </Flex>

      {/* Right Sidebar - Online Users */}
      <Card style={{ width: '250px', padding: '16px' }}>
        <Flex direction="column" gap="4">
          <Heading size="4">👥 Online Users</Heading>
          
          <ScrollArea style={{ height: '400px' }}>
            <Flex direction="column" gap="2">
              {onlineUsers.map((user) => (
                <Card 
                  key={user.id}
                  style={{ 
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleUserClick(user.id)}
                >
                  <Flex align="center" gap="2">
                    <Avatar 
                      size="1" 
                      fallback={user.nickname[0]}
                    />
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text size="2" weight="bold">{user.nickname}</Text>
                      <Flex align="center" gap="1">
                        <Text size="1">{getStatusText(user.status)}</Text>
                        <Text size="1" color="gray">{user.lastSeen}</Text>
                      </Flex>
                    </Flex>
                    <Badge color={getStatusColor(user.status)} size="1">
                      {user.status}
                    </Badge>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </ScrollArea>

          <Separator />

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">Quick Actions</Text>
            <Button 
              size="1" 
              variant="outline"
              onClick={() => alert('Voice chat not implemented yet')}
            >
              🎤 Voice Chat
            </Button>
            <Button 
              size="1" 
              variant="outline"
              onClick={() => alert('Video call not implemented yet')}
            >
              📹 Video Call
            </Button>
            <Button 
              size="1" 
              variant="outline"
              onClick={() => alert('Screen share not implemented yet')}
            >
              🖥️ Share Screen
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
