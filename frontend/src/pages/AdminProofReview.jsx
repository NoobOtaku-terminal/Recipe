import { useState, useEffect } from 'react';
import { Video, CheckCircle, XCircle, Clock, AlertTriangle, Trophy } from 'lucide-react';
import axios from 'axios';

const AdminProofReview = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, recent

  useEffect(() => {
    fetchPendingProofs();
  }, []);

  const fetchPendingProofs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/proofs/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProofs(response.data.proofs || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load proofs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (battleId, userId, approved, notes = '') => {
    try {
      setProcessing(`${battleId}-${userId}`);
      const token = localStorage.getItem('token');
      
      await axios.post('/api/proofs/verify', {
        battleId,
        userId,
        approved,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from pending list
      setProofs(prev => prev.filter(p => 
        !(p.battle_id === battleId && p.user_id === userId)
      ));
      
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to verify proof');
    } finally {
      setProcessing(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    return `${seconds}s`;
  };

  const getUrgencyColor = (hoursPending) => {
    if (hoursPending > 24) return 'text-red-600';
    if (hoursPending > 12) return 'text-orange-600';
    return 'text-gray-600';
  };

  const filteredProofs = proofs.filter(proof => {
    if (filter === 'pending') return proof.hours_pending > 6;
    if (filter === 'recent') return proof.hours_pending <= 6;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Proof Verification</h1>
                <p className="text-sm text-gray-600 mt-1">Review and approve battle video proofs</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{filteredProofs.length}</div>
              <div className="text-xs text-gray-600">Pending Review</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({proofs.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Urgent (&gt;6h) ({proofs.filter(p => p.hours_pending > 6).length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === 'recent'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recent (&lt;6h) ({proofs.filter(p => p.hours_pending <= 6).length})
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Proofs Table */}
        {filteredProofs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-sm text-gray-600">No pending proof verifications at the moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Battle
                    </th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Recipe
                    </th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProofs.map((proof) => (
                    <tr key={`${proof.battle_id}-${proof.user_id}`} className="hover:bg-gray-50">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{proof.username}</div>
                          <div className="text-xs text-amber-700">Level {proof.level}</div>
                        </div>
                      </td>

                      {/* Battle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-gray-900">{proof.dish_name}</span>
                        </div>
                      </td>

                      {/* Recipe */}
                      <td className="py-3.5 px-4">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate">
                          {proof.recipe_title}
                        </div>
                      </td>

                      {/* Video */}
                      <td className="py-3.5 px-4">
                        <div>
                          <a
                            href={proof.proof_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                          >
                            <Video className="w-4 h-4" />
                            <span>Watch</span>
                          </a>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatFileSize(proof.file_size_bytes)} • {formatDuration(proof.duration_seconds)}
                          </div>
                        </div>
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1">
                          <Clock className={`w-4 h-4 ${getUrgencyColor(proof.hours_pending)}`} />
                          <span className={`text-sm ${getUrgencyColor(proof.hours_pending)}`}>
                            {Math.floor(proof.hours_pending)}h ago
                          </span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4">
                        <div className="text-sm text-gray-600 max-w-[150px] truncate">
                          {proof.notes || '-'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleVerify(proof.battle_id, proof.user_id, true)}
                            disabled={processing === `${proof.battle_id}-${proof.user_id}`}
                            className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Rejection reason (optional):');
                              if (notes !== null) {
                                handleVerify(proof.battle_id, proof.user_id, false, notes);
                              }
                            }}
                            disabled={processing === `${proof.battle_id}-${proof.user_id}`}
                            className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs text-gray-600 uppercase">Total Pending</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{proofs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs text-gray-600 uppercase">Urgent (&gt;6h)</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {proofs.filter(p => p.hours_pending > 6).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-xs text-gray-600 uppercase">Recent (&lt;6h)</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {proofs.filter(p => p.hours_pending <= 6).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProofReview;
