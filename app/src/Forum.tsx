import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextField, TextArea, Card, Badge } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { TipPost } from "./TipPost";
// import { WalrusBasicTest } from "./components/WalrusBasicTest";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { WalrusClient, WalrusFile } from '@mysten/walrus';
import { useUserProfiles } from "./hooks/useUserProfiles";

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

interface Post {
  id: string;
  title: string;
  content: string;           // Direct content storage
  file_id: string;           // Walrus file ID (renamed from blob_id)
  is_long_post: boolean;     // Determines content storage type
  author: string;
  created_at_ms: number;
  tip_total: number;
  dislike_count: number;
  comment_index: number;
}

interface Comment {
  author: string;
  content: string;
  created_at_ms: number;
}

export function Forum({ forumId }: { forumId: string }) {
  const currentAccount = useCurrentAccount();
  const forumPackageId = useNetworkVariable("forumPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { getUserNickname, loadProfileForAddress } = useUserProfiles();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id: forumId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  const [waitingForTxn, setWaitingForTxn] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isLongPost, setIsLongPost] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Tip post states
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{ id: string; title: string } | null>(null);
  
  // Comment states
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});
  
  // Walrus upload states
  const [isUploadingToWalrus, setIsUploadingToWalrus] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Post content states
  const [postContents, setPostContents] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState<Record<string, boolean>>({});

  // Fetch posts list
  const fetchPosts = async () => {
    if (!data?.data) return;
    
    const forumData = getForumFields(data.data);
    if (!forumData) return;
    
    setLoadingPosts(true);
    try {
      const postCount = forumData.post_index;
      const postPromises = [];
      
      // Get all posts
      for (let i = 1; i <= postCount; i++) {
        postPromises.push(
          suiClient.devInspectTransactionBlock({
            transactionBlock: (() => {
              const tx = new Transaction();
              tx.moveCall({
                arguments: [tx.object(forumId), tx.pure.u64(i)],
                target: `${forumPackageId}::forum::get_forum_post_id`,
              });
              return tx;
            })(),
            sender: "0x0000000000000000000000000000000000000000000000000000000000000000"
          }).then(result => {
            if (result.results && result.results[0]?.returnValues) {
              const postIdBytes = result.results[0].returnValues[0][0];
              // Convert byte array to hexadecimal string
              const postId = '0x' + postIdBytes.map((byte: number) => byte.toString(16).padStart(2, '0')).join('');
              return postId;
            }
            return null;
          }).catch(error => {
            console.error(`Error getting post ${i}:`, error);
            return null;
          })
        );
      }
      
      const postIds = await Promise.all(postPromises);
      const validPostIds = postIds.filter(id => id !== null);
      
      // Get detailed information for each post
      const postDetails = await Promise.all(
        validPostIds.map(async (postId) => {
          try {
            const postData = await suiClient.getObject({
              id: postId,
              options: { showContent: true }
            });
            
            if (postData.data?.content?.dataType === "moveObject") {
              const fields = postData.data.content.fields as any;
              console.log('Post fields:', fields);
              console.log('created_at_ms type:', typeof fields.created_at_ms, 'value:', fields.created_at_ms);
              
              return {
                id: postId,
                title: fields.title,
                content: fields.content || '',
                file_id: fields.file_id || '',
                is_long_post: Boolean(fields.is_long_post),
                author: fields.author,
                created_at_ms: Number(fields.created_at_ms), // Ensure it's a number
                tip_total: Number(fields.tip_total),
                dislike_count: Number(fields.dislike_count),
                comment_index: Number(fields.comment_index),
              };
            }
          } catch (error) {
            console.error(`Error fetching post ${postId}:`, error);
          }
          return null;
        })
      );
      
      const validPosts = postDetails.filter(post => post !== null);
      
      // Sort posts by dislike count (ascending - fewer dislikes first)
      const sortedPosts = validPosts.sort((a, b) => a.dislike_count - b.dislike_count);
      
      setPosts(sortedPosts);
      
      // Load profiles for all post authors
      validPosts.forEach(post => {
        if (post) {
          loadProfileForAddress(post.author);
        }
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch comments for a specific post
  const fetchComments = async (postId: string) => {
    if (!forumPackageId) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      // First, get the post object to check comment count
      const postData = await suiClient.getObject({
        id: postId,
        options: { showContent: true }
      });
      
      if (postData.data?.content?.dataType === "moveObject") {
        const fields = postData.data.content.fields as any;
        const commentCount = fields.comment_index;
        console.log(`Post ${postId} has ${commentCount} comments`);
        
        if (commentCount === 0) {
          setComments(prev => ({ ...prev, [postId]: [] }));
          return;
        }
        
        // Fetch each comment individually using get_comment_data
        const comments: Comment[] = [];
        for (let i = 1; i <= commentCount; i++) {
          try {
            const result = await suiClient.devInspectTransactionBlock({
              transactionBlock: (() => {
                const tx = new Transaction();
                tx.moveCall({
                  arguments: [tx.object(postId), tx.pure.u64(i)],
                  target: `${forumPackageId}::forum::get_comment_data`,
                });
                return tx;
              })(),
              sender: "0x0000000000000000000000000000000000000000000000000000000000000000"
            });

            if (result.results && result.results[0]?.returnValues) {
              const returnValues = result.results[0].returnValues;
              console.log(`Comment ${i} return values:`, returnValues);
              
              if (returnValues.length >= 3) {
                // Decode BCS-encoded data
                const authorBytes = returnValues[0][0] as number[];
                const contentBytes = returnValues[1][0] as number[];
                // created_at_ms is also BCS-encoded as byte array
                const created_at_ms_bytes = returnValues[2][0] as number[];
                
                console.log(`Comment ${i} raw data:`, { authorBytes, contentBytes, created_at_ms_bytes });
                
                // Convert byte arrays to strings and numbers
                let author = '';
                let content = '';
                let created_at_ms = 0;
                
                try {
                  // For address, convert to hex string
                  author = authorBytes ? '0x' + authorBytes.map(byte => byte.toString(16).padStart(2, '0')).join('') : '';
                  
                  // For content, handle BCS-encoded string
                  if (contentBytes && contentBytes.length > 0) {
                    // BCS strings are length-prefixed, so we need to skip the length bytes
                    let stringBytes = contentBytes;
                    
                    // Try to find the actual string content by skipping length prefix
                    // BCS uses variable-length encoding for length, so we need to be smart about it
                    let offset = 0;
                    
                    // Check if first byte is a length prefix (0-127 for single byte length)
                    if (contentBytes[0] < 128 && contentBytes[0] > 0) {
                      offset = 1;
                    } else if (contentBytes.length > 1) {
                      // Check for two-byte length prefix
                      const length = (contentBytes[0] & 0x7F) | ((contentBytes[1] & 0x7F) << 7);
                      if (length > 0 && length < contentBytes.length - 2) {
                        offset = 2;
                      }
                    }
                    
                    // Extract the actual string bytes
                    if (offset > 0) {
                      const length = contentBytes[offset - 1];
                      stringBytes = contentBytes.slice(offset, offset + length);
                    }
                    
                    // Decode the string bytes
                    try {
                      content = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(stringBytes));
                      // Remove any null characters or replacement characters
                      content = content.replace(/\0/g, '').replace(/\uFFFD/g, '');
                    } catch (e) {
                      // Fallback: direct character conversion
                      content = stringBytes.map(byte => byte > 0 ? String.fromCharCode(byte) : '').join('');
                    }
                  }
                  
                  // Decode created_at_ms from BCS-encoded u64 bytes
                  if (created_at_ms_bytes && created_at_ms_bytes.length >= 8) {
                    // BCS encodes u64 as little-endian 8 bytes
                    created_at_ms = 0;
                    for (let j = 0; j < 8; j++) {
                      created_at_ms += created_at_ms_bytes[j] * Math.pow(256, j);
                    }
                  } else if (created_at_ms_bytes && created_at_ms_bytes.length > 0) {
                    // Fallback: try to interpret as big-endian
                    created_at_ms = 0;
                    for (let j = 0; j < created_at_ms_bytes.length; j++) {
                      created_at_ms = created_at_ms * 256 + created_at_ms_bytes[j];
                    }
                  }
                } catch (decodeError) {
                  console.error(`Error decoding comment ${i}:`, decodeError);
                  // Fallback: try to convert bytes directly to string
                  author = authorBytes ? '0x' + authorBytes.map(byte => byte.toString(16).padStart(2, '0')).join('') : '';
                  content = contentBytes ? contentBytes.map(byte => String.fromCharCode(byte)).join('') : '';
                  // For timestamp, try simple conversion
                  if (created_at_ms_bytes && created_at_ms_bytes.length > 0) {
                    created_at_ms = created_at_ms_bytes[0] || 0;
                  }
                }
                
                console.log(`Comment ${i} decoded:`, { author, content, created_at_ms });
                
                comments.push({
                  author: author || '',
                  content: content || '',
                  created_at_ms: created_at_ms || 0, // Ensure it's a number
                });
              }
            }
          } catch (commentError) {
            console.error(`Error fetching comment ${i}:`, commentError);
          }
        }
        
        console.log('All comments:', comments);
        setComments(prev => ({ ...prev, [postId]: comments }));
        
        // Load profiles for all comment authors
        comments.forEach(comment => {
          loadProfileForAddress(comment.author);
        });
      }
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add comment to a post
  const addComment = async (postId: string, content: string) => {
    if (!currentAccount || !forumPackageId) return;
    
    setWaitingForTxn("Adding comment...");
    try {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(postId),
          tx.pure.string(content),
          tx.object("0x6"), // Clock object
        ],
        target: `${forumPackageId}::forum::add_comment`,
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            await suiClient.waitForTransaction({ digest: result.digest });
            setWaitingForTxn("");
            setNewComment(prev => ({ ...prev, [postId]: "" }));
            // Refresh comments for this post
            await fetchComments(postId);
            // Refresh posts to update comment count
            await fetchPosts();
          },
          onError: (error) => {
            console.error('❌ Add comment failed:', error);
            setWaitingForTxn("");
          },
        }
      );
    } catch (error) {
      console.error('❌ Add comment failed:', error);
      setWaitingForTxn("");
    }
  };

  // Toggle comments visibility for a post
  const toggleComments = async (postId: string) => {
    const isCurrentlyVisible = showComments[postId];
    
    if (!isCurrentlyVisible) {
      // If opening comments and we don't have them loaded, fetch them
      if (!comments[postId]) {
        await fetchComments(postId);
      }
    }
    
    setShowComments(prev => ({ ...prev, [postId]: !isCurrentlyVisible }));
  };

  // Fetch posts when Forum data is loaded
  useEffect(() => {
    if (data?.data && !loadingPosts) {
      fetchPosts();
    }
  }, [data?.data]);

  // Upload content to Walrus and return file ID
  const uploadToWalrus = async (content: string): Promise<string> => {
    if (!currentAccount) {
      throw new Error("Please connect your wallet first");
    }

    console.log('🚀 Starting Walrus upload for post content...');
    
    // Initialize Walrus client
    const walrusClient = new WalrusClient({
      network: 'testnet',
      suiClient: new SuiClient({
        url: getFullnodeUrl('testnet'),
      }),
      wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
    });

    // Create a WalrusFile from the content
    const file = WalrusFile.from({
      contents: new TextEncoder().encode(content),
      identifier: `post-content-${Date.now()}.txt`,
      tags: {
        'content-type': 'text/plain',
      },
    });
    
    console.log('📄 Created WalrusFile for post content');

    // Use the browser-friendly writeFilesFlow
    const flow = walrusClient.writeFilesFlow({
      files: [file],
    });

    console.log('🔧 Encoding files...');
    await flow.encode();

    console.log('📝 Registering blob on-chain...');
    const registerTx = flow.register({
      epochs: 3,
      owner: currentAccount.address,
      deletable: true,
    });

    // Execute registration transaction
    const registerResult = await new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: registerTx },
        {
          onSuccess: (result) => {
            console.log('✅ Registration successful:', result);
            resolve(result);
          },
          onError: (error) => {
            console.error('❌ Registration failed:', error);
            reject(error);
          },
        }
      );
    });

    // Check if registration was successful
    if (!registerResult || !(registerResult as any).digest) {
      throw new Error('Registration failed: No digest returned');
    }

    console.log('📤 Uploading data to storage nodes...');
    try {
      await flow.upload({ digest: (registerResult as any).digest });
      console.log('✅ Upload completed successfully');
    } catch (uploadError: any) {
      console.error('❌ Upload failed:', uploadError);
      throw new Error(`Upload failed: ${uploadError?.message || 'Unknown error'}`);
    }

    console.log('✅ Certifying blob availability...');
    const certifyTx = flow.certify();
    
    // Execute certification transaction
    const certifyResult = await new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: certifyTx },
        {
          onSuccess: (result) => {
            console.log('✅ Certification successful:', result);
            resolve(result);
          },
          onError: (error) => {
            console.error('❌ Certification failed:', error);
            reject(error);
          },
        }
      );
    });

    // Check if certification was successful
    if (!certifyResult || !(certifyResult as any).digest) {
      throw new Error('Certification failed: No digest returned');
    }

    console.log('📋 Getting file list...');
    const files = await flow.listFiles();
    
    if (files.length > 0) {
      const fileId = files[0].id;
      console.log('✅ Upload complete! File ID:', fileId);
      return fileId;
    } else {
      throw new Error('No file returned from Walrus upload');
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim()) {
      alert("Please fill in title");
      return;
    }

    if (isLongPost && !newPostContent.trim()) {
      alert("Please fill in content for long post");
      return;
    }

    if (!isLongPost && !newPostContent.trim()) {
      alert("Please fill in content for short post");
      return;
    }

    setWaitingForTxn("createPost");
    setUploadError(null);

    try {
      let fileId = "";
      let content = "";

      if (isLongPost) {
        // Long post: upload content to Walrus
        setIsUploadingToWalrus(true);
        console.log('📤 Uploading post content to Walrus...');
        fileId = await uploadToWalrus(newPostContent);
        console.log('✅ Walrus upload successful, file ID:', fileId);
        content = ""; // Content is stored in Walrus
      } else {
        // Short post: store content directly
        content = newPostContent;
        fileId = ""; // No file ID needed
      }

      // Create the post with the appropriate parameters
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(forumId), // Forum is a shared object
          tx.pure.string(newPostTitle),
          tx.pure.string(content), // Direct content storage
          tx.pure.string(fileId), // Walrus file ID
          tx.pure.bool(isLongPost), // Post type flag
          tx.object("0x6"), // Clock object
        ],
        target: `${forumPackageId}::forum::create_post`,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
              await refetch();
              setWaitingForTxn("");
              setShowCreateForm(false);
              setNewPostTitle("");
              setNewPostContent("");
              setIsLongPost(false);
              // Refresh posts list
              fetchPosts();
            });
          },
          onError: (error) => {
            console.error('❌ Post creation failed:', error);
            setUploadError(`Post creation failed: ${error.message}`);
            setWaitingForTxn("");
          },
        },
      );
    } catch (error) {
      console.error('❌ Walrus upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(`Walrus upload failed: ${errorMessage}`);
      setWaitingForTxn("");
    } finally {
      setIsUploadingToWalrus(false);
    }
  };

  // Read content from Walrus using file ID
  const readFromWalrus = async (fileId: string): Promise<string> => {
    console.log('📖 Reading from Walrus with file ID:', fileId);
    
    // Initialize Walrus client for reading
    const walrusClient = new WalrusClient({
      network: 'testnet',
      suiClient: new SuiClient({
        url: getFullnodeUrl('testnet'),
      }),
      wasmUrl: 'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
      storageNodeClientOptions: {
        onError: (error) => {
          console.log('🌐 Storage node error:', error);
        },
        timeout: 60_000, // 60秒超时
      },
    });

    console.log('📖 Reading file from Walrus...');
    
    // Read the file from Walrus using file ID
    const files = await walrusClient.getFiles({ ids: [fileId] });
    
    if (files.length > 0) {
      const file = files[0];
      console.log('📄 File object:', file);
      
      let content = '';
      
      try {
        // 根据官方文档，WalrusFile提供了标准的API方法
        if (typeof file.text === 'function') {
          content = await file.text();
          console.log('✅ Using file.text():', content);
        } else if (typeof file.bytes === 'function') {
          const bytes = await file.bytes();
          content = new TextDecoder('utf-8').decode(bytes);
          console.log('✅ Using file.bytes() + TextDecoder:', content);
        } else {
          // 备用方案：尝试访问内部属性
          const fileAny = file as any;
          if (fileAny.contents instanceof Uint8Array) {
            content = new TextDecoder('utf-8').decode(fileAny.contents);
            console.log('✅ Using file.contents + TextDecoder:', content);
          } else if (fileAny.data instanceof Uint8Array) {
            content = new TextDecoder('utf-8').decode(fileAny.data);
            console.log('✅ Using file.data + TextDecoder:', content);
          } else if (typeof fileAny.text === 'string') {
            content = fileAny.text;
            console.log('✅ Using file.text as string:', content);
          } else {
            content = String(fileAny);
            console.log('✅ Using String(file):', content);
          }
        }
        
        console.log('✅ Final content:', content);
        return content;
        
      } catch (decodeError) {
        console.error('❌ Decode error:', decodeError);
        throw new Error(`Failed to decode content: ${decodeError instanceof Error ? decodeError.message : 'Unknown decode error'}`);
      }
    } else {
      throw new Error("No file found with the given file ID");
    }
  };

  // Load post content from Walrus
  const loadPostContent = async (postId: string, fileId: string) => {
    if (postContents[postId] || loadingContent[postId]) {
      return; // Already loaded or loading
    }

    setLoadingContent(prev => ({ ...prev, [postId]: true }));

    try {
      const content = await readFromWalrus(fileId);
      setPostContents(prev => ({ ...prev, [postId]: content }));
    } catch (error) {
      console.error(`❌ Failed to load content for post ${postId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPostContents(prev => ({ ...prev, [postId]: `Error loading content: ${errorMessage}` }));
    } finally {
      setLoadingContent(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Handle tip post
  const handleTipPost = (postId: string, postTitle: string, postAuthor: string) => {
    // Check if current user is trying to tip their own post
    if (currentAccount && currentAccount.address === postAuthor) {
      alert("You cannot tip your own post!");
      return;
    }
    
    setSelectedPost({ id: postId, title: postTitle });
    setShowTipDialog(true);
  };

  const handleTipSuccess = () => {
    // Refresh posts to update tip totals
    fetchPosts();
  };

  // Handle dislike post
  const handleDislikePost = async (postId: string, postAuthor: string) => {
    // Check if current user is trying to dislike their own post
    if (currentAccount && currentAccount.address === postAuthor) {
      alert("You cannot dislike your own post!");
      return;
    }

    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    setWaitingForTxn("dislikePost");

    try {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(postId), // Post object
        ],
        target: `${forumPackageId}::forum::dislike_post`,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
              await refetch();
              setWaitingForTxn("");
              // Refresh posts to update dislike counts
              fetchPosts();
            });
          },
          onError: (error) => {
            console.error('❌ Dislike post failed:', error);
            alert(`Dislike failed: ${error.message}`);
            setWaitingForTxn("");
          },
        },
      );
    } catch (error) {
      console.error('❌ Dislike post error:', error);
      alert(`Dislike failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setWaitingForTxn("");
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the post "${postTitle}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setWaitingForTxn("deletePost");

    try {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(forumId), // Forum object
          tx.object(postId), // Post object
          tx.object("0x6"), // Clock object
        ],
        target: `${forumPackageId}::forum::delete_post`,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (tx) => {
            suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
              await refetch();
              setWaitingForTxn("");
              // Refresh posts to remove deleted post
              fetchPosts();
              alert("Post deleted successfully!");
            });
          },
          onError: (error) => {
            console.error('❌ Delete post failed:', error);
            alert(`Delete failed: ${error.message}`);
            setWaitingForTxn("");
          },
        },
      );
    } catch (error) {
      console.error('❌ Delete post error:', error);
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setWaitingForTxn("");
    }
  };

  const getForumFields = (data: SuiObjectData) => {
    if (data.content?.dataType !== "moveObject") {
      return null;
    }
    return data.content.fields as { post_index: number; posts: any };
  };

  if (isPending) return <Text>Loading...</Text>;

  if (error) return <Text>Error: {error.message}</Text>;

  if (!data.data) return <Text>Forum not found</Text>;

  const forumData = getForumFields(data.data);
  const postCount = forumData?.post_index || 0;

  return (
      <>
        <Heading size="3">Campus Forum</Heading>
        
        {/* Walrus Test Panel - Hidden for now, can be enabled later */}
        {/* {import.meta.env.DEV && (
          <WalrusBasicTest />
        )} */}
        
        <Flex direction="column" gap="3" mt="3">
        <Flex justify="between" align="center">
          {/* <Text>Total Posts: {postCount}</Text> */}
          <Flex gap="2">
            <Button
              onClick={() => fetchPosts()}
              disabled={loadingPosts}
              variant="outline"
            >
              {loadingPosts ? <ClipLoader size={16} /> : "Refresh Posts"}
            </Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={waitingForTxn !== ""}
            >
              Create New Post
            </Button>
          </Flex>
        </Flex>

        {showCreateForm && (
          <Card>
            <Flex direction="column" gap="3" p="3">
              <Heading size="4">Create New Post</Heading>
              <TextField.Root
                placeholder="Post Title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Post Type</Text>
                <Flex gap="3">
                  <Button
                    variant={!isLongPost ? "solid" : "outline"}
                    onClick={() => setIsLongPost(false)}
                    size="2"
                  >
                    📝 Short Post (Direct Storage)
                  </Button>
                  <Button
                    variant={isLongPost ? "solid" : "outline"}
                    onClick={() => setIsLongPost(true)}
                    size="2"
                  >
                    📄 Long Post (Walrus Storage)
                  </Button>
                </Flex>
                <Text size="1" color="gray">
                  {isLongPost 
                    ? "Content will be stored on Walrus (suitable for long text, images, etc.)"
                    : "Content will be stored directly on-chain (suitable for short text)"
                  }
                </Text>
              </Flex>
              
              <TextArea
                placeholder={isLongPost ? "Post Content (will be stored on Walrus)" : "Post Content (will be stored on-chain)"}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={isLongPost ? 8 : 4}
              />
              {isUploadingToWalrus && (
                <Text size="2" color="blue">
                  📤 Uploading content to Walrus...
                </Text>
              )}
              
              {uploadError && (
                <Text size="2" color="red">
                  ❌ {uploadError}
                </Text>
              )}
              
              <Flex gap="2">
                <Button
                  onClick={createPost}
                  disabled={waitingForTxn !== "" || isUploadingToWalrus}
                >
                  {waitingForTxn === "createPost" || isUploadingToWalrus ? (
                    <ClipLoader size={20} />
                  ) : (
                    isLongPost ? "📄 Publish Long Post" : "📝 Publish Short Post"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPostTitle("");
                    setNewPostContent("");
                    setIsLongPost(false);
                    setUploadError(null);
                  }}
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Posts List */}
        <Flex direction="column" gap="3" mt="4">
          <Heading size="4">Posts List</Heading>
          {loadingPosts ? (
            <Flex align="center" gap="2">
              <ClipLoader size={20} />
              <Text>Loading posts...</Text>
            </Flex>
          ) : posts.length === 0 ? (
            <Text color="gray">No posts yet, be the first to publish one!</Text>
          ) : (
            <Flex direction="column" gap="3">
              {posts.map((post, index) => (
                <div key={post.id}>
                  <Card style={{ padding: '12px' }}>
                    <Flex direction="column" gap="2">
                      <Flex justify="between" align="start">
                        <Heading size="3">{post.title}</Heading>
                        <Badge color="blue">#{index + 1}</Badge>
                      </Flex>
                      <Text size="2" color="gray">
                        Author: {getUserNickname(post.author)}
                      </Text>
                      
                      {/* Post Content */}
                      <div>
                        {loadingContent[post.id] ? (
                          <Flex align="center" gap="2">
                            <ClipLoader size={16} />
                            <Text size="2" color="gray">Loading content...</Text>
                          </Flex>
                        ) : post.is_long_post ? (
                          // Long post: content stored in Walrus
                          postContents[post.id] ? (
                            <Text size="2" style={{ 
                              whiteSpace: 'pre-wrap',
                              backgroundColor: 'var(--gray-2)',
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid var(--gray-6)'
                            }}>
                              {postContents[post.id]}
                            </Text>
                          ) : (
                            <Button
                              size="1"
                              variant="outline"
                              onClick={() => loadPostContent(post.id, post.file_id)}
                            >
                              📖 Load Content
                            </Button>
                          )
                        ) : (
                          // Short post: content stored directly
                          <Text size="2" style={{ 
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'var(--gray-2)',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--gray-6)'
                          }}>
                            {post.content}
                          </Text>
                        )}
                      </div>
                      
                      {post.is_long_post && (
                        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
                          File ID: {post.file_id.slice(0, 20)}...
                        </Text>
                      )}
                      <Flex gap="3" align="center" justify="between">
                        <Flex gap="3" align="center">
                          <Badge color="green">
                            💰 {(post.tip_total / 1000000000).toFixed(4)} SUI
                          </Badge>
                          <Button
                            size="1"
                            variant="soft"
                            color="red"
                            onClick={() => handleDislikePost(post.id, post.author)}
                            disabled={waitingForTxn === "dislikePost" || (currentAccount?.address === post.author)}
                          >
                            👎 {post.dislike_count}
                          </Button>
                        <Text size="1" color="gray">
                          {safeTimestampToDate(post.created_at_ms).toLocaleString()}
                        </Text>
                        </Flex>
                        <Flex gap="2">
                          <Button
                            size="1"
                            variant="soft"
                            color="blue"
                            onClick={() => toggleComments(post.id)}
                          >
                            {showComments[post.id] ? "🔼 Hide Comments" : `💬 View Comments (${post.comment_index})`}
                          </Button>
                          {currentAccount && currentAccount.address === post.author ? (
                            <>
                              <Button
                                size="1"
                                variant="soft"
                                color="gray"
                                disabled
                              >
                                💰 Your Post
                              </Button>
                              <Button
                                size="1"
                                variant="soft"
                                color="red"
                                onClick={() => handleDeletePost(post.id, post.title)}
                                disabled={waitingForTxn === "deletePost"}
                              >
                                {waitingForTxn === "deletePost" ? <ClipLoader size={12} /> : "🗑️ Delete"}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="1"
                              variant="soft"
                              color="green"
                              onClick={() => handleTipPost(post.id, post.title, post.author)}
                            >
                              💰 Tip
                            </Button>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                  
                  {/* Comments Section */}
                  <div
                    style={{
                      maxHeight: showComments[post.id] ? '1000px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin 0.3s ease-in-out',
                      opacity: showComments[post.id] ? 1 : 0,
                      marginTop: showComments[post.id] ? '8px' : '0px',
                    }}
                  >
                    <Card style={{ marginLeft: '16px' }}>
                      <Flex direction="column" gap="3">
                        <Heading size="3">Comments</Heading>
                        
                        {/* Add Comment Form */}
                        {currentAccount && (
                          <Flex direction="column" gap="2">
                            <TextArea
                              placeholder="Write a comment..."
                              value={newComment[post.id] || ""}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              rows={3}
                            />
                            <Button
                              size="1"
                              onClick={() => {
                                const content = newComment[post.id];
                                if (content && content.trim()) {
                                  addComment(post.id, content.trim());
                                }
                              }}
                              disabled={!newComment[post.id]?.trim() || waitingForTxn === "Adding comment..."}
                            >
                              {waitingForTxn === "Adding comment..." ? <ClipLoader size={16} /> : "Add Comment"}
                            </Button>
                          </Flex>
                        )}
                        
                        {/* Comments List */}
                        <Flex direction="column" gap="2">
                          {loadingComments[post.id] ? (
                            <Flex align="center" gap="2">
                              <ClipLoader size={16} />
                              <Text size="2" color="gray">Loading comments...</Text>
                            </Flex>
                          ) : comments[post.id] && comments[post.id].length > 0 ? (
                            comments[post.id].map((comment, commentIndex) => (
                              <Card key={commentIndex} style={{ backgroundColor: 'var(--gray-2)' }}>
                                <Flex direction="column" gap="2">
                                  <Flex align="center" gap="2">
                                    <Text size="2" weight="bold">
                                      {getUserNickname(comment.author)}
                                    </Text>
                                    {comment.author === post.author && (
                                      <Badge color="orange" size="1">OP</Badge>
                                    )}
                                    <Text size="1" color="gray">
                                      {safeTimestampToDate(comment.created_at_ms).toLocaleString()}
                                    </Text>
                                  </Flex>
                                  <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>
                                    {comment.content}
                                  </Text>
                                </Flex>
                              </Card>
                            ))
                          ) : (
                            <Text size="2" color="gray">No comments yet. Be the first to comment!</Text>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  </div>
                </div>
              ))}
            </Flex>
          )}
        </Flex>

        <Text size="2" color="gray">Forum ID: {forumId}</Text>
        <Text size="2" color="gray">Package ID: {forumPackageId}</Text>
      </Flex>

      {/* Tip Post Dialog */}
      {selectedPost && (
        <TipPost
          postId={selectedPost.id}
          postTitle={selectedPost.title}
          isOpen={showTipDialog}
          onClose={() => {
            setShowTipDialog(false);
            setSelectedPost(null);
          }}
          onSuccess={handleTipSuccess}
        />
      )}
    </>
  );
}
