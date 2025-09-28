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
import { WalrusBasicTest } from "./components/WalrusBasicTest";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { WalrusClient, WalrusFile } from '@mysten/walrus';

interface Post {
  id: string;
  title: string;
  blob_id: string;
  author: string;
  created_at_ms: number;
  tip_total: number;
  dislike_count: number;
  comment_index: number;
}

export function Forum({ forumId }: { forumId: string }) {
  const currentAccount = useCurrentAccount();
  const forumPackageId = useNetworkVariable("forumPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Tip post states
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{ id: string; title: string } | null>(null);
  
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
              return {
                id: postId,
                title: fields.title,
                blob_id: fields.blob_id,
                author: fields.author,
                created_at_ms: fields.created_at_ms,
                tip_total: fields.tip_total,
                dislike_count: fields.dislike_count,
                comment_index: fields.comment_index,
              };
            }
          } catch (error) {
            console.error(`Error fetching post ${postId}:`, error);
          }
          return null;
        })
      );
      
      const validPosts = postDetails.filter(post => post !== null);
      setPosts(validPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
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
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setIsUploadingToWalrus(true);
    setUploadError(null);
    setWaitingForTxn("createPost");

    try {
      // First upload content to Walrus
      console.log('📤 Uploading post content to Walrus...');
      const fileId = await uploadToWalrus(newPostContent);
      console.log('✅ Walrus upload successful, file ID:', fileId);

      // Then create the post with the file ID
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(forumId), // Forum is a shared object
          tx.pure.string(newPostTitle),
          tx.pure.string(fileId), // Use Walrus file ID as blob_id
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
  const loadPostContent = async (postId: string, blobId: string) => {
    if (postContents[postId] || loadingContent[postId]) {
      return; // Already loaded or loading
    }

    setLoadingContent(prev => ({ ...prev, [postId]: true }));

    try {
      const content = await readFromWalrus(blobId);
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
        
        {/* Walrus Test Panel - Only show in development */}
        {import.meta.env.DEV && (
          <WalrusBasicTest />
        )}
        
        <Flex direction="column" gap="3" mt="3">
        <Flex justify="between" align="center">
          <Text>Total Posts: {postCount}</Text>
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
              <TextArea
                placeholder="Post Content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
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
                    "Publish Post"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPostTitle("");
                    setNewPostContent("");
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
                <Card key={post.id} style={{ padding: '12px' }}>
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      <Heading size="3">{post.title}</Heading>
                      <Badge color="blue">#{index + 1}</Badge>
                    </Flex>
                    <Text size="2" color="gray">
                      Author: {post.author.slice(0, 8)}...{post.author.slice(-8)}
                    </Text>
                    
                    {/* Post Content */}
                    <div>
                      {loadingContent[post.id] ? (
                        <Flex align="center" gap="2">
                          <ClipLoader size={16} />
                          <Text size="2" color="gray">Loading content...</Text>
                        </Flex>
                      ) : postContents[post.id] ? (
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
                          onClick={() => loadPostContent(post.id, post.blob_id)}
                        >
                          📖 Load Content
                        </Button>
                      )}
                    </div>
                    
                    <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
                      File ID: {post.blob_id.slice(0, 20)}...
                    </Text>
                    <Flex gap="3" align="center" justify="between">
                      <Flex gap="3" align="center">
                        <Badge color="green">
                          💰 {(post.tip_total / 1000000000).toFixed(4)} SUI
                        </Badge>
                        <Badge color="red">
                          👎 {post.dislike_count}
                        </Badge>
                        <Badge color="blue">
                          💬 {post.comment_index} comments
                        </Badge>
                        <Text size="1" color="gray">
                          {new Date(post.created_at_ms).toLocaleString()}
                        </Text>
                      </Flex>
                      {currentAccount && currentAccount.address === post.author ? (
                        <Button
                          size="1"
                          variant="soft"
                          color="gray"
                          disabled
                        >
                          💰 Your Post
                        </Button>
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
                </Card>
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
