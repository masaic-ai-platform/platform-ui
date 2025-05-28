import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Database, Trash2, Plus, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  purpose: string;
}

interface VectorStoreFile {
  id: string;
  vector_store_id: string;
  status: string;
  attributes: {
    filename: string;
  };
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
  onVectorStoreSelect?: (vectorStoreId: string | null) => void;
  selectedVectorStore?: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  type: 'file' | 'vectorStore' | 'fileFromVectorStore';
  itemId: string;
  vectorStoreId?: string;
  itemName: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  apiKey,
  baseUrl,
  onVectorStoreSelect,
  selectedVectorStore
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [vectorStoreFiles, setVectorStoreFiles] = useState<Record<string, VectorStoreFile[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newVectorStoreName, setNewVectorStoreName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    type: 'file',
    itemId: '',
    itemName: ''
  });

  useEffect(() => {
    if (apiKey && baseUrl) {
      loadDocuments();
      loadVectorStores();
    }
  }, [apiKey, baseUrl]);

  useEffect(() => {
    // Load files for each vector store
    if (vectorStores.length > 0 && apiKey && baseUrl) {
      Promise.all(vectorStores.map(store => loadVectorStoreFiles(store.id)));
    }
  }, [vectorStores, apiKey, baseUrl]);

  // Auto-refresh vector store files every 3 seconds to update processing status
  useEffect(() => {
    if (!apiKey || !baseUrl || vectorStores.length === 0) return;

    const interval = setInterval(() => {
      // Check if any vector store has files in progress
      const hasProcessingFiles = Object.values(vectorStoreFiles).some(files =>
        files.some(file => file.status === 'in_progress')
      );

      if (hasProcessingFiles) {
        // Refresh files for all vector stores that have processing files
        Object.entries(vectorStoreFiles).forEach(([vectorStoreId, files]) => {
          if (files.some(file => file.status === 'in_progress')) {
            loadVectorStoreFiles(vectorStoreId);
          }
        });
      }
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [apiKey, baseUrl, vectorStores, vectorStoreFiles]);

  const loadVectorStoreFiles = async (vectorStoreId: string) => {
    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores/${vectorStoreId}/files`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allFiles = data.data || [];
        // Include both completed and in_progress files
        const validFiles = allFiles.filter((file: VectorStoreFile) => 
          file.status === 'completed' || file.status === 'in_progress'
        );
        
        setVectorStoreFiles(prev => ({
          ...prev,
          [vectorStoreId]: validFiles
        }));
      }
    } catch (error) {
      console.error(`Error loading files for vector store ${vectorStoreId}:`, error);
    }
  };

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
      
      // Auto-select the newly created vector store
      onVectorStoreSelect?.(data.id);
      
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

      // Refresh data from API
      await loadVectorStores();
      await loadVectorStoreFiles(vectorStoreId);
      
      toast.success('Document added to vector store successfully!');
    } catch (error) {
      console.error('Error adding file to vector store:', error);
      toast.error('Failed to add document to vector store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFileFromVectorStore = async (fileId: string, vectorStoreId: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores/${vectorStoreId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh data from API
      await loadVectorStores();
      await loadVectorStoreFiles(vectorStoreId);
      
      toast.success('File removed from vector store successfully!');
    } catch (error) {
      console.error('Error removing file from vector store:', error);
      toast.error('Failed to remove file from vector store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh all data from API
      await loadDocuments();
      await loadVectorStores();
      // Refresh vector store files for all stores
      for (const store of vectorStores) {
        await loadVectorStoreFiles(store.id);
      }
      
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVectorStore = async (vectorStoreId: string) => {
    if (!apiKey.trim()) {
      toast.error('Please set your API key first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}/v1/vector_stores/${vectorStoreId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // If the deleted store was selected, deselect it
      if (selectedVectorStore === vectorStoreId) {
        onVectorStoreSelect?.(null);
      }

      // Refresh data from API
      await loadVectorStores();
      
      toast.success('Vector store deleted successfully!');
    } catch (error) {
      console.error('Error deleting vector store:', error);
      toast.error('Failed to delete vector store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = () => {
    const { type, itemId, vectorStoreId } = deleteDialog;
    
    if (type === 'file') {
      deleteFile(itemId);
    } else if (type === 'vectorStore') {
      deleteVectorStore(itemId);
    } else if (type === 'fileFromVectorStore' && vectorStoreId) {
      removeFileFromVectorStore(itemId, vectorStoreId);
    }
    
    setDeleteDialog({ ...deleteDialog, isOpen: false });
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

  const isFileInVectorStore = (fileId: string, vectorStoreId: string): boolean => {
    const files = vectorStoreFiles[vectorStoreId] || [];
    return files.some(file => file.id.includes(fileId));
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Confirm Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'file' && (
                <>Are you sure you want to delete <strong>{deleteDialog.itemName}</strong>?</>
              )}
              {deleteDialog.type === 'vectorStore' && (
                <>Are you sure you want to delete the vector store <strong>{deleteDialog.itemName}</strong>?</>
              )}
              {deleteDialog.type === 'fileFromVectorStore' && (
                <>Are you sure you want to remove <strong>{deleteDialog.itemName}</strong> from this vector store?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              className={`p-3 border rounded-lg transition-colors ${
                selectedVectorStore === store.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div 
                  className="flex-grow cursor-pointer"
                  onClick={() => {
                    if (selectedVectorStore === store.id) {
                      onVectorStoreSelect?.(null); // Deselect if already selected
                    } else {
                      onVectorStoreSelect?.(store.id); // Select if not selected
                    }
                  }}
                >
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-600">
                    {store.file_count} files • Created {new Date(store.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedVectorStore === store.id && (
                    <div className="text-blue-600 text-sm font-medium mr-2">
                      Selected
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteDialog({
                      isOpen: true,
                      type: 'vectorStore',
                      itemId: store.id,
                      itemName: store.name
                    })}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* List files in this vector store if it has any */}
              {vectorStoreFiles[store.id] && vectorStoreFiles[store.id].length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Files in this store:</p>
                  <div className="space-y-2">
                    {vectorStoreFiles[store.id].map(file => (
                      <div key={file.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <span>{file.attributes.filename}</span>
                          {file.status === 'in_progress' && (
                            <div className="ml-2 flex items-center text-orange-600">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              <span className="text-xs">Processing...</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 h-7 w-7"
                          onClick={() => setDeleteDialog({
                            isOpen: true,
                            type: 'fileFromVectorStore',
                            itemId: file.id,
                            vectorStoreId: store.id,
                            itemName: file.attributes.filename
                          })}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <div className="flex items-center">
                    <p className="font-medium">{doc.filename}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 ml-2 h-7 w-7"
                      onClick={() => setDeleteDialog({
                        isOpen: true,
                        type: 'file',
                        itemId: doc.id,
                        itemName: doc.filename
                      })}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(doc.bytes)} • Uploaded {new Date(doc.created_at * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {vectorStores.map((store) => {
                    const isAdded = isFileInVectorStore(doc.id, store.id);
                    
                    return (
                      <Button
                        key={store.id}
                        variant={isAdded ? "default" : "outline"}
                        size="sm"
                        onClick={() => !isAdded 
                          ? addFileToVectorStore(doc.id, store.id)
                          : setDeleteDialog({
                              isOpen: true,
                              type: 'fileFromVectorStore',
                              itemId: doc.id,
                              vectorStoreId: store.id,
                              itemName: doc.filename
                            })
                        }
                        disabled={isLoading}
                        className={isAdded ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Added to {store.name}
                          </>
                        ) : (
                          <>Add to {store.name}</>
                        )}
                      </Button>
                    );
                  })}
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