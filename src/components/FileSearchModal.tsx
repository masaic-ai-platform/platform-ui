import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Upload, FileSearch, Copy, Plus, Check, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { usePlatformInfo } from '@/contexts/PlatformContext';
import { API_URL } from '@/config';

interface FileSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: FileSearchConfig) => void;
  initialVectorStores?: string[];
  initialSelectedFiles?: string[];
  initialVectorStoreNames?: string[];
}

interface FileSearchConfig {
  selectedFiles: string[];
  selectedVectorStores: string[];
  vectorStoreNames: string[];
}

interface VectorStore {
  id: string;
  name: string;
  file_counts: {
    total: number;
    completed: number;
    failed: number;
    in_progress: number;
  };
  status: string;
}

interface FileItem {
  id: string;
  filename: string;
  bytes: number;
  status: string;
  created_at: number;
}

interface FileUploadStatus {
  uploading: boolean;
  progress?: number;
  error?: string;
}

interface VectorStoreStatus {
  creating: boolean;
  error?: string;
}

interface FileUploadProgress {
  fileId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface Model {
  name: string;
  modelSyntax: string;
  isEmbeddingModel?: boolean;
  providerName?: string;
  providerDescription?: string;
}

interface Provider {
  name: string;
  description: string;
  supportedModels: Model[];
}

const FileSearchModal: React.FC<FileSearchModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialVectorStores,
  initialSelectedFiles,
  initialVectorStoreNames
}) => {
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialSelectedFiles || []);
  const [selectedVectorStores, setSelectedVectorStores] = useState<string[]>(initialVectorStores || []);
  const [vectorStoreFiles, setVectorStoreFiles] = useState<Record<string, string[]>>({});
  const [newVectorStoreName, setNewVectorStoreName] = useState('');
  const [loading, setLoading] = useState({ stores: false, files: false, vectorStoreFiles: false });
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({ uploading: false });
  const [vectorStoreStatus, setVectorStoreStatus] = useState<VectorStoreStatus>({ creating: false });
  const [attachingFiles, setAttachingFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [deletingStores, setDeletingStores] = useState<string[]>([]);
  const [vectorStoreType, setVectorStoreType] = useState<string>('qdrant-cloud');
  const [embeddingModels, setEmbeddingModels] = useState<Model[]>([]);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<string>('');

  const { toast } = useToast();
  const { platformInfo } = usePlatformInfo();
  const apiUrl = API_URL;

  // Check if we should use runtime model settings
  const useRuntimeModelSettings = platformInfo?.modelSettings?.settingsType === 'RUNTIME';

  // Fetch embedding models (only if runtime model settings enabled)
  const fetchEmbeddingModels = async () => {
    if (!useRuntimeModelSettings) {
      setEmbeddingModels([]);
      setSelectedEmbeddingModel('');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/v1/dashboard/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const providers: Provider[] = await response.json();
      const allEmbeddingModels = providers.flatMap(provider => 
        provider.supportedModels
          .filter(model => model.isEmbeddingModel === true) // Only embedding models
          .map(model => ({
            ...model,
            providerName: provider.name,
            providerDescription: provider.description
          }))
      );
      
      setEmbeddingModels(allEmbeddingModels);
      
      // Try to load from localStorage first, then auto-select first model
      if (allEmbeddingModels.length > 0 && !selectedEmbeddingModel) {
        const savedModel = loadEmbeddingModelFromStorage();
        
        // Check if the saved model exists in the available models
        const modelExists = savedModel && allEmbeddingModels.some(model => model.modelSyntax === savedModel);
        
        if (modelExists) {
          setSelectedEmbeddingModel(savedModel);
        } else {
          // Fallback to first model and save it
          const firstModel = allEmbeddingModels[0].modelSyntax;
          setSelectedEmbeddingModel(firstModel);
          saveEmbeddingModelToStorage(firstModel);
        }
      }
    } catch (error) {
      console.error('Error fetching embedding models:', error);
      setEmbeddingModels([]);
    }
  };

  // Check API key for provider
  const getProviderApiKey = (modelSyntax: string): string => {
    if (!modelSyntax) return '';
    
    const [provider] = modelSyntax.split('@');
    try {
      const saved = localStorage.getItem('platform_apiKeys');
      if (!saved) return '';
      
      const savedKeys: { name: string; apiKey: string }[] = JSON.parse(saved);
      const providerKey = savedKeys.find(item => item.name === provider);
      return providerKey?.apiKey || '';
    } catch (error) {
      console.error('Error getting API key:', error);
      return '';
    }
  };

  // Save embedding model to localStorage
  const saveEmbeddingModelToStorage = (modelSyntax: string) => {
    if (!modelSyntax) return;
    
    const [provider, modelName] = modelSyntax.split('@');
    try {
      localStorage.setItem('platform_embedding_modelProvider', provider);
      localStorage.setItem('platform_embedding_modelName', modelName);
    } catch (error) {
      console.error('Error saving embedding model to localStorage:', error);
    }
  };

  // Load embedding model from localStorage
  const loadEmbeddingModelFromStorage = (): string => {
    try {
      const provider = localStorage.getItem('platform_embedding_modelProvider');
      const modelName = localStorage.getItem('platform_embedding_modelName');
      
      if (provider && modelName) {
        return `${provider}@${modelName}`;
      }
    } catch (error) {
      console.error('Error loading embedding model from localStorage:', error);
    }
    return '';
  };

  // Get selected vector store names
  const selectedVectorStoreNames = vectorStores
    .filter(store => selectedVectorStores.includes(store.id))
    .map(store => store.name);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: `${type} ID copied to clipboard`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: `Failed to copy ${type} ID`,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Fetch vector stores
  const fetchVectorStores = async () => {
    setLoading(prev => ({ ...prev, stores: true }));
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores`);
      if (!response.ok) throw new Error('Failed to fetch vector stores');
      const data = await response.json();
      setVectorStores(data.data || []);
    } catch (error) {
      console.error('Error fetching vector stores:', error);
    } finally {
      setLoading(prev => ({ ...prev, stores: false }));
    }
  };

  // Fetch files
  const fetchFiles = async () => {
    setLoading(prev => ({ ...prev, files: true }));
    try {
      const response = await fetch(`${apiUrl}/v1/files`);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  };

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'user_data');

    setUploadStatus({ uploading: true });
    try {
      const response = await fetch(`${apiUrl}/v1/files`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload file');
      const data = await response.json();
      
      // Refresh files list
      await fetchFiles();
      setUploadStatus({ uploading: false });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      setUploadStatus({ uploading: false, error: 'Upload failed' });
    }
  };

  // Create vector store
  const handleCreateVectorStore = async () => {
    if (!newVectorStoreName.trim()) return;

    setVectorStoreStatus({ creating: true });
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVectorStoreName.trim() }),
      });
      
      if (!response.ok) throw new Error('Failed to create vector store');
      const data = await response.json();
      
      // Refresh vector stores list
      await fetchVectorStores();
      setNewVectorStoreName('');
      setVectorStoreStatus({ creating: false });
      
      // Auto-select the new store
      setSelectedVectorStores(prev => [...prev, data.id]);
    } catch (error) {
      setVectorStoreStatus({ creating: false, error: 'Creation failed' });
    }
  };

  // Track file upload status using the provided API
  const trackFileStatus = async (vectorStoreId: string, fileId: string): Promise<any> => {
    const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files/${fileId}`);
    if (!response.ok) throw new Error('Failed to check file status');
    return response.json();
  };

  // Associate file with vector store using the provided API
  const associateFileWithVectorStore = async (vectorStoreId: string, fileId: string): Promise<void> => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    // Add Authorization header and modelInfo only if runtime model settings enabled
    if (useRuntimeModelSettings && selectedEmbeddingModel) {
      const apiKey = getProviderApiKey(selectedEmbeddingModel);
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const body: any = {
      file_id: fileId,
      attributes: {
        category: 'user_document',
        language: 'en'
      }
    };

    // Add modelInfo only if runtime model settings enabled
    if (useRuntimeModelSettings && selectedEmbeddingModel) {
      body.modelInfo = {
        model: selectedEmbeddingModel
      };
    }

    const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to associate file ${fileId} with vector store ${vectorStoreId}`);
    }
  };

  // Save configuration (only vector stores)
  const handleSave = () => {
    if (selectedVectorStores.length === 0) return;
    if (useRuntimeModelSettings && !selectedEmbeddingModel) return;

    const vectorStoreNames = vectorStores
      .filter(vs => selectedVectorStores.includes(vs.id))
      .map(vs => vs.name);
    
    const config = {
      selectedFiles: [], // Don't save files in localStorage
      selectedVectorStores,
      vectorStoreNames
    };
    
    // Save to localStorage
    saveFileSearchToolToStorage(config);
    
    onSave(config);
    onOpenChange(false);
  };

  // Associate files with vector stores
  const handleAssociateFiles = async () => {
    const filesToAssociate = getFilesToAssociate();
    if (filesToAssociate.length === 0 || selectedVectorStores.length === 0) return;

    setAttachingFiles(filesToAssociate);
    
    // Initialize upload progress
    const initialProgress = filesToAssociate.map(fileId => ({
      fileId,
      status: 'uploading' as const
    }));
    setUploadProgress(initialProgress);

    try {
      // Start all associations for all vector stores
      const associationPromises = selectedVectorStores.flatMap(vectorStoreId =>
        filesToAssociate.map(async (fileId) => {
          try {
            // Associate file with vector store using the provided API
            await associateFileWithVectorStore(vectorStoreId, fileId);

            // Update status to processing
            setUploadProgress(prev => 
              prev.map(p => p.fileId === fileId ? { ...p, status: 'processing' } : p)
            );

            // Poll for completion status
            let attempts = 0;
            const maxAttempts = 30; // 1 minute with 2-second intervals
            
            while (attempts < maxAttempts) {
              const fileStatus = await trackFileStatus(vectorStoreId, fileId);
              
              if (fileStatus.status === 'completed') {
                setUploadProgress(prev => 
                  prev.map(p => p.fileId === fileId ? { ...p, status: 'completed' } : p)
                );
                break;
              } else if (fileStatus.status === 'failed') {
                setUploadProgress(prev => 
                  prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Processing failed' } : p)
                );
                throw new Error(`File ${fileId} processing failed in vector store ${vectorStoreId}`);
              }
              
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            if (attempts >= maxAttempts) {
              setUploadProgress(prev => 
                prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Processing timeout' } : p)
              );
              throw new Error(`File ${fileId} processing timeout in vector store ${vectorStoreId}`);
            }
          } catch (error) {
            setUploadProgress(prev => 
              prev.map(p => p.fileId === fileId ? { ...p, status: 'failed', error: 'Association failed' } : p)
            );
            throw error;
          }
        })
      );

      await Promise.all(associationPromises);

      setAttachingFiles([]);
      setUploadProgress([]);
      
      // Refresh vector stores to get updated file counts
      await fetchVectorStores();
      
      // Refresh vector store files to update UI state
      const fileMap: Record<string, string[]> = {};
      for (const storeId of selectedVectorStores) {
        fileMap[storeId] = await fetchVectorStoreFiles(storeId);
      }
      setVectorStoreFiles(fileMap);
      
      // Clear selections after successful association
      setSelectedFiles([]);
      
      toast({
        description: `Successfully associated ${filesToAssociate.length} file(s) with ${selectedVectorStores.length} vector store(s)`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Error associating files:', error);
      toast({
        description: "Failed to associate some files with vector stores",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setAttachingFiles([]);
      setUploadProgress([]);
    }
  };

  // Handle vector store toggle
  const handleVectorStoreToggle = (vectorStoreId: string) => {
    setSelectedVectorStores(prev => {
      if (prev.includes(vectorStoreId)) {
        return prev.filter(id => id !== vectorStoreId);
      } else {
        return [...prev, vectorStoreId];
      }
    });
  };

  // Save to localStorage
  const saveFileSearchToolToStorage = (config: FileSearchConfig) => {
    try {
      const toolConfig = {
        type: "file_search",
        selectedVectorStores: config.selectedVectorStores
      };
      localStorage.setItem('platform_fileSearchTools', JSON.stringify(toolConfig));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Check if a file is already in any selected vector store
  const isFileInVectorStore = (fileId: string): boolean => {
    return Object.values(vectorStoreFiles).some(storeFiles => storeFiles.includes(fileId));
  };

  // Get files that need to be associated (not already in vector stores)
  const getFilesToAssociate = (): string[] => {
    return selectedFiles.filter(fileId => !isFileInVectorStore(fileId));
  };

  const handleFileToggle = (fileId: string) => {
    // Don't allow toggling if file is already in a vector store
    if (isFileInVectorStore(fileId)) return;
    
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch vector store files
  const fetchVectorStoreFiles = async (vectorStoreId: string): Promise<string[]> => {
    try {
      const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files`);
      if (!response.ok) throw new Error('Failed to fetch vector store files');
      const data = await response.json();
      return data.data?.map((file: any) => file.id) || [];
    } catch (error) {
      console.error('Error fetching vector store files:', error);
      return [];
    }
  };

  const handleDeleteVectorStore = async (storeId: string) => {
    setDeletingStores(prev => [...prev, storeId]);
    try {
      const res = await fetch(`${apiUrl}/v1/vector_stores/${storeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete vector store');
      // Refresh stores and files
      await fetchVectorStores();
      // Remove from selected
      setSelectedVectorStores(prev => prev.filter(id => id !== storeId));
      // Refresh vector store files map
      const fileMap: Record<string, string[]> = {};
      for (const id of selectedVectorStores.filter(id => id !== storeId)) {
        fileMap[id] = await fetchVectorStoreFiles(id);
      }
      setVectorStoreFiles(fileMap);
      toast({ description: 'Vector store deleted', duration: 2000 });
    } catch (error) {
      console.error('Error deleting vector store:', error);
      toast({ description: 'Failed to delete vector store', variant: 'destructive', duration: 3000 });
    } finally {
      setDeletingStores(prev => prev.filter(id => id !== storeId));
    }
  };

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      fetchVectorStores();
      fetchFiles();
      fetchEmbeddingModels();
    }
  }, [open, useRuntimeModelSettings]);

  // Load vector store files when vector stores change
  useEffect(() => {
    const loadVectorStoreFiles = async () => {
      if (selectedVectorStores.length > 0) {
        setLoading(prev => ({ ...prev, vectorStoreFiles: true }));
        const fileMap: Record<string, string[]> = {};
        
        for (const storeId of selectedVectorStores) {
          fileMap[storeId] = await fetchVectorStoreFiles(storeId);
        }
        
        setVectorStoreFiles(fileMap);
        setLoading(prev => ({ ...prev, vectorStoreFiles: false }));
      } else {
        setVectorStoreFiles({});
      }
    };

    loadVectorStoreFiles();
  }, [selectedVectorStores]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
              <FileSearch className="h-5 w-5" />
              <span>File Search</span>
            </DialogTitle>
            {/* Show selected store names below title */}
            {selectedVectorStoreNames.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Selected stores: <span className="text-positive-trend">{selectedVectorStoreNames.join(', ')}</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-h-[calc(80vh-180px)]">
              {/* Vector Stores Section */}
              <div className="flex flex-col space-y-3 h-full min-h-0">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Vector Stores</Label>
                    <Select value={vectorStoreType} onValueChange={setVectorStoreType}>
                      <SelectTrigger className="w-48 h-8 focus:ring-0 focus:ring-offset-0 focus:border-border">
                        <SelectValue>
                          {vectorStoreType === 'qdrant-cloud' ? (
                            <div className="flex items-center space-x-2">
                              <img src="/qdrant icon.png" alt="Qdrant" className="w-3 h-3" />
                              <span>Qdrant Cloud</span>
                            </div>
                          ) : (
                            <span>Bring your own vector store</span>
                          )}
                        </SelectValue>
                                              </SelectTrigger>
                        <SelectContent 
                          side="bottom" 
                          align="start" 
                          sideOffset={8}
                          className="z-[9999] pt-2"
                        >
                          <SelectItem value="qdrant-cloud">
                          <div className="flex items-center space-x-2">
                            <img src="/qdrant icon.png" alt="Qdrant" className="w-4 h-4" />
                            <span>Qdrant Cloud</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bring-your-own">Bring your own vector store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Embedding Model Dropdown - now below Vector Stores dropdown */}
                {useRuntimeModelSettings && (
                  <div className="space-y-2 flex-shrink-0">
                    <Label className="text-sm font-medium">Embedding Model</Label>
                    <Select 
                      value={selectedEmbeddingModel} 
                      onValueChange={(value) => {
                        setSelectedEmbeddingModel(value);
                        saveEmbeddingModelToStorage(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select embedding model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {embeddingModels.map((model) => (
                          <SelectItem key={model.modelSyntax} value={model.modelSyntax}>
                            <div className="flex items-center space-x-2">
                              {model.providerName && (
                                <Badge variant="outline" className="text-xs">
                                  {model.providerName}
                                </Badge>
                              )}
                              <span className="text-sm">{model.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {embeddingModels.length === 0 && (
                      <p className="text-xs text-muted-foreground">No embedding models available</p>
                    )}
                  </div>
                )}

                {/* Create New Vector Store */}
                <div className="space-y-2 flex-shrink-0">
                  <Label className="text-sm font-medium">Create New Vector Store</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newVectorStoreName}
                      onChange={(e) => setNewVectorStoreName(e.target.value)}
                      placeholder="Enter vector store name"
                      className="flex-1 focus:border-positive-trend/60"
                    />
                    <Button 
                      onClick={handleCreateVectorStore}
                      disabled={!newVectorStoreName.trim() || vectorStoreStatus.creating}
                      size="sm"
                      className="bg-positive-trend hover:bg-positive-trend/90 text-white"
                    >
                      {vectorStoreStatus.creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {vectorStoreStatus.error && (
                    <p className="text-sm text-destructive">{vectorStoreStatus.error}</p>
                  )}
                </div>

                {/* Vector Stores List */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="h-full max-h-64 overflow-y-auto space-y-2 border border-border/40 rounded-lg bg-card/50 p-3" style={{ scrollbarWidth: 'thin' }}>
                    {loading.stores ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-positive-trend" />
                      </div>
                    ) : vectorStores.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No vector stores found</p>
                    ) : (
                      vectorStores.map((store) => (
                        <div
                          key={store.id}
                          className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-positive-trend/20 ${
                            selectedVectorStores.includes(store.id) 
                              ? 'border-positive-trend bg-positive-trend/10 shadow-sm' 
                              : 'border-border/20 hover:border-positive-trend/40 hover:bg-positive-trend/5'
                          }`}
                          onClick={() => handleVectorStoreToggle(store.id)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleVectorStoreToggle(store.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex items-center justify-center w-5 h-5">
                                {selectedVectorStores.includes(store.id) && (
                                  <Check className="h-4 w-4 text-positive-trend" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{store.name}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{store.file_counts.total} files</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(store.id, 'Vector Store');
                                }}
                                className="h-6 w-6 p-0 hover:bg-positive-trend/20"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDeleteVectorStore(store.id); }}
                                className="h-6 w-6 p-0 hover:bg-destructive/20"
                                disabled={deletingStores.includes(store.id)}
                              >
                                {deletingStores.includes(store.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                                ) : (
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Files Section - Always Visible */}
              <div className="flex flex-col space-y-3 h-full min-h-0">
                <div className="flex-shrink-0">
                  <Label className="text-sm font-medium">Available Files...</Label>
                  <p className="text-xs text-muted-foreground">Select files to associate with vector stores</p>
                </div>

                {/* Files List - Adaptive height with scrollbar */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="h-full max-h-80 overflow-y-auto space-y-2 border border-border/40 rounded-lg bg-card/50 p-3" style={{ scrollbarWidth: 'thin' }}>
                    {loading.files ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-positive-trend" />
                      </div>
                    ) : files.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No files found</p>
                    ) : (
                      files.map((file) => {
                        const isInVectorStore = isFileInVectorStore(file.id);
                        const isSelected = selectedFiles.includes(file.id) || isInVectorStore;
                        
                        return (
                          <div
                            key={file.id}
                            className={`p-3 rounded-lg border transition-all duration-200 ${
                              isInVectorStore 
                                ? 'border-positive-trend bg-positive-trend/5 opacity-75 cursor-not-allowed' 
                                : `cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-positive-trend/20 ${
                                    isSelected 
                                      ? 'border-positive-trend bg-positive-trend/10 shadow-sm' 
                                      : 'border-border/20 hover:border-positive-trend/40 hover:bg-positive-trend/5'
                                  }`
                            }`}
                            onClick={() => handleFileToggle(file.id)}
                            tabIndex={isInVectorStore ? -1 : 0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleFileToggle(file.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="flex items-center justify-center w-5 h-5">
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-positive-trend" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium truncate">{file.filename}</p>
                                    {isInVectorStore && (
                                      <Badge variant="secondary" className="text-xs">
                                        In Store
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span>{formatBytes(file.bytes)}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {file.status}
                                    </Badge>
                                  </div>
                                                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(file.id, 'File');
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-positive-trend/20"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                      })
                    )}
                  </div>
                </div>

                                {/* Associate Files Button */}
                {(() => {
                  const filesToAssociate = getFilesToAssociate();
                  return filesToAssociate.length > 0 && selectedVectorStores.length > 0 && (
                    <div className="pt-2">
                      <Button 
                        onClick={handleAssociateFiles}
                        disabled={attachingFiles.length > 0 || (useRuntimeModelSettings && !selectedEmbeddingModel)}
                        className="w-full bg-positive-trend hover:bg-positive-trend/90 text-white"
                        size="sm"
                      >
                        {attachingFiles.length > 0 ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Associating {filesToAssociate.length} file(s)...
                          </>
                        ) : (
                          `Associate ${filesToAssociate.length} new file(s) with ${selectedVectorStores.length} store(s)`
                        )}
                      </Button>
                    </div>
                  );
                })()}
                </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative">
            <div className="flex items-center justify-between p-6 pt-4 border-t border-border">
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={selectedVectorStores.length === 0 || (useRuntimeModelSettings && !selectedEmbeddingModel)}
                  className="bg-positive-trend hover:bg-positive-trend/90 text-white"
                >
                  Save Configuration
                </Button>
              </div>
              
              {/* File Upload - Bottom Right */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Upload File:</Label>
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadStatus.uploading}
                    className="w-48 focus:border-positive-trend focus:ring-2 focus:ring-positive-trend/20"
                  />
                  {uploadStatus.uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-positive-trend" />
                  )}
                </div>
                {uploadStatus.error && (
                  <p className="text-xs text-destructive text-right">{uploadStatus.error}</p>
                )}
              </div>
            </div>

            {/* Association Progress Overlay */}
            {uploadProgress.length > 0 && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm border-t border-border flex flex-col justify-center px-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-positive-trend" />
                    <Label className="text-sm font-medium">Association Progress</Label>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                    {uploadProgress.map((progress) => {
                      const file = files.find(f => f.id === progress.fileId);
                      const storeName = vectorStores.find(store => selectedVectorStores.includes(store.id))?.name || 'vector store';
                      return (
                        <div key={progress.fileId} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-2">
                            Adding {file?.filename || progress.fileId} to {storeName}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {progress.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {progress.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                            {progress.status === 'completed' && <Badge className="text-xs bg-positive-trend text-white">Added</Badge>}
                            {progress.status === 'failed' && <Badge variant="destructive" className="text-xs">Failed</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileSearchModal; 