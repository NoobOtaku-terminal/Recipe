import { useState } from 'react';
import { Upload, Video, CheckCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

const VideoProofUpload = ({ battleId, recipeId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    setError('');
    setSuccess('');

    if (!selected) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Invalid file type. Please upload MP4, WebM, MOV, or AVI.');
      return;
    }

    // Validate file size
    if (selected.size > MAX_SIZE) {
      setError(`File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('battleId', battleId);
    formData.append('recipeId', recipeId);
    if (notes) formData.append('notes', notes);

    try {
      setUploading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/proofs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess(response.data.message);
      
      // Clear form
      setFile(null);
      setPreview(null);
      setNotes('');
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.data.proof);
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload video proof');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (preview) URL.revokeObjectURL(preview);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Video className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Upload Proof of Cooking</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        To vote, you must upload a video showing you made this recipe. Max 20MB, max 60 seconds.
      </p>

      {/* File Upload */}
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Click to upload video
            </p>
            <p className="text-xs text-gray-500">
              MP4, WebM, MOV, or AVI (max 20MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              src={preview}
              controls
              className="w-full max-h-64 object-contain"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{file.name}</span>
            <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your cooking process..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={3}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {uploading ? 'Uploading...' : 'Submit Proof & Vote'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 flex items-start space-x-2 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Video Guidelines:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Show yourself preparing the recipe</li>
          <li>• Include key cooking steps</li>
          <li>• Display the final dish</li>
          <li>• Keep it under 60 seconds</li>
          <li>• File size must be under 20MB</li>
          <li>• Level 4+ users get auto-approval</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoProofUpload;
