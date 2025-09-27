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

  const createPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setWaitingForTxn("createPost");

    const tx = new Transaction();
    tx.moveCall({
      arguments: [
        tx.object(forumId), // Forum is a shared object
        tx.pure.string(newPostTitle),
        tx.pure.string(newPostContent), // This will be used as blob_id
        tx.object("0x6"), // Clock object - this should be the correct way
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
      },
    );
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
              <Flex gap="2">
                <Button
                  onClick={createPost}
                  disabled={waitingForTxn !== ""}
                >
                  {waitingForTxn === "createPost" ? (
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
                    <Text>{post.blob_id}</Text>
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
