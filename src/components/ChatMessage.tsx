import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, type = 'text', timestamp }) => {
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
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-3xl px-4 py-3 rounded-lg ${
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
    </div>
  );
};

export default ChatMessage;
