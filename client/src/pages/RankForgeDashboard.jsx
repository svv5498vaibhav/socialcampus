import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { guardianApi } from '../api/guardianApi';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function RankForgeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [leaderboardSubTab, setLeaderboardSubTab] = useState('weekly');
  
  // Data States
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [reputation, setReputation] = useState({ score: 0, level: 'Bronze', nextTierPoints: 1000 });
  const [points, setPoints] = useState(user?.points || 0);

  // Status States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTabContent();
  }, [activeTab, leaderboardSubTab]);

  const loadTabContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Always load profile/reputation to update HUD points
      const repRes = await guardianApi.getProfile();
      if (repRes.data?.data?.user) {
        setPoints(repRes.data.data.user.points || 0);
        setReputation({
          score: repRes.data.data.user.reputationScore || 0,
          level: repRes.data.data.user.reputationLevel || 'Bronze',
          nextTierPoints: 1000
        });
      }

      if (activeTab === 'leaderboard') {
        let res;
        if (leaderboardSubTab === 'weekly') {
          res = await guardianApi.getWeeklyLeaderboard();
        } else if (leaderboardSubTab === 'monthly') {
          res = await guardianApi.getMonthlyLeaderboard();
        } else {
          res = await guardianApi.getBranchLeaderboard(user?.branch || '');
        }
        setLeaderboard(res.data?.data?.rankings || res.data?.data || []);
      } else if (activeTab === 'badges') {
        const res = await guardianApi.getBadges();
        setBadges(res.data?.data || []);
      } else if (activeTab === 'achievements') {
        const res = await guardianApi.getAchievements();
        setAchievements(res.data?.data || []);
      } else if (activeTab === 'store') {
        const [rewRes, histRes] = await Promise.all([
          guardianApi.getRewards(),
          guardianApi.getRewardHistory()
        ]);
        setRewards(rewRes.data?.data || []);
        setRewardHistory(histRes.data?.data?.transactions || histRes.data?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from the server. Using offline mock datasets.');
      // Load Offline Mock fallback data
      loadMockFallback();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockFallback = () => {
    if (activeTab === 'leaderboard') {
      setLeaderboard([
        { rank: 1, userId: { firstName: 'Saurabh', lastName: 'Kumar', branch: 'CSE' }, points: 2850, reputationScore: 420 },
        { rank: 2, userId: { firstName: 'Divya', lastName: 'Jha', branch: 'ECE' }, points: 2420, reputationScore: 310 },
        { rank: 3, userId: { firstName: 'Rohan', lastName: 'Mehta', branch: 'CSE' }, points: 1980, reputationScore: 280 },
        { rank: 4, userId: { firstName: 'Tanmay', lastName: 'Shah', branch: 'ME' }, points: 1750, reputationScore: 200 }
      ]);
    } else if (activeTab === 'badges') {
      setBadges([
        { _id: 'b1', name: 'OpenCV Wizard', description: 'Complete 3 computer vision projects.', icon: '👁️', isUnlocked: true, unlockedAt: new Date().toISOString() },
        { _id: 'b2', name: 'SafeVoice Champion', description: 'Receive 10 helpful feedback tags.', icon: '🛡️', isUnlocked: true, unlockedAt: new Date().toISOString() },
        { _id: 'b3', name: 'Creator Prime', description: 'Publish a project receiving 100+ views.', icon: '💻', isUnlocked: false },
        { _id: 'b4', name: 'Branch Star', description: 'Attend 5 branch community events.', icon: '⭐', isUnlocked: false }
      ]);
    } else if (activeTab === 'achievements') {
      setAchievements([
        { _id: 'a1', name: 'First Contribution', description: 'Publish your first content article.', icon: '📝', points: 100, currentProgress: 1, targetProgress: 1, completed: true },
        { _id: 'a2', name: 'Inquisitive Mind', description: 'Submit 5 anonymous complaints/suggestions.', icon: '❓', points: 250, currentProgress: 3, targetProgress: 5, completed: false },
        { _id: 'a3', name: 'Collaborator', description: 'Join 3 student communities.', icon: '👥', points: 300, currentProgress: 1, targetProgress: 3, completed: false }
      ]);
    } else if (activeTab === 'store') {
      setRewards([
        { _id: 'r1', name: 'CampusX Hoodie', description: 'Premium developer apparel.', icon: '🧥', cost: 1500, stock: 12 },
        { _id: 'r2', name: 'AI Workshop Ticket', description: 'VIP passes to local hackathons.', icon: '🎟️', cost: 500, stock: 45 },
        { _id: 'r3', name: 'Sticker Pack', description: 'A cool bundle of developer decals.', icon: '💻', cost: 200, stock: 120 }
      ]);
      setRewardHistory([
        { _id: 'tx1', rewardId: { name: 'Sticker Pack', icon: '💻' }, cost: 200, status: 'fulfilled', createdAt: new Date().toISOString() }
      ]);
    }
  };

  const handleRedeem = async (rewardId, cost) => {
    if (points < cost) {
      toast.error('Insufficient points to redeem this item.');
      return;
    }

    try {
      const res = await guardianApi.redeemReward(rewardId);
      toast.success(res.data?.message || 'Reward redeemed successfully!');
      loadTabContent(); // Refresh stats & history
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed. Try again.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="dashboard-content">
        {/* HUD Headers */}
        <div className="points-hud">
          <div>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Current RankForge Reputation</span>
            <div className="points-hud-value">⚡ {points} Points</div>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Reputation Score: <strong>{reputation.score}</strong> • Tier: <strong>{reputation.level}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2.5rem' }}>🏆</span>
          </div>
        </div>

        {/* Dashboards Navigation Tabs */}
        <div className="dashboard-tabs">
          <button className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('leaderboard')}>
            📊 Leaderboards
          </button>
          <button className={`btn ${activeTab === 'badges' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('badges')}>
            🥇 Badges
          </button>
          <button className={`btn ${activeTab === 'achievements' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('achievements')}>
            🎉 Achievements
          </button>
          <button className={`btn ${activeTab === 'store' ? 'btn-primary' : 'btn-ghost'} btn-sm`} style={{ flex: 1 }} onClick={() => setActiveTab('store')}>
            🎁 Rewards Store
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)' }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Tab Contents */}
        {isLoading ? (
          <div className="loader-container" style={{ padding: '40px' }}>
            <div className="loader"></div>
            <p className="loader-text">Loading RankForge Ecosystem...</p>
          </div>
        ) : (
          <>
            {/* 1. Leaderboard Content */}
            {activeTab === 'leaderboard' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 className="card-title">Campus Rankings</h2>
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <button className={`btn ${leaderboardSubTab === 'weekly' ? 'btn-secondary' : 'btn-ghost'} btn-sm`} onClick={() => setLeaderboardSubTab('weekly')}>Weekly</button>
                    <button className={`btn ${leaderboardSubTab === 'monthly' ? 'btn-secondary' : 'btn-ghost'} btn-sm`} onClick={() => setLeaderboardSubTab('monthly')}>Monthly</button>
                    <button className={`btn ${leaderboardSubTab === 'branch' ? 'btn-secondary' : 'btn-ghost'} btn-sm`} onClick={() => setLeaderboardSubTab('branch')}>My Branch</button>
                  </div>
                </div>

                <div className="table-container">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Branch</th>
                        <th>Reputation</th>
                        <th>Point Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length > 0 ? (
                        leaderboard.map((item, idx) => {
                          const rank = item.rank || idx + 1;
                          const student = item.userId || item.user || {};
                          return (
                            <tr key={item._id || idx} className="leaderboard-row">
                              <td className="rank-badge-cell">
                                <span className={`rank-number rank-${rank <= 3 ? rank : 'normal'}`}>{rank}</span>
                                {rank === 1 && <span className="rank-crown">👑</span>}
                                {rank === 2 && <span className="rank-crown">🥈</span>}
                                {rank === 3 && <span className="rank-crown">🥉</span>}
                              </td>
                              <td style={{ fontWeight: '700' }}>
                                {student.firstName} {student.lastName}
                              </td>
                              <td className="text-muted">{student.branch || 'CSE'}</td>
                              <td>⚡ {item.reputationScore || item.reputation || 0}</td>
                              <td style={{ color: 'var(--color-primary-light)', fontWeight: 800 }}>{item.points || item.totalPoints || 0} pts</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted" style={{ padding: '30px' }}>No rankings logged for this period yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Badges Content */}
            {activeTab === 'badges' && (
              <div>
                <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Ecosystem Badges</h2>
                <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-lg)' }}>Earn reputation badges by posting projects, completing peer-mentoring hours, and building communities.</p>
                
                <div className="grid-badges">
                  {badges.length > 0 ? (
                    badges.map((badge) => {
                      const isUnlocked = badge.isUnlocked !== undefined ? badge.isUnlocked : badge.unlocked;
                      return (
                        <div key={badge._id} className={`badge-card ${!isUnlocked ? 'badge-locked' : ''}`}>
                          {!isUnlocked && <div className="badge-locked-overlay">🔒</div>}
                          <span className="badge-card-icon">{badge.icon || '🎖️'}</span>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '8px' }}>{badge.name}</h3>
                          <p className="text-xs text-muted" style={{ marginTop: '4px', lineHeight: 1.4 }}>{badge.description}</p>
                          {isUnlocked && (
                            <span className="badge badge-success" style={{ marginTop: '10px', fontSize: '0.6rem' }}>
                              Unlocked
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="card text-center" style={{ gridColumn: '1 / -1', padding: '30px' }}>
                      <p className="text-muted">No badges registered in system.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Achievements Content */}
            {activeTab === 'achievements' && (
              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>System Achievements</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {achievements.length > 0 ? (
                    achievements.map((ach) => {
                      const completed = ach.completed || ach.currentProgress >= ach.targetProgress;
                      const progressPct = Math.min(100, Math.round(((ach.currentProgress || 0) / (ach.targetProgress || 1)) * 100));
                      
                      return (
                        <div key={ach._id} style={{
                          background: 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--space-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          opacity: completed ? 1 : 0.8
                        }}>
                          <div style={{ fontSize: '2rem' }}>{ach.icon || '🏆'}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{ach.name}</h3>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>+{ach.points} Pts</span>
                            </div>
                            <p className="text-xs text-muted" style={{ margin: '2px 0 8px 0' }}>{ach.description}</p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${progressPct}%`,
                                  height: '100%',
                                  background: completed ? 'var(--gradient-success)' : 'var(--gradient-primary)'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                                {ach.currentProgress || 0}/{ach.targetProgress || 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted text-center">No achievements unlocked yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Rewards Store Content */}
            {activeTab === 'store' && (
              <div>
                <h2 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>Available Store Rewards</h2>
                <div className="rewards-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                  {rewards.length > 0 ? (
                    rewards.map((reward) => {
                      const canRedeem = points >= reward.cost && reward.stock > 0;
                      return (
                        <div key={reward._id} className="card reward-card">
                          <div className="reward-card-image">
                            {reward.icon || '🎁'}
                          </div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{reward.name}</h3>
                          <p className="text-xs text-muted" style={{ margin: '4px 0 12px 0', minHeight: '36px', lineHeight: 1.4 }}>{reward.description}</p>
                          
                          <div className="reward-card-cost">
                            <span style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '0.9rem' }}>⚡ {reward.cost} Pts</span>
                            <span className="text-xs text-muted">Stock: {reward.stock}</span>
                          </div>
                          
                          <button 
                            className={`btn ${canRedeem ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ width: '100%', marginTop: '12px' }}
                            disabled={!canRedeem}
                            onClick={() => handleRedeem(reward._id, reward.cost)}
                          >
                            {reward.stock === 0 ? 'Out of Stock' : canRedeem ? 'Redeem Item' : 'Insufficient Points'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="card text-center" style={{ gridColumn: '1 / -1', padding: '30px' }}>
                      <p className="text-muted">No items available in store right now.</p>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h2 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Redemption Transactions Log</h2>
                  <div className="table-container">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Points Cost</th>
                          <th>Status</th>
                          <th>Redemption Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewardHistory.length > 0 ? (
                          rewardHistory.map((tx) => (
                            <tr key={tx._id} className="leaderboard-row">
                              <td style={{ fontWeight: 700 }}>
                                <span style={{ marginRight: '8px' }}>{tx.rewardId?.icon || '🎁'}</span>
                                {tx.rewardId?.name || 'Redeemed Item'}
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--color-error)' }}>-{tx.cost} Pts</td>
                              <td>
                                <span className={`badge ${tx.status === 'fulfilled' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-neutral'}`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="text-muted">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted" style={{ padding: '20px' }}>No items redeemed yet. Check the store inventory above!</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
