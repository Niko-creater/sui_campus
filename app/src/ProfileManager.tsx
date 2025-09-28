import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextField, TextArea, Card, Dialog } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { BalanceDisplay } from "./BalanceDisplay";

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

interface ProfileManagerProps {
  currentAccount: string;
  onProfileLoaded: (profile: Profile | null) => void;
}

export function ProfileManager({ currentAccount, onProfileLoaded }: ProfileManagerProps) {
  const forumPackageId = useNetworkVariable("forumPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [waitingForTxn, setWaitingForTxn] = useState("");
  
  // Profile creation form state
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");

  // Query user's owned objects to find Profile
  const { data: ownedObjects, refetch: refetchOwnedObjects } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount,
      filter: {
        StructType: `${forumPackageId}::forum::Profile`,
      },
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
      enabled: !!currentAccount && !!forumPackageId,
    }
  );

  // Load profile data when owned objects are available
  useEffect(() => {
    if (ownedObjects?.data && ownedObjects.data.length > 0) {
      const profileObject = ownedObjects.data[0];
      if (profileObject.data?.content?.dataType === "moveObject") {
        const fields = profileObject.data.content.fields as any;
        console.log('Profile fields:', fields);
        console.log('Profile created_at_ms type:', typeof fields.created_at_ms, 'value:', fields.created_at_ms);
        
        const profileData: Profile = {
          id: profileObject.data.objectId,
          owner: fields.owner,
          nickname: fields.nickname,
          birthday: fields.birthday,
          gender: fields.gender,
          bio: fields.bio,
          created_at_ms: Number(fields.created_at_ms), // Ensure it's a number
          updated_at_ms: Number(fields.updated_at_ms), // Ensure it's a number
        };
        setProfile(profileData);
        onProfileLoaded(profileData);
      }
    } else if (ownedObjects?.data && ownedObjects.data.length === 0) {
      // No profile found, show create modal
      setProfile(null);
      onProfileLoaded(null);
      setShowCreateModal(true);
    }
    setLoading(false);
  }, [ownedObjects, onProfileLoaded]);

  const createProfile = () => {
    if (!nickname.trim()) {
      alert("Nickname is required");
      return;
    }

    setWaitingForTxn("createProfile");

    const tx = new Transaction();
    tx.moveCall({
      arguments: [
        tx.pure.string(nickname),
        tx.pure.string(birthday),
        tx.pure.string(gender),
        tx.pure.string(bio),
        tx.object("0x6") // Clock object
      ],
      target: `${forumPackageId}::forum::create_profile`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            setWaitingForTxn("");
            setShowCreateModal(false);
            // Reset form
            setNickname("");
            setBirthday("");
            setGender("");
            setBio("");
            // Refetch owned objects to get the new profile
            await refetchOwnedObjects();
          });
        },
        onError: (error) => {
          console.error("Profile creation failed:", error);
          setWaitingForTxn("");
        },
      },
    );
  };

  if (loading) {
    return (
      <Flex align="center" gap="2" p="4">
        <ClipLoader size={20} />
        <Text>Loading profile...</Text>
      </Flex>
    );
  }

  return (
    <>
      {/* Profile Creation Modal */}
      <Dialog.Root open={showCreateModal} onOpenChange={() => {}}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Create Your Profile</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Complete your profile to start using the campus forum.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <div>
              <Text size="2" weight="bold" mb="2" as="div">
                Nickname *
              </Text>
              <TextField.Root
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div>
              <Text size="2" weight="bold" mb="2" as="div">
                Birthday
              </Text>
              <TextField.Root
                placeholder="YYYY-MM-DD (optional)"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div>
              <Text size="2" weight="bold" mb="2" as="div">
                Gender
              </Text>
              <TextField.Root
                placeholder="male, female, other, or leave empty (optional)"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>

            <div>
              <Text size="2" weight="bold" mb="2" as="div">
                Bio
              </Text>
              <TextArea
                placeholder="Tell us about yourself (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <Flex gap="3" mt="4">
              <Button
                onClick={createProfile}
                disabled={waitingForTxn !== "" || !nickname.trim()}
                style={{ flex: 1 }}
              >
                {waitingForTxn === "createProfile" ? (
                  <ClipLoader size={16} />
                ) : (
                  "Create Profile"
                )}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Profile Status Display */}
      {profile && (
        <>
          <Card style={{ padding: '12px', margin: '8px 0' }}>
            <Flex direction="column" gap="2">
              <Heading size="3">Welcome, {profile.nickname}!</Heading>
              <Text size="2" color="gray">
                Profile loaded successfully
              </Text>
            </Flex>
          </Card>
          
          {/* Wallet Balances Display */}
          <BalanceDisplay currentAccount={currentAccount} />
        </>
      )}
    </>
  );
}
