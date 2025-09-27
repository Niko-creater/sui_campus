import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, Coins } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface CreatePostProps {
  onCreatePost: (title: string, content: string, category: string) => boolean;
  userBalance: number;
  categories: Record<string, string[]>;
}

const POST_GAS_FEE = 10;

export function CreatePost({ onCreatePost, userBalance, categories }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCategories = Object.values(categories).flat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category) {
      return;
    }

    if (userBalance < POST_GAS_FEE) {
      return;
    }

    setIsSubmitting(true);
    
    const success = onCreatePost(title.trim(), content.trim(), category);
    
    if (success) {
      setTitle('');
      setContent('');
      setCategory('');
    }
    
    setIsSubmitting(false);
  };

  const canAffordPost = userBalance >= POST_GAS_FEE;

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-indigo-50 border-indigo-100 shadow-lg">
      <div className="mb-4">
        <h2 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold mb-2">Create New Post</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Coins className="h-4 w-4" />
          <span>Gas Fee: {POST_GAS_FEE} tokens</span>
        </div>
      </div>

      {!canAffordPost && (
        <Alert className="mb-4 bg-gradient-to-r from-rose-50 to-red-50 border-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-rose-700">
            Insufficient balance. You need at least {POST_GAS_FEE} tokens to create a post.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select value={category} onValueChange={setCategory} disabled={!canAffordPost}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([mainCategory, subCategories]) => (
                <div key={mainCategory}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">
                    {mainCategory}
                  </div>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory} value={subCategory}>
                      {subCategory}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            required
            disabled={!canAffordPost}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts with the community..."
            rows={6}
            required
            disabled={!canAffordPost}
          />
        </div>

        <Button
          type="submit"
          disabled={!canAffordPost || !title.trim() || !content.trim() || !category || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Creating Post...' : `Create Post (${POST_GAS_FEE} tokens)`}
        </Button>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-sm mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Creating a post costs {POST_GAS_FEE} gas tokens</li>
          <li>• Other users can tip your posts to show appreciation</li>
          <li>• Posts can be voted for promotion or deletion</li>
          <li>• Quality content earns reputation and tips</li>
        </ul>
      </div>
    </Card>
  );
}