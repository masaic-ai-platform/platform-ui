import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Trash, Star, ExternalLink, Search, Palette, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import SettingsModal from './SettingsModal';
import DocumentModal from './DocumentModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
}

interface LoadingState {
  stage: 'thinking' | 'preparing' | 'searching' | 'analyzing' | 'generating' | 'creating' | 'completing' | 'streaming';
  message: string;
  toolType?: 'file_search' | 'image_generation' | 'text';
}

// Beautiful Loading Card Component
const LoadingCard: React.FC<{ loadingState: LoadingState }> = ({ loadingState }) => {
  const getIcon = () => {
    switch (loadingState.stage) {
      case 'thinking':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'preparing':
      case 'searching':
      case 'analyzing':
        return <Search className="h-5 w-5 text-green-500" />;
      case 'generating':
      case 'creating':
        return <Palette className="h-5 w-5 text-purple-500" />;
      case 'streaming':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundGradient = () => {
    switch (loadingState.toolType) {
      case 'file_search':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'image_generation':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'text':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  return (
    <div className="flex justify-start mb-4">
      <Card className={`max-w-3xl px-4 py-3 border-2 ${getBackgroundGradient()} shadow-sm`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            {getIcon()}
            <div className="absolute inset-0 animate-ping">
              {getIcon()}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{loadingState.message}</p>
            <div className="mt-2 flex space-x-1">
              <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="h-1 w-2 bg-current opacity-60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ImageGenerator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [modelProvider, setModelProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4.1-mini');
  const [imageModelProvider, setImageModelProvider] = useState('gemini');
  const [imageModelName, setImageModelName] = useState('imagen-3.0-generate-002');
  const [imageProviderKey, setImageProviderKey] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedVectorStore, setSelectedVectorStore] = useState<string>('');
  const [instructions, setInstructions] = useState('Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.');
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
    const savedSelectedVectorStore = localStorage.getItem('imageGen_selectedVectorStore') || '';
    const savedInstructions = localStorage.getItem('imageGen_instructions') || 'Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.';
    
    setApiKey(savedApiKey);
    setBaseUrl(savedBaseUrl);
    setModelProvider(savedModelProvider);
    setModelName(savedModelName);
    setImageModelProvider(savedImageModelProvider);
    setImageModelName(savedImageModelName);
    setImageProviderKey(savedImageProviderKey);
    setSelectedVectorStore(savedSelectedVectorStore);
    setInstructions(savedInstructions);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    toast.success('Conversation reset');
  };

  const handleVectorStoreSelect = (vectorStoreId: string | null) => {
    setSelectedVectorStore(vectorStoreId || '');
    localStorage.setItem('imageGen_selectedVectorStore', vectorStoreId || '');
    
    if (vectorStoreId) {
      toast.success('Vector store selected for file search');
    } else {
      toast.success('Vector store deselected');
    }
  };

  const generateResponse = async (prompt: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key in settings first');
      return;
    }

    setIsLoading(true);
    setLoadingState({
      stage: 'thinking',
      message: 'Starting your request...',
      toolType: 'text'
    });

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Create placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      type: 'text',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const modelString = `${modelProvider}@${modelName}`;
      
      const requestBody: any = {
        model: modelString,
        store: true,
        tools: [{
          type: "image_generation",
          model: `${imageModelProvider}@${imageModelName}`,
          model_provider_key: imageProviderKey
        }],
        input: prompt,
        stream: true // Enable streaming
      };

      // Add file_search tool if vector store is selected
      if (selectedVectorStore) {
        requestBody.tools.push({
          type: "file_search",
          vector_store_ids: [selectedVectorStore],
          max_num_results: 5,
          filters: {
            type: "eq",
            key: "language",
            value: "en"
          }
        });
        requestBody.instructions = instructions;
      }

      // Add previous_response_id for subsequent requests (continue conversation)
      if (conversationId) {
        requestBody.previous_response_id = conversationId;
      }

      console.log('Sending streaming request:', requestBody);
      
      const response = await fetch(`${baseUrl}/v1/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      console.log('Starting SSE stream processing...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentResponseId = '';
      let isImageGeneration = false;
      let toolInProgress = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('SSE stream completed');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            console.log('Processing SSE line:', trimmedLine);

            // Track the current event type from event: lines
            let currentEventType = '';
            if (trimmedLine.startsWith('event:')) {
              currentEventType = trimmedLine.substring(6).trim();
              console.log('Event type detected:', currentEventType);
              
              // Directly update loading state based on event type
              if (currentEventType === 'response.image_generation.in_progress') {
                console.log('🎨 Image generation in progress (from event line)');
                toolInProgress = 'image_generation';
                isImageGeneration = true;
                setLoadingState({
                  stage: 'generating',
                  message: 'Generating your image...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.image_generation.executing') {
                console.log('🎨 Image generation executing (from event line)');
                setLoadingState({
                  stage: 'creating',
                  message: 'Creating your beautiful image...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.image_generation.completed') {
                console.log('🎨 Image generation completed (from event line)');
                toolInProgress = '';
                setLoadingState({
                  stage: 'completing',
                  message: 'Image ready! Finalizing...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.file_search.in_progress') {
                console.log('📁 File search in progress (from event line)');
                toolInProgress = 'file_search';
                setLoadingState({
                  stage: 'searching',
                  message: 'Searching through your documents...',
                  toolType: 'file_search'
                });
              }
              else if (currentEventType === 'response.file_search.executing') {
                console.log('📁 File search executing (from event line)');
                setLoadingState({
                  stage: 'analyzing',
                  message: 'Analyzing document content...',
                  toolType: 'file_search'
                });
              }
              else if (currentEventType === 'response.file_search.completed') {
                console.log('📁 File search completed (from event line)');
                toolInProgress = '';
                setLoadingState({
                  stage: 'completing',
                  message: 'Document search completed!',
                  toolType: 'file_search'
                });
              }
              
              continue;
            }

            if (trimmedLine.startsWith('data: ')) {
              try {
                const eventDataStr = trimmedLine.substring(6).trim();
                console.log('Attempting to parse event data:', eventDataStr);
                
                if (eventDataStr === '[DONE]') {
                  console.log('Stream finished with [DONE]');
                  break;
                }

                const eventData = JSON.parse(eventDataStr);
                console.log('✅ Successfully parsed event data. Type:', eventData.type, 'Full data:', eventData);

                switch (eventData.type) {
                  case 'response.created':
                    console.log('Response created:', eventData.response?.id);
                    currentResponseId = eventData.response?.id;
                    // Don't set conversationId yet - wait for successful completion
                    break;

                  case 'response.in_progress':
                    console.log('Response in progress');
                    setLoadingState({
                      stage: 'thinking',
                      message: 'Processing your request...',
                      toolType: 'text'
                    });
                    break;

                  case 'response.output_item.added':
                    console.log('Output item added:', eventData.item);
                    if (eventData.item?.name === 'file_search') {
                      setLoadingState({
                        stage: 'preparing',
                        message: 'Preparing to search documents...',
                        toolType: 'file_search'
                      });
                    } else if (eventData.item?.name === 'image_generation') {
                      setLoadingState({
                        stage: 'preparing',
                        message: 'Preparing to generate image...',
                        toolType: 'image_generation'
                      });
                    }
                    break;

                  case 'response.output_text.delta':
                    console.log('Text delta received:', eventData.delta);
                    setLoadingState({
                      stage: 'streaming',
                      message: 'Generating response...',
                      toolType: 'text'
                    });
                    // Stream each delta directly by appending to existing content
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: msg.content + eventData.delta, type: 'text' }
                        : msg
                    ));
                    break;

                  case 'response.output_text.done':
                    console.log('Text done:', eventData.text);
                    setLoadingState(null); // Hide loading card
                    // Use the complete text from the done event
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { ...msg, content: eventData.text, type: 'text' }
                        : msg
                    ));
                    break;

                  case 'response.image_generation.in_progress':
                    console.log('🎨 Image generation in progress - UPDATING LOADING STATE');
                    toolInProgress = 'image_generation';
                    isImageGeneration = true;
                    setLoadingState({
                      stage: 'generating',
                      message: 'Generating your image...',
                      toolType: 'image_generation'
                    });
                    toast.info('Image generation started...');
                    break;

                  case 'response.image_generation.executing':
                    console.log('🎨 Image generation executing - UPDATING LOADING STATE TO CREATING');
                    setLoadingState({
                      stage: 'creating',
                      message: 'Creating your beautiful image...',
                      toolType: 'image_generation'
                    });
                    break;

                  case 'response.image_generation.completed':
                    console.log('🎨 Image generation completed - UPDATING LOADING STATE TO COMPLETING');
                    toolInProgress = '';
                    setLoadingState({
                      stage: 'completing',
                      message: 'Image ready! Finalizing...',
                      toolType: 'image_generation'
                    });
                    toast.success('Image generated successfully!');
                    break;

                  case 'response.file_search.in_progress':
                    console.log('📁 File search in progress - UPDATING LOADING STATE:', eventData);
                    toolInProgress = 'file_search';
                    setLoadingState({
                      stage: 'searching',
                      message: 'Searching through your documents...',
                      toolType: 'file_search'
                    });
                    toast.info('Searching documents...');
                    break;

                  case 'response.file_search.executing':
                    console.log('📁 File search executing - UPDATING LOADING STATE TO ANALYZING:', eventData);
                    setLoadingState({
                      stage: 'analyzing',
                      message: 'Analyzing document content...',
                      toolType: 'file_search'
                    });
                    break;

                  case 'response.file_search.completed':
                    console.log('📁 File search completed - UPDATING LOADING STATE TO COMPLETING:', eventData);
                    toolInProgress = '';
                    setLoadingState({
                      stage: 'completing',
                      message: 'Document search completed!',
                      toolType: 'file_search'
                    });
                    toast.success('Document search completed!');
                    break;

                  case 'response.completed':
                    console.log('Response completed:', eventData.response);
                    setLoadingState(null); // Hide loading card
                    
                    // Only set conversationId on successful completion
                    if (currentResponseId) {
                      setConversationId(currentResponseId);
                    }
                    
                    if (eventData.response?.output && eventData.response.output.length > 0) {
                      const output = eventData.response.output[0];
                      
                      // Check for new format with result field (for images)
                      if (output.result) {
                        console.log('Final content received (new format):', {
                          result: output.result,
                          isImage: output.result.includes('<image>')
                        });
                        
                        // Check if result contains image tag
                        const isImage = output.result.includes('<image>');
                        
                        // Update the final message with the complete content
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessageId 
                            ? { 
                                ...msg, 
                                content: output.result,
                                type: isImage ? 'image' : 'text'
                              }
                            : msg
                        ));

                        if (isImage) {
                          toast.success('Image generated successfully!');
                        } else {
                          toast.success('Response completed!');
                        }
                      }
                      // Fallback to old format for backward compatibility
                      else if (output.content && output.content.length > 0) {
                        const content = output.content[0];
                        
                        console.log('Final content received (old format):', {
                          type: content.type,
                          textLength: content.text?.length,
                          isImage: content.type === 'image'
                        });
                        
                        // Update the final message with the complete content
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessageId 
                            ? { 
                                ...msg, 
                                content: content.text || '',
                                type: content.type === 'image' ? 'image' : 'text'
                              }
                            : msg
                        ));

                        if (content.type === 'image') {
                          toast.success('Image generated successfully!');
                        } else {
                          toast.success('Response completed!');
                        }
                      }
                    }
                    break;

                  default:
                    console.log('❓ Unhandled event type:', eventData.type, 'Full event data:', eventData);
                    break;
                }
              } catch (parseError) {
                console.error('❌ Error parsing SSE data:', parseError, 'Original line:', trimmedLine);
                console.error('Parse error details:', parseError.message);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error generating response:', error);
      toast.error('Failed to generate response. Please check your settings and try again.');
      
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error while processing your request. Please try again.',
              type: 'text'
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setLoadingState(null); // Ensure loading card is hidden
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      generateResponse(inputValue.trim());
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
          <h1 className="text-2xl font-bold text-gray-900">OpenResponses Chat</h1>
          <p className="text-sm text-gray-500">
            Chat with AI and generate images using OpenResponses API
            {selectedVectorStore && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📁 File Search Enabled
              </span>
            )}
          </p>
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
          <DocumentModal
            apiKey={apiKey}
            baseUrl={baseUrl}
            selectedVectorStore={selectedVectorStore}
            onVectorStoreSelect={handleVectorStoreSelect}
          />
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
            instructions={instructions}
            setInstructions={setInstructions}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Welcome to OpenResponses Chat</h2>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Prerequisites:</h3>
                <div className="text-left space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">1. Run OpenResponses server with Docker:</p>
                    <code className="block bg-gray-800 text-green-400 text-xs p-2 rounded font-mono">
                      docker run -p 8080:8080 masaicai/open-responses:latest
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">2. Expose port 8080 using ngrok:</p>
                    <code className="block bg-gray-800 text-green-400 text-xs p-2 rounded font-mono">
                      ngrok http 8080
                    </code>
                    <p className="text-xs text-gray-600 mt-1">
                      Example output: <code className="bg-gray-100 px-1 rounded">https://abc123.ngrok.io</code>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">3. Configure API settings:</p>
                    <p className="text-xs text-gray-600">
                      Copy the ngrok URL (e.g., <code className="bg-gray-100 px-1 rounded">https://abc123.ngrok.io</code>) and enter it as the Base URL in the API settings ⚙️
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600">
                Chat with AI and generate amazing images! Ask questions, request images, or have a conversation.
                {selectedVectorStore && (
                  <span className="block mt-2 text-sm text-blue-600">
                    📁 File search enabled - AI can search your documents for relevant information.
                  </span>
                )}
                <span className="block mt-2 text-sm">
                  Don't forget to configure your API settings first!
                </span>
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
            {loadingState && <LoadingCard loadingState={loadingState} />}
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
              placeholder="Ask me anything or describe an image you want to generate..."
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
