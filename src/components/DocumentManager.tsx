import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Database, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  purpose: string;
}

interface VectorStore {
  id: string;
  name: string;
  file_count: number;
  created_at: number;
  metadata: Record<string, any>;
}

interface DocumentManagerProps {
  apiKey: string;
  baseUrl: string;
  onVectorStoreSelect?: (vectorStoreId: string) => void;
  selectedVectorStore?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  apiKey,
  baseUrl,
  onVectorStoreSelect,
  selectedVectorStore
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newVectorStoreName, setNewVectorStoreName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (apiKey && baseUrl) {
      loadDocuments();
      loadVectorStores();
    }
  }, [apiKey, baseUrl]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${baseUrl}/v1/files`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadVectorStores = async () => {
    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVectorStores(data.data || []);
      }
    } catch (error) {
      console.error('Error loading vector stores:', error);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'user_data');

      const response = await fetch(`${baseUrl}/v1/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(prev => [...prev, data]);
      toast.success(`Document "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const createVectorStore = async () => {
    if (!newVectorStoreName.trim()) {
      toast.error('Please enter a vector store name');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          name: newVectorStoreName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVectorStores(prev => [...prev, data]);
      setNewVectorStoreName('');
      toast.success(`Vector store "${data.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating vector store:', error);
      toast.error('Failed to create vector store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addFileToVectorStore = async (fileId: string, vectorStoreId: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores/${vectorStoreId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          chunking_strategy: {
            type: "static",
            static: {
              max_chunk_size_tokens: 1000,
              chunk_overlap_tokens: 200
            }
          },
          attributes: {
            category: "user_document",
            language: "en"
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await loadVectorStores(); // Refresh to update file counts
      toast.success('Document added to vector store successfully!');
    } catch (error) {
      console.error('Error adding file to vector store:', error);
      toast.error('Failed to add document to vector store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Document Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Documents
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Choose File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.txt,.doc,.docx,.md"
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            {uploadingFile && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading document...
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Supported formats: PDF, TXT, DOC, DOCX, MD
          </p>
        </div>
      </Card>

      {/* Vector Stores Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Vector Stores
        </h3>
        
        {/* Create New Vector Store */}
        <div className="space-y-4 mb-6">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter vector store name..."
              value={newVectorStoreName}
              onChange={(e) => setNewVectorStoreName(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              onClick={createVectorStore}
              disabled={isLoading || !newVectorStoreName.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Vector Stores List */}
        <div className="space-y-2">
          {vectorStores.map((store) => (
            <div
              key={store.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedVectorStore === store.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onVectorStoreSelect?.(store.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-600">
                    {store.file_count} files • Created {new Date(store.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                {selectedVectorStore === store.id && (
                  <div className="text-blue-600 text-sm font-medium">
                    Selected
                  </div>
                )}
              </div>
            </div>
          ))}
          {vectorStores.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No vector stores created yet. Create one to get started.
            </p>
          )}
        </div>
      </Card>

      {/* Documents Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Uploaded Documents
        </h3>
        
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(doc.bytes)} • Uploaded {new Date(doc.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {vectorStores.map((store) => (
                    <Button
                      key={store.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addFileToVectorStore(doc.id, store.id)}
                      disabled={isLoading}
                    >
                      Add to {store.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No documents uploaded yet. Upload some documents to get started.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DocumentManager; 