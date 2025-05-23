import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Trash, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import SettingsModal from './SettingsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
}

const ImageGenerator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [modelProvider, setModelProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4.1-mini');
  const [imageModelProvider, setImageModelProvider] = useState('gemini');
  const [imageModelName, setImageModelName] = useState('imagen-3.0-generate-002');
  const [imageProviderKey, setImageProviderKey] = useState('');
  const [lastMessageWasImage, setLastMessageWasImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedApiKey = localStorage.getItem('imageGen_apiKey') || '';
    const savedBaseUrl = localStorage.getItem('imageGen_baseUrl') || 'http://localhost:8080';
    const savedModelProvider = localStorage.getItem('imageGen_modelProvider') || 'openai';
    const savedModelName = localStorage.getItem('imageGen_modelName') || 'gpt-4.1-mini';
    const savedImageModelProvider = localStorage.getItem('imageGen_imageModelProvider') || 'gemini';
    const savedImageModelName = localStorage.getItem('imageGen_imageModelName') || 'imagen-3.0-generate-002';
    const savedImageProviderKey = localStorage.getItem('imageGen_imageProviderKey') || '';
    
    setApiKey(savedApiKey);
    setBaseUrl(savedBaseUrl);
    setModelProvider(savedModelProvider);
    setModelName(savedModelName);
    setImageModelProvider(savedImageModelProvider);
    setImageModelName(savedImageModelName);
    setImageProviderKey(savedImageProviderKey);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
    setLastMessageWasImage(false);
    toast.success('Conversation reset');
  };

  const generateImage = async (prompt: string) => {
    // Check if we need to reset the conversation based on previous messages
    if (lastMessageWasImage) {
      resetConversation();
    }

    if (!apiKey.trim()) {
      toast.error('Please set your API key in settings first');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const modelString = `${modelProvider}@${modelName}`;
      
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelString,
          stream: false,
          messages: [
            {
              role: "system",
              content: "You are a helpful image generation agent."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          tools: [{
            type: "image_generation",
            model: `${imageModelProvider}@${imageModelName}`,
            image_provider_key: imageProviderKey
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const message = data.choices[0].message;
        const isImageResponse = message.type === 'image';
        
        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: message.content,
          type: isImageResponse ? 'image' : 'text',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setLastMessageWasImage(isImageResponse);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please check your settings and try again.');
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating the image. Please try again.',
        type: 'text',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setLastMessageWasImage(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      generateImage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* GitHub Star Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2">
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span>Like this project? Star us on GitHub!</span>
          <a 
            href="https://github.com/masaic-ai-platform/open-responses" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors duration-200"
          >
            <span className="font-medium">⭐ Star</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OpenResponses ImageGen</h1>
          <p className="text-sm text-gray-500">Create amazing images with OpenResponses API</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={resetConversation}
            title="Reset conversation"
          >
            <Trash className="h-4 w-4" />
          </Button>
          <SettingsModal 
            apiKey={apiKey}
            setApiKey={setApiKey}
            baseUrl={baseUrl}
            setBaseUrl={setBaseUrl}
            modelProvider={modelProvider}
            setModelProvider={setModelProvider}
            modelName={modelName}
            setModelName={setModelName}
            imageModelProvider={imageModelProvider}
            setImageModelProvider={setImageModelProvider}
            imageModelName={imageModelName}
            setImageModelName={setImageModelName}
            imageProviderKey={imageProviderKey}
            setImageProviderKey={setImageProviderKey}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center max-w-md">
              <h2 className="text-xl font-semibold mb-2">Welcome to AI Image Generator</h2>
              <p className="text-gray-600">
                Type a description below to generate amazing images with AI.
                Don't forget to configure your API settings first!
              </p>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                type={message.type}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating image...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the image you want to generate..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImageGenerator;
