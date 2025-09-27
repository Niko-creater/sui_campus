import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar, Vote } from 'lucide-react';

interface CreateEventProps {
  onCreateEvent: (title: string, description: string) => boolean;
}

export function CreateEvent({ onCreateEvent }: CreateEventProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    const success = onCreateEvent(title.trim(), description.trim());
    
    if (success) {
      setTitle('');
      setDescription('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
          Create New Event
        </h2>
        <p className="text-gray-600">
          Create a community event that members can vote on with their tokens.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
            Event Title
          </label>
          <Input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Should we implement a new feature?"
            required
          />
        </div>

        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed information about what community members are voting on..."
            rows={5}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={!title.trim() || !description.trim() || isSubmitting}
          className="w-full"
        >
          <Vote className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-sm mb-2 text-blue-800">Event Voting Guidelines:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Members vote by staking tokens (tips) for or against</li>
          <li>• Vote weight is proportional to tokens staked</li>
          <li>• Events help guide community decisions democratically</li>
          <li>• All members can participate regardless of reputation</li>
        </ul>
      </div>
    </Card>
  );
}