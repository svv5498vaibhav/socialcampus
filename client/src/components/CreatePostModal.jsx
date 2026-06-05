import { useState, useEffect } from 'react';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function CreatePostModal({ onClose, onPublished }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Type Selection and Metadata
  const [postType, setPostType] = useState('discussion');
  const [projectMeta, setProjectMeta] = useState({ githubLink: '', demoLink: '', techStack: '' });
  const [internshipMeta, setInternshipMeta] = useState({ company: '', role: '', stipend: '', location: '', applicationDeadline: '' });
  const [eventMeta, setEventMeta] = useState({ eventDate: '', venue: '', registrationLink: '' });
  
  // Poll Options
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Client side AI Heuristics Preview
  const [aiPreview, setAiPreview] = useState({ type: 'discussion', hashtags: [], summary: '' });

  // 1. Live AI Preview compilation
  useEffect(() => {
    if (content.length < 5) {
      setAiPreview({ type: 'discussion', hashtags: [], summary: 'Type some content to see AI analysis...' });
      return;
    }

    const text = `${title} ${content}`.toLowerCase();
    
    // Categorization
    let predictedType = 'discussion';
    if (pollOptions.some(o => o.trim().length > 0)) {
      predictedType = 'poll';
    } else if (text.includes('intern') || text.includes('hiring') || internshipMeta.company) {
      predictedType = 'internship';
    } else if (text.includes('event') || text.includes('rsvp') || text.includes('workshop') || eventMeta.eventDate) {
      predictedType = 'event';
    } else if (text.includes('github') || text.includes('project') || projectMeta.githubLink) {
      predictedType = 'project';
    } else if (text.includes('achieved') || text.includes('won') || text.includes('certified')) {
      predictedType = 'achievement';
    } else if (text.includes('cheat sheet') || text.includes('tutorial') || text.includes('drive.google')) {
      predictedType = 'resource';
    } else if (text.includes('?')) {
      predictedType = 'question';
    }
    setPostType(predictedType);

    // Hashtags
    const tags = new Set([predictedType]);
    const keywordMap = {
      'javascript': 'javascript', 'react': 'react', 'python': 'python', 'java': 'java',
      'opencv': 'opencv', 'node': 'nodejs', 'mongodb': 'mongodb', 'dsa': 'dsa', 'hackathon': 'hackathon'
    };
    Object.keys(keywordMap).forEach(k => {
      if (text.includes(k)) tags.add(keywordMap[k]);
    });

    // Summary
    const cleanContent = content.replace(/\s+/g, ' ');
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const summary = sentences[0] ? sentences[0].substring(0, 80) + '...' : cleanContent.substring(0, 80) + '...';

    setAiPreview({
      type: predictedType,
      hashtags: Array.from(tags).slice(0, 4),
      summary
    });

  }, [title, content, pollOptions, projectMeta.githubLink, internshipMeta.company, eventMeta.eventDate]);

  const handleAddMedia = () => {
    if (mediaUrl.trim() && mediaUrl.startsWith('http')) {
      setMediaUrls(prev => [...prev, mediaUrl.trim()]);
      setMediaUrl('');
    } else {
      toast.error('Please enter a valid media URL');
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions(prev => [...prev, '']);
    } else {
      toast.error('Maximum 5 poll options');
    }
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx, val) => {
    setPollOptions(prev => prev.map((item, i) => i === idx ? val : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      toast.error('Content must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build metadata
      let metadata = {};
      if (postType === 'project') {
        metadata = {
          githubLink: projectMeta.githubLink,
          demoLink: projectMeta.demoLink,
          techStack: projectMeta.techStack.split(',').map(s => s.trim()).filter(Boolean)
        };
      } else if (postType === 'internship') {
        metadata = { ...internshipMeta };
      } else if (postType === 'event') {
        metadata = { ...eventMeta };
      } else if (postType === 'poll') {
        metadata = {
          pollOptions: pollOptions.filter(o => o.trim().length > 0).map(opt => ({
            optionText: opt.trim(),
            votes: []
          }))
        };
        if (metadata.pollOptions.length < 2) {
          toast.error('Polls require at least 2 valid options');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await guardianApi.createPost({
        title: title.trim(),
        content: content.trim(),
        mediaUrls,
        metadata
      });

      onPublished(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2 className="card-title">✍️ Create New Post</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>❌</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 'var(--space-md)' }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="post-title">Title (Optional)</label>
            <input
              type="text"
              id="post-title"
              className="form-input"
              placeholder="e.g. OpenCV Face Recognition app"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="post-content">Description / Content</label>
            <textarea
              id="post-content"
              className="form-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder="What do you want to share with the campus?"
              required
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          {/* Type Selector (Auto Category overrides) */}
          <div className="form-group">
            <label className="form-label">Post Categorization Category</label>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['discussion', 'project', 'internship', 'event', 'poll', 'resource', 'question', 'achievement'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`btn ${postType === t ? 'btn-primary' : 'btn-ghost'} btn-xs`}
                  style={{ borderRadius: '99px' }}
                  onClick={() => setPostType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-xs">AI auto-categorization will apply, but you can override it here.</p>
          </div>

          {/* ── Sub-forms based on Post Type ── */}

          {/* Project Fields */}
          {postType === 'project' && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label text-xs">GitHub Repository Link</label>
                <input type="text" className="form-input form-input-sm" placeholder="github.com/user/project" value={projectMeta.githubLink} onChange={e => setProjectMeta(prev => ({ ...prev, githubLink: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Live Demo Link</label>
                <input type="text" className="form-input form-input-sm" placeholder="project.vercel.app" value={projectMeta.demoLink} onChange={e => setProjectMeta(prev => ({ ...prev, demoLink: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Tech Stack (comma separated)</label>
                <input type="text" className="form-input form-input-sm" placeholder="React, Node, Python, OpenCV" value={projectMeta.techStack} onChange={e => setProjectMeta(prev => ({ ...prev, techStack: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Internship Fields */}
          {postType === 'internship' && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label text-xs">Company Name</label>
                <input type="text" className="form-input form-input-sm" placeholder="e.g. Google" value={internshipMeta.company} onChange={e => setInternshipMeta(prev => ({ ...prev, company: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Intern Role</label>
                <input type="text" className="form-input form-input-sm" placeholder="e.g. Software Engineer Intern" value={internshipMeta.role} onChange={e => setInternshipMeta(prev => ({ ...prev, role: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Stipend / Salary</label>
                <input type="text" className="form-input form-input-sm" placeholder="e.g. $500/mo or 25k/mo" value={internshipMeta.stipend} onChange={e => setInternshipMeta(prev => ({ ...prev, stipend: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Location</label>
                <input type="text" className="form-input form-input-sm" placeholder="e.g. Remote or Bangalore" value={internshipMeta.location} onChange={e => setInternshipMeta(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label text-xs">Application Deadline</label>
                <input type="date" className="form-input form-input-sm" value={internshipMeta.applicationDeadline} onChange={e => setInternshipMeta(prev => ({ ...prev, applicationDeadline: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Event Fields */}
          {postType === 'event' && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label text-xs">Event Date & Time</label>
                <input type="datetime-local" className="form-input form-input-sm" value={eventMeta.eventDate} onChange={e => setEventMeta(prev => ({ ...prev, eventDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Venue / Platform</label>
                <input type="text" className="form-input form-input-sm" placeholder="e.g. Seminar Hall A or Google Meet" value={eventMeta.venue} onChange={e => setEventMeta(prev => ({ ...prev, venue: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Registration / RSVP Link</label>
                <input type="text" className="form-input form-input-sm" placeholder="https://forms.gle/..." value={eventMeta.registrationLink} onChange={e => setEventMeta(prev => ({ ...prev, registrationLink: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Poll Options */}
          {postType === 'poll' && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-label text-xs">Poll Options</label>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => handlePollOptionChange(i, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleRemovePollOption(i)}>❌</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-xs" style={{ width: 'auto', alignSelf: 'flex-start' }} onClick={handleAddPollOption}>
                ➕ Add Option
              </button>
            </div>
          )}

          {/* Media Links */}
          <div className="form-group">
            <label className="form-label">Attach Media Links</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Paste image/file URL..."
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
              />
              <button type="button" className="btn btn-ghost" onClick={handleAddMedia}>Add Link</button>
            </div>
            {mediaUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {mediaUrls.map((url, index) => (
                  <span key={index} className="chip chip-active" style={{ fontSize: '0.7rem' }}>
                    🔗 Link #{index + 1}
                    <button type="button" style={{ background: 'none', border: 'none', color: 'red', marginLeft: '6px', cursor: 'pointer' }} onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}>x</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Live AI Preview HUD ── */}
          <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ Live FeedSense AI Assistant Preview
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div>
                <span className="text-muted">Predicted Type: </span>
                <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{aiPreview.type}</span>
              </div>
              <div>
                <span className="text-muted">Generated Summary: </span>
                <span style={{ color: 'var(--color-text-primary)' }}>{aiPreview.summary || '...'}</span>
              </div>
              {aiPreview.hashtags.length > 0 && (
                <div>
                  <span className="text-muted">Auto-Hashtags: </span>
                  <span style={{ color: 'var(--color-accent)' }}>
                    {aiPreview.hashtags.map(h => `#${h}`).join(' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-md)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : '🚀 Publish Post'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
