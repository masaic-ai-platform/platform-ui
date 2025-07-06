import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import UnifiedCard from '@/components/ui/unified-card';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import ConfigurationPanel from './ConfigurationPanel';
import PlaygroundSidebar from './PlaygroundSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
  hasThinkTags?: boolean;
}

interface PromptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface LoadingState {
  stage: 'thinking' | 'preparing' | 'searching' | 'analyzing' | 'generating' | 'creating' | 'completing' | 'streaming';
  message: string;
  toolType?: 'file_search' | 'image_generation' | 'text';
}

// Redesigned Loading Card Component with Masaic UI styling
const LoadingCard: React.FC<{ loadingState: LoadingState }> = ({ loadingState }) => {
  const getIcon = () => {
    switch (loadingState.stage) {
      case 'thinking':
      case 'streaming':
        return <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />;
      case 'preparing':
      case 'searching':
      case 'analyzing':
        return <div className="w-3 h-3 bg-positive-trend rounded-full animate-pulse" />;
      case 'generating':
      case 'creating':
        return <div className="w-3 h-3 bg-opportunity rounded-full animate-pulse" />;
      default:
        return <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse" />;
    }
  };

  const getStageColor = () => {
    switch (loadingState.toolType) {
      case 'file_search':
        return 'text-positive-trend';
      case 'image_generation':
        return 'text-opportunity';
      case 'text':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSemanticType = () => {
    switch (loadingState.toolType) {
      case 'file_search':
        return 'positive' as const;
      case 'image_generation':
        return 'opportunity' as const;
      case 'text':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="flex justify-start mb-6">
      <UnifiedCard 
        semanticType={getSemanticType()}
        showBrandAccent={false}
        className="max-w-3xl px-6 py-4"
      >
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
      </UnifiedCard>
    </div>
  );
};

const AiPlayground: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [modelProvider, setModelProvider] = useState('openai');
  const [modelName, setModelName] = useState('gpt-4o');
  const [imageModelProvider, setImageModelProvider] = useState('gemini');
  const [imageModelName, setImageModelName] = useState('imagen-3.0-generate-002');
  const [imageProviderKey, setImageProviderKey] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedVectorStore, setSelectedVectorStore] = useState<string>('');
  const [instructions, setInstructions] = useState('Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.');
  
  // Configuration parameters for AI model
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(1.0);
  const [storeLogs, setStoreLogs] = useState(true);
  
  // Prompt messages state
  const [promptMessages, setPromptMessages] = useState<PromptMessage[]>([]);
  
  // Playground state
  const [activeTab, setActiveTab] = useState('responses');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedApiKey = localStorage.getItem('aiPlayground_apiKey') || '';
    const savedBaseUrl = localStorage.getItem('aiPlayground_baseUrl') || 'http://localhost:8080';
    const savedModelProvider = localStorage.getItem('aiPlayground_modelProvider') || 'openai';
    const savedModelName = localStorage.getItem('aiPlayground_modelName') || 'gpt-4o';
    const savedImageModelProvider = localStorage.getItem('aiPlayground_imageModelProvider') || 'gemini';
    const savedImageModelName = localStorage.getItem('aiPlayground_imageModelName') || 'imagen-3.0-generate-002';
    const savedImageProviderKey = localStorage.getItem('aiPlayground_imageProviderKey') || '';
    const savedSelectedVectorStore = localStorage.getItem('aiPlayground_selectedVectorStore') || '';
    const savedInstructions = localStorage.getItem('aiPlayground_instructions') || 'Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.';
    const savedTemperature = parseFloat(localStorage.getItem('aiPlayground_temperature') || '1.0');
    const savedMaxTokens = parseInt(localStorage.getItem('aiPlayground_maxTokens') || '2048');
    const savedTopP = parseFloat(localStorage.getItem('aiPlayground_topP') || '1.0');
    const savedStoreLogs = localStorage.getItem('aiPlayground_storeLogs') === 'true';
    const savedPromptMessages = JSON.parse(localStorage.getItem('aiPlayground_promptMessages') || '[]');
    
    setApiKey(savedApiKey);
    setBaseUrl(savedBaseUrl);
    setModelProvider(savedModelProvider);
    setModelName(savedModelName);
    setImageModelProvider(savedImageModelProvider);
    setImageModelName(savedImageModelName);
    setImageProviderKey(savedImageProviderKey);
    setSelectedVectorStore(savedSelectedVectorStore);
    setInstructions(savedInstructions);
    setTemperature(savedTemperature);
    setMaxTokens(savedMaxTokens);
    setTopP(savedTopP);
    setStoreLogs(savedStoreLogs);
    setPromptMessages(savedPromptMessages);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiPlayground_apiKey', apiKey);
    localStorage.setItem('aiPlayground_baseUrl', baseUrl);
    localStorage.setItem('aiPlayground_modelProvider', modelProvider);
    localStorage.setItem('aiPlayground_modelName', modelName);
    localStorage.setItem('aiPlayground_imageModelProvider', imageModelProvider);
    localStorage.setItem('aiPlayground_imageModelName', imageModelName);
    localStorage.setItem('aiPlayground_imageProviderKey', imageProviderKey);
    localStorage.setItem('aiPlayground_selectedVectorStore', selectedVectorStore);
    localStorage.setItem('aiPlayground_instructions', instructions);
    localStorage.setItem('aiPlayground_temperature', temperature.toString());
    localStorage.setItem('aiPlayground_maxTokens', maxTokens.toString());
    localStorage.setItem('aiPlayground_topP', topP.toString());
    localStorage.setItem('aiPlayground_storeLogs', storeLogs.toString());
    localStorage.setItem('aiPlayground_promptMessages', JSON.stringify(promptMessages));
  }, [apiKey, baseUrl, modelProvider, modelName, imageModelProvider, imageModelName, imageProviderKey, selectedVectorStore, instructions, temperature, maxTokens, topP, storeLogs, promptMessages]);

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
    localStorage.setItem('aiPlayground_selectedVectorStore', vectorStoreId || '');
    
    if (vectorStoreId) {
      toast.success('Vector store selected for file search');
    } else {
      toast.success('Vector store deselected');
    }
  };

  const handleAddPromptMessage = (message: PromptMessage) => {
    setPromptMessages(prev => [...prev, message]);
    toast.success(`${message.role === 'user' ? 'User' : 'Assistant'} message added to prompt`);
  };

  const handleRemovePromptMessage = (id: string) => {
    setPromptMessages(prev => prev.filter(msg => msg.id !== id));
    toast.success('Message removed from prompt');
  };

  const generateResponse = async (prompt: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key in settings first');
      return;
    }

    setIsLoading(true);
    setLoadingState({
      stage: 'thinking',
      message: 'Preparing your request...',
      toolType: 'text'
    });

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: prompt,
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = Date.now().toString() + '_assistant';
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      type: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Construct the request with all available options
    const tools = [];
    
    // Add file search tool if vector store is selected
    if (selectedVectorStore?.trim()) {
      tools.push({
        type: "file_search",
        file_search: {
          vector_store_ids: [selectedVectorStore.trim()]
        }
      });
    }

    // Add image generation tool if image provider key is provided
    if (imageProviderKey?.trim()) {
      tools.push({
        type: "image_generation",
        image_generation: {
          provider: imageModelProvider,
          model: imageModelName,
          api_key: imageProviderKey
        }
      });
    }

    const requestBody: any = {
      model: `${modelProvider}@${modelName}`,
      messages: [
        ...(instructions.trim() ? [{ role: 'system', content: instructions }] : []),
        ...promptMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
      ...(tools.length > 0 && { tools }),
      ...(conversationId && { conversation_id: conversationId })
    };

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let toolInProgress = '';
      let isImageGeneration = false;
      let currentResponseId = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

            if (trimmedLine.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(trimmedLine.slice(6));
                
                // Store response ID for conversation tracking
                if (eventData.id && !currentResponseId) {
                  currentResponseId = eventData.id;
                }

                switch (eventData.type) {
                  case 'response.started':
                    setLoadingState({
                      stage: 'thinking',
                      message: 'Starting to process your request...',
                      toolType: 'text'
                    });
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

                  case 'response.image_generation.initiated':
                    toolInProgress = 'image_generation';
                    isImageGeneration = true;
                    if (!eventData.reasoning?.includes('searched_files')) {
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
      
      // Reset textarea height
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '130px';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(textarea.value);
    
    // Auto-resize functionality
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(Math.min(textarea.scrollHeight, 300), 130) + 'px';
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Handle API Keys tab by expanding the Quick Settings in configuration panel
    if (tab === 'api-keys') {
      // This will be handled by the configuration panel
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar - 10% */}
      <PlaygroundSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Configuration Panel - 30% */}
      <ConfigurationPanel
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
        apiKey={apiKey}
        setApiKey={setApiKey}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        topP={topP}
        setTopP={setTopP}
        storeLogs={storeLogs}
        setStoreLogs={setStoreLogs}
        instructions={instructions}
        setInstructions={setInstructions}
        promptMessages={promptMessages}
        onAddPromptMessage={handleAddPromptMessage}
        onRemovePromptMessage={handleRemovePromptMessage}
        selectedVectorStore={selectedVectorStore}
        onVectorStoreSelect={handleVectorStoreSelect}
        onResetConversation={resetConversation}
      />

      {/* Chat Area - 60% */}
      <div className="w-[60%] flex flex-col">
        {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Start a conversation...</p>
            </div>
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

        {/* Input Area */}
        <div className="bg-background px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Chat with your prompt..."
                className="w-full min-h-[130px] max-h-[300px] resize-none rounded-xl border border-border bg-muted/50 px-4 py-4 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-positive-trend/60 focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-positive-trend/60 transition-all duration-200"
                disabled={isLoading}
                rows={1}
                style={{ 
                  lineHeight: '1.5',
                  paddingTop: '18px',
                  paddingBottom: '18px',
                  boxShadow: 'none !important',
                  outline: 'none !important'
                }}
              />
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Auto-clear conversation"
                  onClick={resetConversation}
                >
                  <span className="text-xs">🔄</span>
                </Button>
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-positive-trend hover:bg-positive-trend/90 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={inputValue.trim() ? "Send message" : "Type a message to send"}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiPlayground; 