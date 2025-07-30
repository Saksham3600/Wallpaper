'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import wallpaperService from '@/lib/appwrite/wallpaperService';

const UploadWallpaper = () => {
    const { user } = useAuth();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadResults, setUploadResults] = useState([]);
    const fileInputRef = useRef(null);

    // Predefined categories
    const categories = [
        'Nature',
        'Abstract',
        'Technology',
        'Animals',
        'Architecture',
        'Space',
        'Minimalist',
        'Gaming',
        'Anime',
        'Cars',
        'Sports',
        'Art',
        'Photography',
        'Other'
    ];

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Handle file selection from input
    const handleFileSelect = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    // Process selected files
    const handleFiles = (files) => {
        const validFiles = Array.from(files).filter(file => {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not a valid image file`);
                return false;
            }
            // Check file size (max 50MB for wallpapers)
            if (file.size > 50 * 1024 * 1024) {
                alert(`${file.name} is too large. Maximum size is 50MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            const filesWithPreview = validFiles.map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                status: 'pending',
                metadata: {
                    title: file.name.split('.')[0], // Remove extension for default title
                    description: '',
                    category: 'Other'
                }
            }));
            
            setSelectedFiles(prev => [...filesWithPreview, ...prev]);
        }
    };

    // Update file metadata
    const updateFileMetadata = (fileId, field, value) => {
        setSelectedFiles(prev => 
            prev.map(f => 
                f.id === fileId 
                    ? { 
                        ...f, 
                        metadata: { 
                            ...f.metadata, 
                            [field]: value 
                        } 
                    }
                    : f
            )
        );
    };

    // Remove file from selection
    const removeFile = (fileId) => {
        setSelectedFiles(prev => {
            const updatedFiles = prev.filter(f => f.id !== fileId);
            // Cleanup object URL to prevent memory leaks
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return updatedFiles;
        });
        
        // Also remove from upload progress if exists
        setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
        });
    };

    // Validate file data before upload
    const validateFileData = (fileData) => {
        const { title, description, category } = fileData.metadata;
        
        if (!title.trim()) {
            return 'Title is required';
        }
        if (title.trim().length < 3) {
            return 'Title must be at least 3 characters long';
        }
        if (description.trim().length > 500) {
            return 'Description must be less than 500 characters';
        }
        if (!category) {
            return 'Category is required';
        }
        
        return null;
    };

    // Upload files
    const uploadFiles = async () => {
        if (selectedFiles.length === 0) return;

        // Validate all files first
        const validationErrors = [];
        selectedFiles.forEach(fileData => {
            if (fileData.status === 'pending') {
                const error = validateFileData(fileData);
                if (error) {
                    validationErrors.push(`${fileData.name}: ${error}`);
                }
            }
        });

        if (validationErrors.length > 0) {
            alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
            return;
        }

        setUploading(true);
        const results = [];

        for (const fileData of selectedFiles) {
            if (fileData.status !== 'pending') continue;

            try {
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [fileData.id]: { status: 'uploading', progress: 0 }
                }));

                // Update file status
                setSelectedFiles(prev => 
                    prev.map(f => 
                        f.id === fileData.id 
                            ? { ...f, status: 'uploading' }
                            : f
                    )
                );

                // Upload to Appwrite Storage with metadata
                const uploadedFile = await wallpaperService.uploadWallpaper(
                    fileData.file, 
                    fileData.metadata
                );
                
                // Update progress to completion
                setUploadProgress(prev => ({
                    ...prev,
                    [fileData.id]: { status: 'completed', progress: 100 }
                }));

                // Update file status
                setSelectedFiles(prev => 
                    prev.map(f => 
                        f.id === fileData.id 
                            ? { ...f, status: 'completed', uploadedId: uploadedFile.$id }
                            : f
                    )
                );

                results.push({
                    id: fileData.id,
                    name: fileData.name,
                    status: 'success',
                    uploadedId: uploadedFile.$id,
                    url: wallpaperService.getFilePreview(uploadedFile.$id)
                });

            } catch (error) {
                console.error(`Error uploading ${fileData.name}:`, error);
                
                // Update progress to error
                setUploadProgress(prev => ({
                    ...prev,
                    [fileData.id]: { status: 'error', progress: 0 }
                }));

                // Update file status
                setSelectedFiles(prev => 
                    prev.map(f => 
                        f.id === fileData.id 
                            ? { ...f, status: 'error' }
                            : f
                    )
                );

                results.push({
                    id: fileData.id,
                    name: fileData.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        setUploadResults(results);
        setUploading(false);
    };

    // Clear all files
    const clearFiles = () => {
        // Cleanup object URLs
        selectedFiles.forEach(fileData => {
            if (fileData.preview) {
                URL.revokeObjectURL(fileData.preview);
            }
        });
        
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadResults([]);
    };

    // Start over (reset everything)
    const startOver = () => {
        clearFiles();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-gray-500';
            case 'uploading': return 'text-blue-500';
            case 'completed': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'uploading': return '📤';
            case 'completed': return '✅';
            case 'error': return '❌';
            default: return '⏳';
        }
    };

    // If not authenticated, show login prompt
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                    <p className="text-gray-600 mb-6">Please sign in to upload wallpapers</p>
                    <a 
                        href="/auth/login" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Wallpapers</h1>
                        <p className="text-gray-600">Share your beautiful wallpapers with the community</p>
                    </div>
                    
                    {/* Upload Area */}
                    <div className="mb-8">
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                                dragActive 
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            <div className="space-y-6">
                                <div className="text-8xl">
                                    {dragActive ? '📂' : '🖼️'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        {dragActive ? 'Drop your wallpapers here' : 'Upload your wallpapers'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        Drag and drop your images here, or click to browse
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Choose Files
                                    </button>
                                </div>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>Supported formats: JPG, PNG, WebP, GIF</p>
                                    <p>Maximum file size: 50MB per file</p>
                                    <p>Recommended resolution: 1920×1080 or higher</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Selected Files ({selectedFiles.length})
                                </h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={uploadFiles}
                                        disabled={uploading || selectedFiles.every(f => f.status === 'completed')}
                                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                Upload All
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearFiles}
                                        disabled={uploading}
                                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {selectedFiles.map((fileData) => (
                                    <div key={fileData.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
                                        {/* Image Preview */}
                                        <div className="aspect-video relative bg-gray-100 group">
                                            <Image
                                                src={fileData.preview}
                                                alt={fileData.name}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                            />
                                            {/* Download overlay for completed uploads */}
                                            {fileData.status === 'completed' && (
                                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                    <button
                                                        onClick={() => {
                                                            const downloadUrl = wallpaperService.getFilePreview(fileData.uploadedId);
                                                            const link = document.createElement('a');
                                                            link.href = downloadUrl;
                                                            link.download = fileData.name;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                        }}
                                                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {/* Status overlay */}
                                            {fileData.status === 'uploading' && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="text-white text-center">
                                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-3"></div>
                                                        <p className="text-sm font-medium">Uploading...</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status badge */}
                                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fileData.status)} bg-white bg-opacity-90 flex items-center gap-1 shadow-sm`}>
                                                {getStatusIcon(fileData.status)}
                                                {fileData.status.charAt(0).toUpperCase() + fileData.status.slice(1)}
                                            </div>
                                        </div>
                                        
                                        {/* File Info and Form */}
                                        <div className="p-6">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                <span className="font-medium">{fileData.name}</span>
                                                <span>{formatFileSize(fileData.size)}</span>
                                            </div>

                                            {/* Metadata Form */}
                                            <div className="space-y-4">
                                                {/* Title */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Title <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={fileData.metadata.title}
                                                        onChange={(e) => updateFileMetadata(fileData.id, 'title', e.target.value)}
                                                        disabled={uploading || fileData.status === 'completed'}
                                                        placeholder="Enter wallpaper title"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                                        maxLength={100}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {fileData.metadata.title.length}/100 characters
                                                    </p>
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={fileData.metadata.description}
                                                        onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                                                        disabled={uploading || fileData.status === 'completed'}
                                                        placeholder="Describe your wallpaper (optional)"
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none"
                                                        maxLength={500}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {fileData.metadata.description.length}/500 characters
                                                    </p>
                                                </div>

                                                {/* Category */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Category <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={fileData.metadata.category}
                                                        onChange={(e) => updateFileMetadata(fileData.id, 'category', e.target.value)}
                                                        disabled={uploading || fileData.status === 'completed'}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                                    >
                                                        {categories.map(category => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Individual Cancel Button */}
                                                <div className="pt-2">
                                                    <button
                                                        onClick={() => removeFile(fileData.id)}
                                                        disabled={uploading}
                                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove this file
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress bar for uploading files */}
                                            {fileData.status === 'uploading' && (
                                                <div className="mt-4">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse w-full"></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Success state */}
                                            {fileData.status === 'completed' && (
                                                <div className="mt-4 text-center">
                                                    <div className="inline-flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Successfully uploaded
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error state */}
                                            {fileData.status === 'error' && (
                                                <div className="mt-4 text-center">
                                                    <div className="inline-flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Upload failed
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Results */}
                    {uploadResults.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-gray-900">Upload Results</h2>
                                <button
                                    onClick={startOver}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Upload More
                                </button>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="space-y-0">
                                    {uploadResults.map((result, index) => (
                                        <div
                                            key={result.id}
                                            className={`p-4 flex items-center justify-between ${
                                                index !== uploadResults.length - 1 ? 'border-b border-gray-100' : ''
                                            } ${
                                                result.status === 'success'
                                                    ? 'bg-green-50'
                                                    : 'bg-red-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                    result.status === 'success'
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {result.status === 'success' ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{result.name}</p>
                                                    {result.error && (
                                                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                result.status === 'success' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {result.status === 'success' ? 'Uploaded' : 'Failed'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                            <span className="text-xl">💡</span>
                            Upload Tips for Best Results
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Image Quality</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        Use high-resolution images (1920×1080 or higher)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        JPG files are smaller and upload faster
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        PNG files preserve transparency
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Upload Process</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        Fill out title and category for each image
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        Add descriptions to help others find your wallpapers
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        Drag and drop multiple files at once
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900 mb-1">Important Note</p>
                                    <p className="text-blue-800">
                                        Make sure to fill out all required fields (marked with *) before uploading. 
                                        Good titles and proper categorization help other users discover your wallpapers!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadWallpaper;