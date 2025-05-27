import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code, Copy, Check, X } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  timestamp: Date;
  // New props for code generation
  apiKey?: string;
  baseUrl?: string;
  modelProvider?: string;
  modelName?: string;
  imageModelProvider?: string;
  imageModelName?: string;
  imageProviderKey?: string;
  selectedVectorStore?: string;
  instructions?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  type = 'text', 
  timestamp,
  apiKey = '',
  baseUrl = 'http://localhost:8080',
  modelProvider = 'openai',
  modelName = 'gpt-4.1-mini',
  imageModelProvider = 'gemini',
  imageModelName = 'imagen-3.0-generate-002',
  imageProviderKey = '',
  selectedVectorStore = '',
  instructions = 'Answer questions using information from the provided documents when relevant. For image generation requests, create images as requested.'
}) => {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('curl');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);

  // Function to mask API keys
  const maskApiKey = (key: string): string => {
    if (!key || key === 'YOUR_API_KEY' || key === 'YOUR_IMAGE_PROVIDER_KEY') {
      return key;
    }
    if (key.length <= 8) {
      return '*'.repeat(key.length);
    }
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  // Function to check if content looks like a base64 image
  const isImageContent = (content: string): boolean => {
    // Remove any data URL prefix if present
    const cleanContent = content.replace(/^data:image\/[^;]+;base64,/, '').trim();
    
    // Check if it looks like base64 and has image signatures
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanContent);
    
    // Check for common image format signatures
    const hasImageSignature = 
      cleanContent.startsWith('/9j/') ||     // JPEG
      cleanContent.startsWith('FFD8') ||     // JPEG hex
      cleanContent.startsWith('/9j') ||      // JPEG variant
      cleanContent.startsWith('iVBORw0KGgo') || // PNG
      cleanContent.startsWith('89504E47') ||    // PNG hex
      cleanContent.startsWith('iVBORw') ||      // PNG variant
      cleanContent.startsWith('UklGR') ||       // WebP (RIFF)
      cleanContent.startsWith('UklGRg') ||      // WebP variant
      cleanContent.startsWith('R0lGODlh') ||    // GIF
      cleanContent.startsWith('R0lGODdh') ||    // GIF variant
      cleanContent.startsWith('R0lGOD');        // GIF variant

    // Must be valid base64, have image signature, and be reasonably long
    return isValidBase64 && hasImageSignature && cleanContent.length > 100;
  };

  // Function to validate and clean base64 image data
  const validateAndCleanBase64 = (base64Content: string): { isValid: boolean; cleanBase64: string; issues: string[] } => {
    const issues: string[] = [];
    let cleanBase64 = base64Content.replace(/^data:image\/[^;]+;base64,/, '');
    
    // Remove any whitespace or newlines
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    // Check if base64 is properly padded (should be multiple of 4)
    const paddingNeeded = cleanBase64.length % 4;
    if (paddingNeeded > 0) {
      const padding = '='.repeat(4 - paddingNeeded);
      cleanBase64 += padding;
      issues.push(`Added ${4 - paddingNeeded} padding characters`);
    }
    
    // Check if it's valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isValidBase64 = base64Regex.test(cleanBase64);
    
    if (!isValidBase64) {
      issues.push('Contains invalid base64 characters');
    }
    
    // Check minimum length (a valid image should be at least a few KB)
    if (cleanBase64.length < 100) {
      issues.push('Base64 data too short for valid image');
    }
    
    // Log for debugging
    console.log('Base64 validation:', {
      originalLength: base64Content.length,
      cleanLength: cleanBase64.length,
      isValidBase64,
      issues,
      firstChars: cleanBase64.substring(0, 30),
      lastChars: cleanBase64.substring(-20)
    });
    
    return {
      isValid: isValidBase64 && cleanBase64.length >= 100,
      cleanBase64,
      issues
    };
  };

  // Function to detect image format from base64 content
  const detectImageFormat = (base64Content: string): string => {
    // Remove any data URL prefix if present
    const cleanBase64 = base64Content.replace(/^data:image\/[^;]+;base64,/, '');
    
    // Check common image format signatures
    // JPEG signatures
    if (cleanBase64.startsWith('/9j/') || cleanBase64.startsWith('FFD8') || cleanBase64.startsWith('/9j')) {
      return 'jpeg';
    } 
    // PNG signatures
    else if (cleanBase64.startsWith('iVBORw0KGgo') || cleanBase64.startsWith('89504E47') || cleanBase64.startsWith('iVBORw')) {
      return 'png';
    } 
    // WebP signatures - WebP files start with "RIFF" and contain "WEBP"
    else if (cleanBase64.startsWith('UklGR') || cleanBase64.includes('V0VCUCg') || cleanBase64.startsWith('UklGRg') || cleanBase64.includes('V0VCUFZQOCg')) {
      return 'webp';
    }
    // GIF signatures
    else if (cleanBase64.startsWith('R0lGODlh') || cleanBase64.startsWith('R0lGODdh') || cleanBase64.startsWith('R0lGOD')) {
      return 'gif';
    }
    
    // If we can't detect the format, try to guess based on common patterns
    // Many image generation APIs default to specific formats
    if (cleanBase64.length > 0) {
      // Log the first few characters to help with debugging
      console.log('Image format detection - first 20 chars:', cleanBase64.substring(0, 20));
      
      // If it looks like a valid base64 image but we can't detect format,
      // try each format in order of likelihood
      return 'jpeg'; // Most common for AI-generated images
    }
    
    // Fallback
    return 'png';
  };

  // Generate cURL code example
  const generateCurlCode = () => {
    const modelString = `${modelProvider}@${modelName}`;
    
    const requestBody: any = {
      model: modelString,
      store: true,
      tools: [{
        type: "image_generation",
        model: `${imageModelProvider}@${imageModelName}`,
        model_provider_key: imageProviderKey || "YOUR_IMAGE_PROVIDER_KEY"
      }],
      input: content,
      stream: true
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

    // Mask the API key in the request body for display
    const displayRequestBody = {
      ...requestBody,
      tools: requestBody.tools.map((tool: any) => ({
        ...tool,
        model_provider_key: tool.model_provider_key ? maskApiKey(tool.model_provider_key) : undefined
      }))
    };

    return `curl -X POST "${baseUrl}/v1/responses" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${maskApiKey(apiKey || 'YOUR_API_KEY')}" \\
  -H "Accept: text/event-stream" \\
  -d '${JSON.stringify(displayRequestBody, null, 2).replace(/'/g, "'\\''")}' \\
  --no-buffer`;
  };

  // Generate Python code example
  const generatePythonCode = () => {
    const modelString = `${modelProvider}@${modelName}`;
    
    const tools: any[] = [{
      type: "image_generation",
      model: `${imageModelProvider}@${imageModelName}`,
      model_provider_key: imageProviderKey || "YOUR_IMAGE_PROVIDER_KEY"
    }];

    // Add file_search tool if vector store is selected
    if (selectedVectorStore) {
      tools.push({
        type: "file_search",
        vector_store_ids: [selectedVectorStore],
        max_num_results: 5,
        filters: {
          type: "eq",
          key: "language",
          value: "en"
        }
      });
    }

    // Mask API keys for display
    const displayTools = tools.map(tool => ({
      ...tool,
      model_provider_key: tool.model_provider_key ? maskApiKey(tool.model_provider_key) : undefined
    }));

    const maskedApiKey = apiKey ? maskApiKey(apiKey) : 'os.environ.get("OPENAI_API_KEY")';

    const pythonCode = `import os
from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="${maskedApiKey}"
)

response = client.responses.create(
    model="${modelString}",
    store=True,
    tools=${JSON.stringify(displayTools, null, 4).replace(/"/g, '"')},${selectedVectorStore ? `
    instructions="${instructions}",` : ''}
    input="${content.replace(/"/g, '\\"')}",
    stream=True
)

# Handle streaming response
for chunk in response:
    if hasattr(chunk, 'delta') and chunk.delta:
        print(chunk.delta, end='', flush=True)`;

    return pythonCode;
  };

  const copyToClipboard = async (text: string, type: 'curl' | 'python') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'curl') {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      } else {
        setCopiedPython(true);
        setTimeout(() => setCopiedPython(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderImage = () => {
    const validation = validateAndCleanBase64(content);
    
    if (!validation.isValid) {
      console.error('Invalid base64 image data:', validation.issues);
      return (
        <div className="space-y-2">
          <p className="text-sm opacity-75">Generated image (validation failed):</p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              Image data appears to be incomplete or corrupted.
            </p>
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Debug info</summary>
              <pre className="text-xs mt-1 text-red-600">
                {JSON.stringify(validation.issues, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    
    const imageFormat = detectImageFormat(content);
    
    return (
      <div className="space-y-2">
        <p className="text-sm opacity-75">Generated image:</p>
        <img 
          src={`data:image/${imageFormat};base64,${validation.cleanBase64}`}
          alt="Generated image" 
          className="rounded-lg max-w-full h-auto"
          onError={(e) => {
            console.error('Image failed to load with format:', imageFormat);
            const target = e.target as HTMLImageElement;
            
            // Try different formats as fallback
            if (target.src.includes('jpeg')) {
              console.log('Trying PNG format...');
              target.src = `data:image/png;base64,${validation.cleanBase64}`;
            } else if (target.src.includes('png')) {
              console.log('Trying WebP format...');
              target.src = `data:image/webp;base64,${validation.cleanBase64}`;
            } else if (target.src.includes('webp')) {
              console.log('Trying JPEG format...');
              target.src = `data:image/jpeg;base64,${validation.cleanBase64}`;
            } else {
              console.error('All image formats failed. Content preview:', validation.cleanBase64.substring(0, 50) + '...');
            }
          }}
          onLoad={() => {
            console.log('Image loaded successfully with format:', imageFormat);
          }}
        />
      </div>
    );
  };

  return (
    <>
      <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-3xl">
          <div className={`px-4 py-3 rounded-lg ${
            role === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isImageContent(content) ? renderImage() : (
              <p className="whitespace-pre-wrap">{content}</p>
            )}
            <p className={`text-xs mt-2 opacity-75`}>
              {timestamp.toLocaleTimeString()}
            </p>
          </div>
          
          {/* Show Code button for user messages */}
          {role === 'user' && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCodeModal(true)}
                className="text-xs"
              >
                <Code className="h-3 w-3 mr-1" />
                Show Code
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">API Code Examples</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodeModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'curl'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('curl')}
              >
                cURL
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'python'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('python')}
              >
                Python
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {activeTab === 'curl' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">cURL Command</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateCurlCode(), 'curl')}
                      className="h-8 px-3"
                    >
                      {copiedCurl ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                    <code>{generateCurlCode()}</code>
                  </pre>
                </div>
              )}

              {activeTab === 'python' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Python Code</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatePythonCode(), 'python')}
                      className="h-8 px-3"
                    >
                      {copiedPython ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                    <code>{generatePythonCode()}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatMessage;
