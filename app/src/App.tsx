import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { useState } from "react";
import { Forum } from "./Forum";
import { CreateForum } from "./CreateForum";
import { ProfileManager } from "./ProfileManager";
import { ProfilePage } from "./ProfilePage";
import { SearchPage } from "./SearchPage";
import { ChatRoom } from "./ChatRoom";
import { useNetworkVariable } from "./networkConfig";

interface Profile {
  id: string;
  owner: string;
  nickname: string;
  birthday: string;
  gender: string;
  bio: string;
  created_at_ms: number;
  updated_at_ms: number;
}

function App() {
  const currentAccount = useCurrentAccount();
  const defaultForumId = useNetworkVariable("forumObjectId");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [forumId, setForum] = useState<string | null>(() => {
    // Only use default from network config
    if (defaultForumId && isValidSuiObjectId(defaultForumId)) {
      return defaultForumId;
    }
    return null;
  });

  const handleProfileLoaded = (profileData: Profile | null) => {
    setProfile(profileData);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      minHeight: '100vh',
      backgroundAttachment: 'fixed'
    }}>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box>
          <Flex align="center" gap="3">
            <img 
              src="/icon.jpg" 
              alt="Campus Forum Icon" 
              style={{ 
                height: '40px', 
                width: '40px', 
                borderRadius: '8px',
                objectFit: 'cover'
              }} 
            />
            <Heading size="7" style={{ color: 'white', fontSize: '2.5rem' }}>
              Campus Forum
            </Heading>
          </Flex>
        </Box>

        <Box>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            transition: 'all 0.3s ease-in-out',
            transform: 'scale(0.9)',
            opacity: 0.8,
            filter: 'brightness(0.7) saturate(1.2)',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6))',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.filter = 'brightness(1.2) saturate(1.5)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2))';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(0.9)';
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.filter = 'brightness(0.7) saturate(1.2)';
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6))';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          }}
          >
            <ConnectButton />
          </div>
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            minHeight: 500,
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {currentAccount ? (
            <>
              <ProfileManager 
                currentAccount={currentAccount.address} 
                onProfileLoaded={handleProfileLoaded}
              />
              {profile && (
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List>
                    <Tabs.Trigger value="home">🏠 Home</Tabs.Trigger>
                    <Tabs.Trigger value="search">🔍 Search</Tabs.Trigger>
                    <Tabs.Trigger value="chat">💬 Chat</Tabs.Trigger>
                    <Tabs.Trigger value="profile">👤 Profile</Tabs.Trigger>
                  </Tabs.List>
                  
                  <Tabs.Content value="home" style={{ marginTop: '16px' }}>
                    {forumId ? (
                      <Forum forumId={forumId} />
                    ) : (
                      <CreateForum
                        onCreated={(id) => {
                          setForum(id);
                        }}
                      />
                    )}
                  </Tabs.Content>
                  
                  <Tabs.Content value="search" style={{ marginTop: '16px' }}>
                    <SearchPage />
                  </Tabs.Content>
                  
                  <Tabs.Content value="chat" style={{ marginTop: '16px' }}>
                    <ChatRoom />
                  </Tabs.Content>
                  
                  <Tabs.Content value="profile" style={{ marginTop: '16px' }}>
                    <ProfilePage 
                      profile={profile} 
                      currentAccount={currentAccount.address} 
                    />
                  </Tabs.Content>
                </Tabs.Root>
              )}
            </>
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </div>
  );
}

export default App;