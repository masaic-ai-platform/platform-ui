import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Upload, FileSearch, Copy, Plus, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface AgenticFileSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: AgenticFileSearchConfig) => void;
  initialVectorStores?: string[];
  initialIterations?: number;
  initialMaxResults?: number;
  initialSelectedFiles?: string[];
  initialVectorStoreNames?: string[];
}

interface AgenticFileSearchConfig {
  selectedFiles: string[];
  selectedVectorStores: string[];
  vectorStoreNames: string[];
  iterations: number;
  maxResults: number;
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

const AgenticFileSearchModal: React.FC<AgenticFileSearchModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialVectorStores,
  initialIterations,
  initialMaxResults,
  initialSelectedFiles,
  initialVectorStoreNames
}) => {
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialSelectedFiles || []);
  const [selectedVectorStores, setSelectedVectorStores] = useState<string[]>(initialVectorStores || []);
  const [vectorStoreFiles, setVectorStoreFiles] = useState<Record<string, string[]>>({});
  const [iterations, setIterations] = useState<number>(initialIterations || 3);
  const [maxResults, setMaxResults] = useState<number>(initialMaxResults || 4);
  const [newVectorStoreName, setNewVectorStoreName] = useState('');
  const [loading, setLoading] = useState({ stores: false, files: false, vectorStoreFiles: false });
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>({ uploading: false });
  const [vectorStoreStatus, setVectorStoreStatus] = useState<VectorStoreStatus>({ creating: false });
  const [attachingFiles, setAttachingFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);

  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:6644';

  // Get selected vector store names
  const selectedVectorStoreNames = vectorStores
    .filter(store => selectedVectorStores.includes(store.id))
    .map(store => store.name);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: `${type} ID copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
      setVectorStores([]);
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
      setFiles([]);
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus({ uploading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'assistants');

      const response = await fetch(`${apiUrl}/v1/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const newFile = await response.json();
      setFiles(prev => [newFile, ...prev]);
      setUploadStatus({ uploading: false });
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({ 
        uploading: false, 
        error: 'Upload failed. Please try again.' 
      });
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
        body: JSON.stringify({
          name: newVectorStoreName.trim(),
          file_ids: []
        }),
      });

      if (!response.ok) throw new Error('Failed to create vector store');
      
      const newStore = await response.json();
      setVectorStores(prev => [newStore, ...prev]);
      setSelectedVectorStores(prev => [...prev, newStore.id]);
      setNewVectorStoreName('');
      setVectorStoreStatus({ creating: false });
    } catch (error) {
      console.error('Error creating vector store:', error);
      setVectorStoreStatus({ 
        creating: false, 
        error: 'Failed to create vector store. Please try again.' 
      });
    }
  };

  // Track file status using the provided API
  const trackFileStatus = async (vectorStoreId: string, fileId: string): Promise<any> => {
    const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files/${fileId}`);
    if (!response.ok) throw new Error('Failed to check file status');
    return response.json();
  };

  // Associate file with vector store using the provided API
  const associateFileWithVectorStore = async (vectorStoreId: string, fileId: string): Promise<void> => {
    const response = await fetch(`${apiUrl}/v1/vector_stores/${vectorStoreId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId,
        attributes: {
          category: 'user_document',
          language: 'en'
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to associate file ${fileId} with vector store ${vectorStoreId}`);
    }
  };

  // Save configuration (only vector stores)
  const handleSave = () => {
    if (selectedVectorStores.length === 0) return;

    const vectorStoreNames = vectorStores
      .filter(vs => selectedVectorStores.includes(vs.id))
      .map(vs => vs.name);
    
    const config = {
      selectedFiles: [], // Don't save files in localStorage
      selectedVectorStores,
      vectorStoreNames,
      iterations,
      maxResults
    };
    
    // Save to localStorage
    saveAgenticFileSearchToolToStorage(config);
    
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

      // Clear selections after successful association
      setSelectedFiles([]);
      
      toast({
        description: "Files successfully associated with vector stores",
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
  const saveAgenticFileSearchToolToStorage = (config: AgenticFileSearchConfig) => {
    try {
      const toolConfig = {
        type: "agentic_search",
        selectedVectorStores: config.selectedVectorStores,
        max_iterations: config.iterations,
        max_num_results: config.maxResults
      };
      localStorage.setItem('platform_agenticFileSearchTools', JSON.stringify(toolConfig));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Handle file selection toggle
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

  // Check if a file is already in any selected vector store
  const isFileInVectorStore = (fileId: string): boolean => {
    return Object.values(vectorStoreFiles).some(storeFiles => storeFiles.includes(fileId));
  };

  // Get files that need to be associated (not already in vector stores)
  const getFilesToAssociate = (): string[] => {
    return selectedFiles.filter(fileId => !isFileInVectorStore(fileId));
  };

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      fetchVectorStores();
      fetchFiles();
    }
  }, [open]);

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
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
              <FileSearch className="h-5 w-5" />
              <span>Agentic File Search</span>
            </DialogTitle>
            {/* Show selected store names below title */}
            {selectedVectorStoreNames.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Selected stores: <span className="text-positive-trend">{selectedVectorStoreNames.join(', ')}</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Vector Stores Section */}
              <div className="flex flex-col space-y-4">
                <div>
                  <Label className="text-sm font-medium">Vector Stores</Label>
                  <p className="text-xs text-muted-foreground">Select one or more vector stores for agentic file search</p>
                </div>

                {/* Agentic Configuration */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Configuration</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="iterations" className="text-xs">Iterations</Label>
                      <Input
                        id="iterations"
                        type="number"
                        min="1"
                        max="10"
                        value={iterations}
                        onChange={(e) => setIterations(parseInt(e.target.value) || 3)}
                        className="h-8 focus:border-positive-trend/60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxResults" className="text-xs">Max Results</Label>
                      <Input
                        id="maxResults"
                        type="number"
                        min="1"
                        max="20"
                        value={maxResults}
                        onChange={(e) => setMaxResults(parseInt(e.target.value) || 4)}
                        className="h-8 focus:border-positive-trend/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Create New Vector Store */}
                <div className="space-y-2">
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
                <div className="flex-1 overflow-hidden">
                  <div className="h-full max-h-96 overflow-y-auto space-y-2 border border-border/40 rounded-lg bg-card/50 p-3" style={{ scrollbarWidth: 'thin' }}>
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
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Files Section - Always Visible */}
              <div className="flex flex-col space-y-4 h-full">
                <div>
                  <Label className="text-sm font-medium">Available Files...</Label>
                  <p className="text-xs text-muted-foreground">Select files to associate with vector stores</p>
                </div>

                {/* Files List - Adaptive height with scrollbar */}
                <div className="flex-1 min-h-0 max-h-[40vh] overflow-hidden">
                  <div className="h-full overflow-y-auto space-y-2 border border-border/40 rounded-lg bg-card/50 p-3" style={{ scrollbarWidth: 'thin' }}>
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
                        disabled={attachingFiles.length > 0}
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

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="border-t px-6 py-4 space-y-2">
              <Label className="text-sm font-medium">Upload Progress</Label>
              {uploadProgress.map((progress) => {
                const file = files.find(f => f.id === progress.fileId);
                return (
                  <div key={progress.fileId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file?.filename || progress.fileId}</span>
                    <div className="flex items-center space-x-2">
                      {progress.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                      {progress.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                      {progress.status === 'completed' && <Badge className="text-xs bg-green-500">Completed</Badge>}
                      {progress.status === 'failed' && <Badge variant="destructive" className="text-xs">Failed</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
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
                disabled={selectedVectorStores.length === 0}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgenticFileSearchModal; 