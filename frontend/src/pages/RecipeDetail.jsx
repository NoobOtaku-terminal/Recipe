import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recipesAPI, likesAPI, commentsAPI, ratingsAPI } from '../services/api'
import { Clock, Star, ChefHat, ThumbsUp, ThumbsDown, MessageCircle, Edit2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesAPI.get(id)
  })

  const { data: likesData } = useQuery({
    queryKey: ['likes', id],
    queryFn: () => likesAPI.getStats(id)
  })

  const { data: myLike } = useQuery({
    queryKey: ['myLike', id],
    queryFn: () => likesAPI.getMine(id),
    enabled: isAuthenticated
  })

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => commentsAPI.getByRecipe(id)
  })

  const { data: ratingsData } = useQuery({
    queryKey: ['ratings', id],
    queryFn: () => ratingsAPI.getByRecipe(id)
  })

  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: (rating) => ratingsAPI.create({ recipeId: id, rating }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ratings', id])
      queryClient.invalidateQueries(['recipe', id])
      toast.success('Rating submitted!')
      setUserRating(0)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit rating')
    }
  })

  // Like/Dislike mutation
  const likeMutation = useMutation({
    mutationFn: ({ isLike }) => likesAPI.toggle(id, isLike),
    onSuccess: () => {
      queryClient.invalidateQueries(['likes', id])
      queryClient.invalidateQueries(['myLike', id])
      queryClient.invalidateQueries(['recipe', id])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to react')
    }
  })

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content) => commentsAPI.create({ 
      recipeId: id, 
      content,
      parentId: replyTo 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', id])
      queryClient.invalidateQueries(['recipe', id])
      setCommentText('')
      setReplyTo(null)
      toast.success('Comment added!')
    }
  })

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Please login to like recipes')
      return
    }
    // If already liked, remove the like. Otherwise, like it
    if (hasLiked) {
      likesAPI.remove(id).then(() => {
        queryClient.invalidateQueries(['likes', id])
        queryClient.invalidateQueries(['myLike', id])
        queryClient.invalidateQueries(['recipe', id])
        toast.success('Like removed')
      })
    } else {
      likeMutation.mutate({ isLike: true })
    }
  }

  const handleDislike = () => {
    if (!isAuthenticated) {
      toast.error('Please login to dislike recipes')
      return
    }
    // If already disliked, remove the dislike. Otherwise, dislike it
    if (hasDisliked) {
      likesAPI.remove(id).then(() => {
        queryClient.invalidateQueries(['likes', id])
        queryClient.invalidateQueries(['myLike', id])
        queryClient.invalidateQueries(['recipe', id])
        toast.success('Dislike removed')
      })
    } else {
      likeMutation.mutate({ isLike: false })
    }
  }

  const handleComment = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to comment')
      return
    }
    if (!commentText.trim()) return
    commentMutation.mutate(commentText)
  }

  if (isLoading) return <div className="text-center py-12">Loading...</div>

  const recipe = data?.recipe
  const isOwner = user?.id === recipe?.author_id
  const hasLiked = myLike?.isLike === true
  const hasDisliked = myLike?.isLike === false

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold">{recipe?.title}</h1>
          {isOwner && (
            <Link to={`/recipes/${id}/edit`} className="btn btn-sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Link>
          )}
        </div>
        <p className="text-gray-600 mb-6">{recipe?.description}</p>

        <div className="flex items-center gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{recipe?.cook_time_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span>{Number(recipe?.avg_rating || 0).toFixed(1)} ({recipe?.rating_count || 0} ratings)</span>
          </div>
          <span className={`badge ${recipe?.is_veg ? 'badge-success' : 'badge-warning'}`}>
            {recipe?.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
          </span>
          <span className="badge badge-info">{recipe?.difficulty_claimed}</span>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span>{recipe?.comment_count || 0} comments</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <ChefHat className="w-5 h-5" />
            <span>By {recipe?.author_name}</span>
          </div>

          {/* Like/Dislike Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                hasLiked 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span>{likesData?.like_count || 0}</span>
            </button>
            <button
              onClick={handleDislike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                hasDisliked 
                  ? 'bg-red-100 border-red-500 text-red-700' 
                  : 'border-gray-300 hover:border-red-500'
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span>{likesData?.dislike_count || 0}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe?.ingredients?.map((ing, i) => (
              <li key={i} className="flex justify-between">
                <span>{ing.name}</span>
                <span className="text-gray-600">{ing.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Instructions</h2>
          <ol className="space-y-3">
            {recipe?.steps?.map((step) => (
              <li key={step.step_no} className="flex gap-3">
                <span className="font-bold text-primary">{step.step_no}.</span>
                <span>{step.instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Comments ({commentsData?.comments?.length || 0})</h2>
        
        {/* Main Comment Form - Only for top-level comments */}
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="input min-h-[80px] mb-3"
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={commentMutation.isPending}
            >
              {commentMutation.isPending ? 'Posting...' : 'Comment'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg mb-6">
            <Link to="/login" className="text-primary underline">Login</Link> to comment
          </div>
        )}

        {/* Comments List with Scroll */}
        <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
          {!commentsData?.comments || commentsData.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
          ) : (
            commentsData.comments.filter(c => !c.parent_id).map((comment) => (
              <Comment 
                key={comment.id} 
                comment={comment} 
                allComments={commentsData.comments}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                isAuthenticated={isAuthenticated}
                commentText={commentText}
                setCommentText={setCommentText}
                handleComment={handleComment}
                commentMutation={commentMutation}
              />
            ))
          )}
        </div>
      </div>

      {/* Ratings Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Ratings</h2>
        
        {/* Submit Rating */}
        {isAuthenticated && !isOwner && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-3">Rate this recipe:</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    setUserRating(star)
                    ratingMutation.mutate(star)
                  }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={ratingMutation.isPending}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || userRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {ratingMutation.isPending && (
                <span className="text-sm text-gray-600 ml-2">Submitting...</span>
              )}
            </div>
          </div>
        )}

        {!ratingsData?.ratings || ratingsData.ratings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No ratings yet</p>
        ) : (
          <div className="space-y-3">
            {ratingsData.ratings.map((rating, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{rating.username}</p>
                  {rating.judge_level && (
                    <p className="text-sm text-gray-600">{rating.judge_level}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(rating.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Comment Component with Inline Replies (YouTube/Instagram style)
function Comment({ comment, allComments, replyTo, setReplyTo, isAuthenticated, commentText, setCommentText, handleComment, commentMutation, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(true)
  const replies = allComments?.filter(c => c.parent_id === comment.id) || []
  const isReplying = replyTo === comment.id
  
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-semibold">
          {comment.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.username}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-800 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            {isAuthenticated && depth < 3 && (
              <button
                onClick={() => setReplyTo(isReplying ? null : comment.id)}
                className="text-xs font-semibold text-gray-600 hover:text-primary transition-colors"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Inline Reply Form */}
      {isReplying && isAuthenticated && (
        <div className="ml-13 mb-4">
          <form onSubmit={handleComment} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
              {isAuthenticated ? 'You'[0] : '?'}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Reply to ${comment.username}...`}
                className="input min-h-[60px] text-sm mb-2 w-full"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={commentMutation.isPending}
                >
                  {commentMutation.isPending ? 'Posting...' : 'Reply'}
                </button>
                <button 
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="btn btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              allComments={allComments}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              isAuthenticated={isAuthenticated}
              commentText={commentText}
              setCommentText={setCommentText}
              handleComment={handleComment}
              commentMutation={commentMutation}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
