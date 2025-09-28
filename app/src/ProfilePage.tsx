import { Card, Flex, Heading, Text, Badge, Button } from "@radix-ui/themes";

// Helper function to safely convert timestamp to Date
const safeTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date(0);
  
  // Convert to number if it's a string
  const numTimestamp = Number(timestamp);
  
  // Check if it's a valid number
  if (isNaN(numTimestamp) || numTimestamp <= 0) {
    console.warn('Invalid timestamp:', timestamp);
    return new Date(0);
  }
  
  // Check if timestamp is in milliseconds (should be > year 2000 in ms)
  if (numTimestamp > 946684800000) { // Jan 1, 2000 in ms
    return new Date(numTimestamp);
  }
  
  // If timestamp seems to be in seconds, convert to milliseconds
  if (numTimestamp > 946684800) { // Jan 1, 2000 in seconds
    return new Date(numTimestamp * 1000);
  }
  
  // Fallback
  console.warn('Timestamp seems too small, using as-is:', numTimestamp);
  return new Date(numTimestamp);
};

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

interface ProfilePageProps {
  profile: Profile;
  currentAccount: string;
}

export function ProfilePage({ profile, currentAccount }: ProfilePageProps) {
  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Heading size="4">My Profile</Heading>
        <Badge color="green" size="2">✓ Active</Badge>
      </Flex>
      
      {/* Profile Information Card */}
      <Card style={{ padding: '24px' }}>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="6" style={{ color: 'var(--accent-9)' }}>
              {profile.nickname}
            </Heading>
            <Badge color="blue" size="2">Profile Owner</Badge>
          </Flex>
          
          <Flex direction="column" gap="4">
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--gray-2)', 
              borderRadius: '8px',
              border: '1px solid var(--gray-6)'
            }}>
              <Text size="2" weight="bold" color="gray" mb="2">Wallet Address</Text>
              <Text size="2" style={{ 
                fontFamily: 'monospace',
                backgroundColor: 'var(--gray-3)',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {currentAccount}
              </Text>
            </div>
            
            <Flex gap="4" wrap="wrap">
              {profile.birthday && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--gray-2)', 
                  borderRadius: '8px',
                  border: '1px solid var(--gray-6)',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <Text size="2" weight="bold" color="gray" mb="1">🎂 Birthday</Text>
                  <Text size="2">{profile.birthday}</Text>
                </div>
              )}
              
              {profile.gender && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--gray-2)', 
                  borderRadius: '8px',
                  border: '1px solid var(--gray-6)',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <Text size="2" weight="bold" color="gray" mb="1">⚧ Gender</Text>
                  <Text size="2">{profile.gender}</Text>
                </div>
              )}
            </Flex>
            
            {profile.bio && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: 'var(--gray-2)', 
                borderRadius: '8px',
                border: '1px solid var(--gray-6)'
              }}>
                <Text size="2" weight="bold" color="gray" mb="2">📝 Bio</Text>
                <Text size="2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {profile.bio}
                </Text>
              </div>
            )}
            
            <Flex gap="4" wrap="wrap">
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'var(--gray-2)', 
                borderRadius: '8px',
                border: '1px solid var(--gray-6)',
                flex: '1',
                minWidth: '200px'
              }}>
                <Text size="2" weight="bold" color="gray" mb="1">📅 Created</Text>
                <Text size="2">
                  {safeTimestampToDate(profile.created_at_ms).toLocaleString()}
                </Text>
              </div>
              
              {profile.updated_at_ms !== profile.created_at_ms && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--gray-2)', 
                  borderRadius: '8px',
                  border: '1px solid var(--gray-6)',
                  flex: '1',
                  minWidth: '200px'
                }}>
                  <Text size="2" weight="bold" color="gray" mb="1">🔄 Last Updated</Text>
                  <Text size="2">
                    {safeTimestampToDate(profile.updated_at_ms).toLocaleString()}
                  </Text>
                </div>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Card>
      
      {/* Profile Actions */}
      <Card style={{ padding: '20px' }}>
        <Flex direction="column" gap="4">
          <Heading size="4">Profile Actions</Heading>
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              Manage your profile and account settings.
            </Text>
            <Flex gap="3" wrap="wrap">
              <Button variant="outline" disabled>
                ✏️ Edit Profile
              </Button>
              <Button variant="outline" disabled>
                🔒 Privacy Settings
              </Button>
              <Button variant="outline" disabled>
                📊 Activity History
              </Button>
            </Flex>
            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
              These features will be available in future updates.
            </Text>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
