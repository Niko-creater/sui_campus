import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Forum } from "./Forum";
import { CreateForum } from "./CreateForum";
import { ProfileManager } from "./ProfileManager";
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
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Campus Forum</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ? (
            <>
              <ProfileManager 
                currentAccount={currentAccount.address} 
                onProfileLoaded={handleProfileLoaded}
              />
              {profile && (
                forumId ? (
                  <Forum forumId={forumId} />
                ) : (
                  <CreateForum
                    onCreated={(id) => {
                      setForum(id);
                    }}
                  />
                )
              )}
            </>
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;