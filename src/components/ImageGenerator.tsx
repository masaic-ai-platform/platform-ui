import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Trash, Settings, FileText, Sparkles } from 'lucide-react';
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
  hasThinkTags?: boolean;
}

interface LoadingState {
  stage: 'thinking' | 'preparing' | 'searching' | 'analyzing' | 'generating' | 'creating' | 'completing' | 'streaming';
  message: string;
  toolType?: 'file_search' | 'image_generation' | 'text';
}

// Redesigned Loading Card Component with Geist UI styling
const LoadingCard: React.FC<{ loadingState: LoadingState }> = ({ loadingState }) => {
  const getIcon = () => {
    switch (loadingState.stage) {
      case 'thinking':
      case 'streaming':
        return <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />;
      case 'preparing':
      case 'searching':
      case 'analyzing':
        return <div className="w-3 h-3 bg-success rounded-full animate-pulse" />;
      case 'generating':
      case 'creating':
        return <div className="w-3 h-3 bg-warning rounded-full animate-pulse" />;
      default:
        return <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse" />;
    }
  };

  const getStageColor = () => {
    switch (loadingState.toolType) {
      case 'file_search':
        return 'text-success';
      case 'image_generation':
        return 'text-warning';
      case 'text':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex justify-start mb-6">
      <Card className="max-w-3xl px-6 py-4 bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getStageColor()}`}>
              {loadingState.message}
            </p>
            <div className="mt-3 flex space-x-1">
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
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Track the current event type from event: lines
            let currentEventType = '';
            if (trimmedLine.startsWith('event:')) {
              currentEventType = trimmedLine.substring(6).trim();
              
              // Directly update loading state based on event type
              if (currentEventType === 'response.image_generation.in_progress') {
                toolInProgress = 'image_generation';
                isImageGeneration = true;
                setLoadingState({
                  stage: 'generating',
                  message: 'Generating your image...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.image_generation.executing') {
                setLoadingState({
                  stage: 'creating',
                  message: 'Generating your image...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.image_generation.completed') {
                toolInProgress = '';
                setLoadingState({
                  stage: 'completing',
                  message: 'Image ready! Finalizing...',
                  toolType: 'image_generation'
                });
              }
              else if (currentEventType === 'response.file_search.in_progress') {
                toolInProgress = 'file_search';
                setLoadingState({
                  stage: 'searching',
                  message: 'Searching through your documents...',
                  toolType: 'file_search'
                });
              }
              else if (currentEventType === 'response.file_search.executing') {
                setLoadingState({
                  stage: 'analyzing',
                  message: 'Analyzing document content...',
                  toolType: 'file_search'
                });
              }
              else if (currentEventType === 'response.file_search.completed') {
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
                
                if (eventDataStr === '[DONE]') {
                  break;
                }

                const eventData = JSON.parse(eventDataStr);

                switch (eventData.type) {
                  case 'response.created':
                    currentResponseId = eventData.response?.id;
                    // Don't set conversationId yet - wait for successful completion
                    break;

                  case 'response.in_progress':
                    setLoadingState({
                      stage: 'thinking',
                      message: 'Processing your request...',
                      toolType: 'text'
                    });
                    break;

                  case 'response.output_item.added':
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
                    setLoadingState({
                      stage: 'streaming',
                      message: 'Generating response...',
                      toolType: 'text'
                    });
                    // Stream each delta directly by appending to existing content
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { 
                            ...msg, 
                            content: msg.content + eventData.delta, 
                            type: 'text',
                            hasThinkTags: (msg.content + eventData.delta).includes('<think>')
                          }
                        : msg
                    ));
                    break;

                  case 'response.output_text.done':
                    setLoadingState(null); // Hide loading card
                    // Use the complete text from the done event
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId 
                        ? { 
                            ...msg, 
                            content: eventData.text, 
                            type: 'text',
                            hasThinkTags: eventData.text.includes('<think>')
                          }
                        : msg
                    ));
                    break;

                  case 'response.image_generation.in_progress':
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
                    setLoadingState({
                      stage: 'creating',
                      message: 'Generating your image...',
                      toolType: 'image_generation'
                    });
                    break;

                  case 'response.image_generation.completed':
                    toolInProgress = '';
                    setLoadingState({
                      stage: 'completing',
                      message: 'Image ready! Finalizing...',
                      toolType: 'image_generation'
                    });
                    toast.success('Image generated successfully!');
                    break;

                  case 'response.file_search.in_progress':
                    toolInProgress = 'file_search';
                    setLoadingState({
                      stage: 'searching',
                      message: 'Searching through your documents...',
                      toolType: 'file_search'
                    });
                    toast.info('Searching documents...');
                    break;

                  case 'response.file_search.executing':
                    setLoadingState({
                      stage: 'analyzing',
                      message: 'Analyzing document content...',
                      toolType: 'file_search'
                    });
                    break;

                  case 'response.file_search.completed':
                    toolInProgress = '';
                    setLoadingState({
                      stage: 'completing',
                      message: 'Document search completed!',
                      toolType: 'file_search'
                    });
                    toast.success('Document search completed!');
                    break;

                  case 'response.completed':
                    setLoadingState(null); // Hide loading card
                    
                    // Only set conversationId on successful completion
                    if (currentResponseId) {
                      setConversationId(currentResponseId);
                    }
                    
                    if (eventData.response?.output && eventData.response.output.length > 0) {
                      const output = eventData.response.output[0];
                      
                      // Check for new format with result field (for images)
                      if (output.result) {
                        // Check if result contains image tag
                        const isImage = output.result.includes('<image>');
                        
                        // Update the final message with the complete content
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessageId 
                            ? { 
                                ...msg, 
                                content: output.result,
                                type: isImage ? 'image' : 'text',
                                hasThinkTags: !isImage && output.result.includes('<think>')
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
                        
                        // Update the final message with the complete content
                        setMessages(prev => prev.map(msg => 
                          msg.id === assistantMessageId 
                            ? { 
                                ...msg, 
                                content: content.text || '',
                                type: content.type === 'image' ? 'image' : 'text',
                                hasThinkTags: content.type !== 'image' && (content.text || '').includes('<think>')
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
    <div className="flex flex-col h-full bg-background relative">

      {/* Redesigned Floating Action Buttons with Geist UI styling */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={resetConversation}
          title="Reset conversation"
                      className="h-12 w-12 rounded-lg shadow-md bg-background hover:bg-accent border border-border hover:border-ring transition-all duration-200"
        >
                      <Trash className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="flex flex-col space-y-4">
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

      {/* Messages Area with Geist UI styling */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 text-center max-w-2xl mx-auto bg-card border border-border shadow-sm max-h-[80vh] overflow-y-auto">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <h2 className="text-lg font-semibold mb-4 text-foreground">Get Started</h2>
              
              <div className="mb-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                <h3 className="text-base font-semibold mb-3 text-primary dark:text-primary-light">Prerequisites:</h3>
                <div className="text-left space-y-3">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">1. Run OpenResponses server with Docker:</p>
                    <code className="block bg-muted text-success text-xs p-2 rounded font-mono border border-border">
                      docker run -p 8080:8080 masaicai/open-responses:latest
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">2. Expose port 8080 using ngrok:</p>
                    <code className="block bg-muted text-success text-xs p-2 rounded font-mono border border-border">
                      ngrok http 8080
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: <code className="bg-muted px-1 rounded">https://abc123.ngrok.io</code>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">3. Configure API settings:</p>
                    <p className="text-xs text-muted-foreground">
                      Enter the ngrok URL as Base URL in settings ⚙️
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chat with AI and generate amazing images! Ask questions, request images, or have a conversation.
                {selectedVectorStore && (
                  <span className="block mt-2 text-xs text-primary dark:text-primary-light font-medium">
                    📁 File search enabled - AI can search your documents.
                  </span>
                )}
                <span className="block mt-2 text-xs">
                  Configure your API settings first!
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
                hasThinkTags={message.hasThinkTags}
                apiKey={apiKey}
                baseUrl={baseUrl}
                modelProvider={modelProvider}
                modelName={modelName}
                imageModelProvider={imageModelProvider}
                imageModelName={imageModelName}
                imageProviderKey={imageProviderKey}
                selectedVectorStore={selectedVectorStore}
                instructions={instructions}
              />
            ))}
            {loadingState && <LoadingCard loadingState={loadingState} />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Redesigned Input Area with Geist UI styling */}
                <div className="bg-background border-t border-border px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything or describe an image you want to generate..."
              className="flex-1 h-12 resize-none focus:ring-0 transition-colors duration-200 py-3 leading-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="h-12 bg-success hover:bg-success-light dark:hover:bg-success-dark text-white font-medium px-6 transition-colors duration-200 shadow-sm hover:shadow-md"
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
