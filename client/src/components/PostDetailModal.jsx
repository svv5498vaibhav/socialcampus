import { useState, useEffect, useRef } from 'react';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function PostDetailModal({ post, userId, onClose, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTimeRef = useRef(null);

  // 1. Log view and track watch time on mount/unmount
  useEffect(() => {
    // Record start time
    startTimeRef.current = Date.now();

    // Trigger initial view count increment (0 watch time logged immediately)
    guardianApi.trackView(post._id, 0).catch(() => {});

    // Clean up: track watch time when modal closes
    return () => {
      if (startTimeRef.current) {
        const watchTimeMs = Date.now() - startTimeRef.current;
        const watchTimeSec = Math.round(watchTimeMs / 1000);
        // Log watch time (only if > 0 seconds)
        if (watchTimeSec > 0) {
          guardianApi.trackView(post._id, watchTimeSec).catch(() => {});
        }
      }
    };
  }, [post._id]);

  // 2. Load comments
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await guardianApi.getComments(post._id);
      setComments(res.data.data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [post._id]);

  // 3. Handle comment submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await guardianApi.addComment(post._id, newComment.trim());
      setComments(prev => [...prev, res.data.data.comment]);
      setNewComment('');
      
      // Update comment counter in parent
      onUpdate({
        ...post,
        commentsCount: res.data.data.metrics.commentsCount
      });
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const author = post.authorId || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: '650px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem' }}>💬</span>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Discussion Thread</h3>
              <p className="text-xs text-muted">Author: @{author.firstName ? `${author.firstName.toLowerCase()}_${author.lastName?.toLowerCase()}` : 'campusx_user'}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>❌</button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Post Header details */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
              {author.firstName ? author.firstName[0] : 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{author.firstName} {author.lastName}</div>
              <div className="text-xs text-muted">{author.branch} • Sem {author.semester} • {formatDate(post.createdAt)}</div>
            </div>
          </div>

          {/* AI Generated Summary Badge */}
          {post.aiSummary && (
            <div style={{ padding: '10px 14px', background: 'rgba(67, 233, 123, 0.05)', borderLeft: '3px solid var(--color-success)', borderRadius: 'var(--radius-sm)' }}>
              <span className="badge badge-success" style={{ fontSize: '0.55rem', padding: '1px 4px', marginBottom: '4px', display: 'inline-block' }}>AI Summary</span>
              <p className="text-xs" style={{ color: 'var(--color-text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{post.aiSummary}"
              </p>
            </div>
          )}

          {/* Content */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            {post.title && (
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 'var(--space-sm)' }}>
                {post.title}
              </h2>
            )}
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {post.content}
            </p>
          </div>

          {/* Comments List */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px' }}>
              Comments ({comments.length})
            </h4>

            {isLoadingComments && (
              <div className="loader-container" style={{ minHeight: '60px' }}>
                <div className="loader"></div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.length > 0 ? (
                comments.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {c.userId?.firstName ? c.userId.firstName[0] : 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>{c.userId?.firstName} {c.userId?.lastName}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                !isLoadingComments && (
                  <p className="text-xs text-muted text-center" style={{ padding: '20px 0' }}>
                    No comments yet. Be the first to comment!
                  </p>
                )
              )}
            </div>
          </div>

        </div>

        {/* Footer: New Comment Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, height: '36px', fontSize: '0.8125rem' }}
              placeholder="Write a comment..."
              required
              disabled={isSubmitting}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ height: '36px' }} disabled={isSubmitting || !newComment.trim()}>
              Comment
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
