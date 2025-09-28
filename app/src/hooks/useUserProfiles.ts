import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { useState, useEffect } from "react";

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

interface UserProfilesHook {
  getUserNickname: (address: string) => string;
  profiles: { [address: string]: Profile };
  loading: boolean;
  loadProfileForAddress: (address: string) => Promise<void>;
  isProfileLoaded: (address: string) => boolean;
}

export function useUserProfiles(): UserProfilesHook {
  const forumPackageId = useNetworkVariable("forumPackageId");
  const suiClient = useSuiClient();
  const [profiles, setProfiles] = useState<{ [address: string]: Profile }>({});
  const [loading, setLoading] = useState(false);

  // Function to fetch profile for a specific address
  const fetchProfileForAddress = async (address: string): Promise<Profile | null> => {
    if (!forumPackageId) return null;
    
    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${forumPackageId}::forum::Profile`,
        },
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (ownedObjects.data && ownedObjects.data.length > 0) {
        const profileObject = ownedObjects.data[0];
        if (profileObject.data?.content?.dataType === "moveObject") {
          const fields = profileObject.data.content.fields as any;
          return {
            id: profileObject.data.objectId,
            owner: fields.owner,
            nickname: fields.nickname,
            birthday: fields.birthday,
            gender: fields.gender,
            bio: fields.bio,
            created_at_ms: fields.created_at_ms,
            updated_at_ms: fields.updated_at_ms,
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching profile for ${address}:`, error);
    }
    
    return null;
  };

  // Function to get nickname for an address
  const getUserNickname = (address: string): string => {
    const profile = profiles[address];
    if (profile && profile.nickname) {
      return profile.nickname;
    }
    // Fallback to truncated address if no profile found
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Function to check if profile is loaded for an address
  const isProfileLoaded = (address: string): boolean => {
    return !!profiles[address];
  };

  // Function to load profile for an address if not already loaded
  const loadProfileForAddress = async (address: string) => {
    if (profiles[address] || !forumPackageId) return;
    
    setLoading(true);
    try {
      const profile = await fetchProfileForAddress(address);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [address]: profile
        }));
      }
    } catch (error) {
      console.error(`Error loading profile for ${address}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return {
    getUserNickname,
    profiles,
    loading,
    loadProfileForAddress,
    isProfileLoaded
  };
}
