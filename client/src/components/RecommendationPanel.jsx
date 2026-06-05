import { useState } from 'react';
import { guardianApi } from '../api/guardianApi';
import toast from 'react-hot-toast';

export default function RecommendationPanel({ recommendations, onFollowUpdate }) {
  const [isProcessing, setIsProcessing] = useState(null);

  const handleFollow = async (studentId) => {
    setIsProcessing(studentId);
    try {
      const res = await guardianApi.followUser(studentId);
      toast.success(res.data.message);
      if (onFollowUpdate) onFollowUpdate();
    } catch {
      toast.error('Failed to toggle follow status');
    } finally {
      setIsProcessing(null);
    }
  };

  const hasStudents = recommendations && recommendations.students && recommendations.students.length > 0;
  const hasProjects = recommendations && recommendations.projects && recommendations.projects.length > 0;
  const hasCommunities = recommendations && recommendations.communities && recommendations.communities.length > 0;

  return (
    <div className="card feed-recommendation-panel" style={{ padding: 'var(--space-md)' }}>
      <h2 className="card-title" style={{ fontSize: '0.95rem', marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💡 Recommended Peers</span>
        <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>AI</span>
      </h2>

      {/* Suggested Students */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        {hasStudents ? (
          recommendations.students.map(student => {
            const details = student.details || {};
            return (
              <div key={student.studentId} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {details.fullName ? details.fullName[0] : 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {details.fullName}
                  </h4>
                  <p className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {details.branch} • Sem {details.semester}
                  </p>
                  <p className="text-xxs" style={{ color: 'var(--color-accent)', fontSize: '0.625rem', marginTop: '2px' }}>
                    {student.reason}
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-xs"
                  style={{ borderRadius: '99px', fontSize: '0.65rem' }}
                  disabled={isProcessing === student.studentId}
                  onClick={() => handleFollow(student.studentId)}
                >
                  Follow
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted">No peer suggestions available yet.</p>
        )}
      </div>

      {/* Suggested Projects & Communities */}
      {(hasProjects || hasCommunities) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Suggested Channels</h3>
          
          {hasCommunities && recommendations.communities.slice(0, 2).map(c => (
            <div key={c.communityId} className="feed-widget-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--color-primary-light)' }}>
                  #{c.details?.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Join</span>
              </div>
              <p className="text-xxs text-muted" style={{ marginTop: '2px' }}>{c.details?.description}</p>
            </div>
          ))}

          {hasProjects && recommendations.projects.slice(0, 2).map(p => (
            <div key={p.itemId} className="feed-widget-item">
              <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                💻 {p.title}
              </span>
              <p className="text-xxs text-muted" style={{ marginTop: '2px' }}>By: {p.authorName} • {p.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
