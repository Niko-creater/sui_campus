import { Button, Container, TextField, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNetworkVariable } from "./networkConfig";

export function CreateForum({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const defaultForumId = useNetworkVariable("forumObjectId");
  const [forumId, setForumId] = useState<string>(defaultForumId || "");

  function connectToForum() {
    if (!forumId.trim()) {
      alert("Please enter Forum object ID");
      return;
    }
    onCreated(forumId.trim());
  }

  return (
    <Container>
      <Flex direction="column" gap="3">
        <Text size="4" weight="bold">Connect to Campus Forum</Text>
        <Text size="2" color="gray">
          Forum object ID is pre-filled, click the button below to connect directly
        </Text>
        <TextField.Root
          placeholder="Enter Forum object ID (e.g., 0x...)"
          value={forumId}
          onChange={(e) => setForumId(e.target.value)}
        />
        <Button
          size="3"
          onClick={connectToForum}
          disabled={!forumId.trim()}
        >
          Enter Campus Forum
        </Button>
      </Flex>
    </Container>
  );
}
