import { useState, useEffect } from 'react';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function PostCard({ post, userId, onClick, onUpdate }) {
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  // Track if this user has already voted in this poll, and aggregate votes
  const isPoll = post.type === 'poll';
  const pollOptions = isPoll ? (post.metadata?.pollOptions || post.metadata?.options || []) : [];
  const totalVotes = isPoll ? pollOptions.reduce((sum, opt) => sum + (opt.votes ? opt.votes.length : 0), 0) : 0;
  
  const hasVoted = isPoll && pollOptions.some(opt => 
    opt.votes && opt.votes.some(v => v.toString() === userId)
  );

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await guardianApi.toggleLike(post._id);
      onUpdate({
        ...post,
        likesCount: res.data.data.metrics.likesCount
      });
    } catch {
      toast.error('Failed to toggle like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await guardianApi.toggleSave(post._id);
      onUpdate({
        ...post,
        savesCount: res.data.data.metrics.savesCount
      });
      toast.success(res.data.data.isSaved ? 'Post bookmarked!' : 'Bookmark removed');
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      // Copy post link to clipboard
      const shareUrl = `${window.location.origin}/dashboard/feed?post=${post._id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Post link copied to clipboard!');
      
      const res = await guardianApi.sharePost(post._id, 'clipboard');
      onUpdate({
        ...post,
        sharesCount: res.data.data.metrics.sharesCount
      });
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (isFollowing) return;
    setIsFollowing(true);
    try {
      const res = await guardianApi.followUser(post.authorId._id);
      toast.success(res.data.message);
      // Trigger update
      onUpdate({
        ...post,
        authorFollowing: res.data.data.isFollowing
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle follow');
    } finally {
      setIsFollowing(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!reportReason.trim()) return;

    try {
      await guardianApi.reportPost(post._id, reportReason.trim());
      toast.success('Post reported successfully');
      setShowReportInput(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report post');
    }
  };

  const handlePollVote = async (e, optIdx) => {
    e.stopPropagation();
    if (hasVoted) {
      toast.error('You have already voted in this poll');
      return;
    }

    try {
      const res = await guardianApi.votePoll(post._id, optIdx);
      onUpdate(res.data.data);
      toast.success('Vote recorded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vote');
    }
  };

  // Date formatter helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const author = post.authorId || {};
  const isOwnPost = author._id === userId;

  return (
    <div className="card post-card" onClick={onClick} style={{ cursor: 'pointer', position: 'relative', border: post.feedScore > 100 ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid var(--glass-border)' }}>
      
      {/* Feed score ribbon if present */}
      {post.feedScore && (
        <span className="text-xs text-muted" style={{ position: 'absolute', top: '10px', right: '12px', opacity: 0.6 }}>
          ✨ Score: {Math.round(post.feedScore)}
        </span>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {author.firstName ? author.firstName[0] : 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              {author.firstName} {author.lastName}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
              {post.type}
            </span>
          </div>
          <div className="text-xs text-muted" style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <span>{author.branch} • Sem {author.semester}</span>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Follow/Unfollow Button */}
        {!isOwnPost && author._id && (
          <button className={`btn btn-xs ${post.authorFollowing ? 'btn-ghost' : 'btn-primary'}`} style={{ borderRadius: '99px', fontSize: '0.7rem' }} onClick={handleFollow}>
            {post.authorFollowing ? '✓ Following' : '＋ Follow'}
          </button>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
          {post.title}
        </h3>
      )}

      {/* Content */}
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)', whiteSpace: 'pre-line' }}>
        {post.content}
      </p>

      {/* ── Custom Renderers based on Post Type ── */}

      {/* A. Project renderer */}
      {post.type === 'project' && post.metadata && (
        <div className="feed-custom-block project-block" style={{ margin: '0 0 var(--space-md) 0', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            {post.metadata.techStack && post.metadata.techStack.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {post.metadata.techStack.map(stack => (
                  <span key={stack} className="chip chip-active" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                    {stack}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              {post.metadata.githubLink && (
                <a href={`https://${post.metadata.githubLink}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs" onClick={e => e.stopPropagation()}>
                  💻 GitHub
                </a>
              )}
              {post.metadata.demoLink && (
                <a href={`https://${post.metadata.demoLink}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-xs" onClick={e => e.stopPropagation()}>
                  🚀 Demo
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. Internship renderer */}
      {post.type === 'internship' && post.metadata && (
        <div className="feed-custom-block internship-block" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 0 var(--space-md) 0', padding: '12px', background: 'rgba(102, 126, 234, 0.05)', border: '1px solid rgba(102, 126, 234, 0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
          <div>
            <span className="text-muted">Company: </span>
            <strong style={{ color: 'var(--color-primary-light)' }}>{post.metadata.company}</strong>
          </div>
          <div>
            <span className="text-muted">Role: </span>
            <strong>{post.metadata.role}</strong>
          </div>
          <div>
            <span className="text-muted">Stipend: </span>
            <span style={{ color: 'var(--color-success)' }}>{post.metadata.stipend || 'Unpaid'}</span>
          </div>
          <div>
            <span className="text-muted">Location: </span>
            <span>{post.metadata.location || 'Remote'}</span>
          </div>
          {post.metadata.applicationDeadline && (
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
              <span className="text-muted">Deadline: </span>
              <span style={{ color: 'var(--color-error)' }}>{formatDate(post.metadata.applicationDeadline)}</span>
            </div>
          )}
        </div>
      )}

      {/* C. Event renderer */}
      {post.type === 'event' && post.metadata && (
        <div className="feed-custom-block event-block" style={{ margin: '0 0 var(--space-md) 0', padding: '12px', background: 'rgba(240, 147, 251, 0.05)', border: '1px solid rgba(240, 147, 251, 0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span className="text-muted">📅 Date: </span>
              <strong>{formatDate(post.metadata.eventDate)}</strong>
            </div>
            <div>
              <span className="text-muted">📍 Venue: </span>
              <span>{post.metadata.venue}</span>
            </div>
          </div>
          {post.metadata.registrationLink && (
            <a href={`https://${post.metadata.registrationLink}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-xs" onClick={e => e.stopPropagation()}>
              RSVP Now
            </a>
          )}
        </div>
      )}

      {/* D. Poll renderer */}
      {post.type === 'poll' && (
        <div className="feed-custom-block poll-block" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 var(--space-md) 0' }}>
          {pollOptions.map((opt, index) => {
            const votesCount = opt.votes ? opt.votes.length : 0;
            const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
            const userVotedForThis = opt.votes && opt.votes.some(v => v.toString() === userId);

            return (
              <div
                key={index}
                className={`poll-option-row ${userVotedForThis ? 'poll-option-voted' : ''}`}
                style={{ position: 'relative', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', cursor: hasVoted ? 'default' : 'pointer', overflow: 'hidden' }}
                onClick={(e) => handlePollVote(e, index)}
              >
                {/* Progress bar background */}
                {hasVoted && (
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percent}%`, background: 'rgba(102,126,234,0.1)', transition: 'width 0.4s ease' }}></div>
                )}
                
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', zIndex: 1, fontSize: '0.8rem' }}>
                  <span>
                    {opt.optionText} {userVotedForThis && ' (Your vote)'}
                  </span>
                  {hasVoted && (
                    <span style={{ fontWeight: 'bold' }}>{percent}% ({votesCount})</span>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted mt-xs">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</p>
        </div>
      )}

      {/* AI Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
          {post.hashtags.map(tag => (
            <span key={tag} className="text-xs" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Engagement Action Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
        <button className="btn btn-ghost btn-xs feed-action-btn" style={{ gap: '4px' }} onClick={handleLike}>
          👍 {post.likesCount || 0}
        </button>
        <button className="btn btn-ghost btn-xs feed-action-btn" style={{ gap: '4px' }}>
          💬 {post.commentsCount || 0} Comments
        </button>
        <button className="btn btn-ghost btn-xs feed-action-btn" style={{ gap: '4px' }} onClick={handleSave}>
          🔖 Bookmark
        </button>
        <button className="btn btn-ghost btn-xs feed-action-btn" style={{ gap: '4px' }} onClick={handleShare}>
          🔗 Share
        </button>
        <button className="btn btn-ghost btn-xs feed-action-btn" style={{ color: 'var(--color-text-muted)' }} onClick={(e) => { e.stopPropagation(); setShowReportInput(!showReportInput); }}>
          🚩 Report
        </button>
      </div>

      {/* Report Form Dropdown */}
      {showReportInput && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: '10px', padding: '10px', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleReportSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input form-input-sm"
              style={{ flex: 1 }}
              placeholder="Reason for report..."
              required
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-xs">Report</button>
          </form>
        </div>
      )}

    </div>
  );
}
