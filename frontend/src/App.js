import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tweets, setTweets] = useState([]);
  const [newTweet, setNewTweet] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(true);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeTab, setActiveTab] = useState('register');
  const [apiStatus, setApiStatus] = useState('Bağlantı test ediliyor...');
  const [notification, setNotification] = useState(null); // { message, type: 'success'|'error' }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // tweetId waiting for confirmation
  const currentUserRef = useRef(currentUser);

  const API_URL = 'http://localhost:3000';

  // show a toast notification instead of alert()
  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const parseError = (error) => {
    const errData = error.response?.data;
    if (typeof errData === 'string') return errData;
    if (errData?.message) return errData.message;
    if (errData?.errors) return Object.values(errData.errors).join(', ');
    return error.message;
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const axiosInstance = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use(
      (config) => {
        const user = currentUserRef.current;
        if (user) {
          config.headers.Authorization = `Basic ${btoa(`${user.username}:${user.password}`)}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          notify('Oturum süresi doldu. Lütfen tekrar giriş yapın.', 'error');
          setShowUserModal(true);
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, []);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setApiStatus('Backend bağlantısı test ediliyor...');
      await axios.get(`${API_URL}/test`);
      setApiStatus('✅ Backend bağlantısı başarılı');
      fetchUsers();
      fetchTweets();
    } catch (error) {
      setApiStatus('❌ Backend bağlantısı başarısız');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/all`);
      setUsers(response.data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tweet/all`);
      const user = currentUserRef.current;
      const formattedTweets = response.data.map(tweet => ({
        ...tweet,
        likesCount: tweet.likes ? tweet.likes.length : 0,
        retweetsCount: tweet.retweets ? tweet.retweets.length : 0,
        commentsCount: tweet.comments ? tweet.comments.length : 0,
        isRetweet: !!tweet.retweetedBy,
        retweetedBy: tweet.retweetedBy || null,
        likedByCurrentUser: user
          ? tweet.likes?.some(like => like.user?.id === user.id) || false
          : false,
        retweetedByCurrentUser: user
          ? tweet.retweets?.some(rt => rt.user?.id === user.id) || false
          : false,
      }));
      setTweets(formattedTweets);
    } catch (error) {
      console.error('Tweetler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      notify('Lütfen tüm alanları doldurun!', 'error');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: newUserName,
        email: newUserEmail,
        password: newUserPassword,
      });
      const newUser = {
        id: response.data.id,
        username: newUserName,
        email: newUserEmail,
        password: newUserPassword,
      };
      setCurrentUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setShowUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      notify(`Kayıt başarılı: ${newUser.username}`);
      fetchTweets();
    } catch (error) {
      notify(`Kayıt başarısız: ${parseError(error)}`, 'error');
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      notify('Lütfen kullanıcı adı ve şifre girin!', 'error');
      return;
    }
    try {
      await axios.post(`${API_URL}/auth/login`, {
        username: loginUsername,
        password: loginPassword,
      });
      const usersResponse = await axios.get(`${API_URL}/user/all`);
      const loggedInUser = usersResponse.data.find(u => u.username === loginUsername);
      if (loggedInUser) {
        const userWithPassword = { ...loggedInUser, password: loginPassword };
        setCurrentUser(userWithPassword);
        setShowUserModal(false);
        setLoginUsername('');
        setLoginPassword('');
        notify(`Giriş başarılı: ${loginUsername}`);
        fetchTweets();
      } else {
        notify('Kullanıcı bulunamadı!', 'error');
      }
    } catch (error) {
      notify(`Giriş başarısız: ${parseError(error)}`, 'error');
    }
  };

  const handleCreateTweet = async () => {
    if (!newTweet.trim()) { notify('Lütfen tweet içeriği girin!', 'error'); return; }
    if (!currentUser) { notify('Önce giriş yapmalısınız!', 'error'); setShowUserModal(true); return; }
    try {
      await axiosInstance.post('/tweet', { content: newTweet });
      setNewTweet('');
      notify('Tweet başarıyla oluşturuldu!');
      fetchTweets();
    } catch (error) {
      notify(`Tweet oluşturulamadı: ${parseError(error)}`, 'error');
    }
  };

  const handleLike = async (tweetId) => {
    if (!currentUser) { notify('Önce giriş yapmalısınız!', 'error'); setShowUserModal(true); return; }
    try {
      await axiosInstance.post('/like', { tweetId });
      fetchTweets();
    } catch (err) {
      notify(`Like hatası: ${parseError(err)}`, 'error');
    }
  };

  const handleRetweet = async (tweetId) => {
    if (!currentUser) { notify('Önce giriş yapmalısınız!', 'error'); setShowUserModal(true); return; }
    try {
      await axiosInstance.post('/retweet', { tweetId });
      notify('Retweet başarılı!');
      fetchTweets();
    } catch (error) {
      notify(`Retweet başarısız: ${parseError(error)}`, 'error');
    }
  };

  const handleComment = async (tweetId) => {
    if (!currentUser) { notify('Önce giriş yapmalısınız!', 'error'); setShowUserModal(true); return; }
    const commentText = newComment[tweetId];
    if (!commentText?.trim()) { notify('Lütfen yorum içeriği girin!', 'error'); return; }
    try {
      await axiosInstance.post('/comment', { content: commentText, tweetId });
      setNewComment(prev => ({ ...prev, [tweetId]: '' }));
      notify('Yorum başarıyla eklendi!');
      fetchTweets();
    } catch (error) {
      notify(`Yorum eklenemedi: ${parseError(error)}`, 'error');
    }
  };

  // replaces window.confirm — shows inline confirmation UI
  const handleDeleteTweet = (tweetId) => {
    if (!currentUser) { notify('Önce giriş yapmalısınız!', 'error'); return; }
    setDeleteConfirm(tweetId);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/tweet/${deleteConfirm}`);
      notify('Tweet başarıyla silindi!');
      fetchTweets();
    } catch (error) {
      notify(`Tweet silinemedi: ${parseError(error)}`, 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser({ ...user, password: '123456' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowUserModal(true);
    setTweets([]);
  };

  const loadDemoData = async () => {
    const demoUsers = [
      { username: 'ahmet_yilmaz', email: 'ahmet@example.com', password: '123456' },
      { username: 'zeynep_kaya', email: 'zeynep@example.com', password: '123456' },
      { username: 'mehmet_demir', email: 'mehmet@example.com', password: '123456' },
    ];
    for (const userData of demoUsers) {
      try { await axios.post(`${API_URL}/auth/register`, userData); }
      catch { console.log('Kullanıcı zaten mevcut:', userData.username); }
    }
    await fetchUsers();
    setShowUserModal(false);
    notify('Demo veriler yüklendi!');
  };

  const handleTestLogin = () => {
    setLoginUsername('test');
    setLoginPassword('123456');
    setActiveTab('login');
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Yakın zamanda';
      return date.toLocaleDateString('tr-TR', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return 'Yakın zamanda'; }
  };

  return (
    <div className="App">

      {/* ── Toast notification (replaces all alert() calls) ── */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '8px', maxWidth: '380px',
          backgroundColor: notification.type === 'error' ? '#ffe6e6' : '#e6ffe6',
          border: `1px solid ${notification.type === 'error' ? '#e0245e' : '#1D9E75'}`,
          color: notification.type === 'error' ? '#e0245e' : '#0F6E56',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: '500',
        }}>
          {notification.type === 'error' ? '❌ ' : '✅ '}{notification.message}
        </div>
      )}

      {/* ── Delete confirmation dialog (replaces window.confirm) ── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            maxWidth: '360px', width: '90%', textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              Bu tweet'i silmek istediğinize emin misiniz?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={confirmDelete} style={{
                padding: '8px 24px', backgroundColor: '#e0245e',
                color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer',
              }}>Sil</button>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '8px 24px', backgroundColor: '#f7f9fa',
                border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer',
              }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── User modal ── */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>🐦 Twitter Clone</h2>
              <p className="api-status">{apiStatus}</p>
            </div>
            <div className="tabs">
              <button className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}>Kayıt Ol</button>
              <button className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}>Giriş Yap</button>
            </div>

            {activeTab === 'register' ? (
              <div className="register-form">
                <h3>Yeni Hesap Oluştur</h3>
                <div className="form-group">
                  <input type="text" placeholder="Kullanıcı Adı *"
                    value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email *"
                    value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <input type="password" placeholder="Şifre (min 6 karakter) *"
                    value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                </div>
                <button onClick={handleRegister} className="btn-primary">Kayıt Ol</button>
              </div>
            ) : (
              <div className="login-form">
                <h3>Hesabına Giriş Yap</h3>
                <div className="form-group">
                  <input type="text" placeholder="Kullanıcı Adı"
                    value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <input type="password" placeholder="Şifre"
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <button onClick={handleLogin} className="btn-primary">Giriş Yap</button>
              </div>
            )}

            <div className="modal-footer">
              <p className="demo-note">
                <strong>Test için:</strong> Kullanıcı Adı: test, Şifre: 123456
              </p>
              <div className="modal-buttons">
                <button onClick={handleTestLogin} className="btn-test">
                  🚀 Test Kullanıcısı ile Giriş Yap
                </button>
                <button onClick={loadDemoData} className="btn-secondary">
                  Demo Verileri Yükle (3 kullanıcı)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main app ── */}
      {!showUserModal && (
        <>
          <header className="header">
            <div className="header-left">
              <h1>🐦 Twitter Clone</h1>
              <span className="app-status">{apiStatus}</span>
            </div>
            <div className="header-right">
              {currentUser && (
                <div className="user-controls">
                  <div className="user-selector">
                    <span>Kullanıcı: </span>
                    <select value={currentUser.id || ''} onChange={handleUserChange}>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>@{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="user-info">
                    <span className="username">@{currentUser.username}</span>
                    <button onClick={handleLogout} className="btn-logout">Çıkış Yap</button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="main-container">
            <div className="sidebar">
              <div className="tweet-composer">
                <h3>Yeni Tweet</h3>
                <textarea
                  value={newTweet}
                  onChange={e => setNewTweet(e.target.value)}
                  placeholder={`Neler oluyor, ${currentUser?.username}?`}
                  maxLength="280" rows="4"
                />
                <div className="tweet-actions">
                  <span className="char-count">{newTweet.length}/280</span>
                  <button onClick={handleCreateTweet} disabled={!newTweet.trim()}
                    className="btn-tweet">Tweetle</button>
                </div>
              </div>

              {currentUser && (
                <div className="user-stats">
                  <h3>👤 @{currentUser.username}</h3>
                  <div className="stats-grid">
                    <div className="stat">
                      <span className="stat-number">
                        {tweets.filter(t => t.user?.id === currentUser.id).length}
                      </span>
                      <span className="stat-label">Tweet</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">
                        {tweets.reduce((sum, t) => sum + (t.likesCount || 0), 0)}
                      </span>
                      <span className="stat-label">Beğeni</span>
                    </div>
                  </div>
                  <button onClick={() => setShowUserModal(true)} className="btn-switch-user">
                    🔄 Kullanıcı Değiştir
                  </button>
                </div>
              )}
            </div>

            <div className="tweet-feed">
              <div className="feed-header">
                <h2>Son Tweetler</h2>
                <div className="feed-controls">
                  <button onClick={fetchTweets} className="btn-refresh">🔄 Yenile</button>
                  <span className="tweet-count">{tweets.length} tweet</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Yükleniyor...</p>
                </div>
              ) : tweets.length === 0 ? (
                <div className="empty-feed">
                  <p>Henüz tweet yok. İlk tweet'i sen oluştur!</p>
                </div>
              ) : (
                tweets.map(tweet => (
                  <div key={`${tweet.isRetweet ? 'rt' : 'tw'}-${tweet.id}-${tweet.retweetedBy || ''}`}
                    className="tweet-card"
                    style={{
                      borderLeft: tweet.isRetweet ? '3px solid #1da1f2' : '3px solid transparent',
                      backgroundColor: tweet.isRetweet ? '#f0f8ff' : 'white'
                    }}>

                    {/* ── Retweet banner — clearly shows who retweeted ── */}
                    {tweet.isRetweet && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        backgroundColor: '#e8f4fd',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontSize: '13px',
                        color: '#1da1f2',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '15px' }}>🔁</span>
                        <span>
                          <strong>@{tweet.retweetedBy}</strong>
                          <span style={{ fontWeight: '400', color: '#555' }}> adlı kullanıcı, </span>
                          <strong>@{tweet.user?.username}</strong>
                          <span style={{ fontWeight: '400', color: '#555' }}>'in tweetini retweetledi</span>
                        </span>
                      </div>
                    )}

                    <div className="tweet-header">
                      <div className="user-avatar" style={{
                        backgroundColor: tweet.isRetweet ? '#1da1f2' : '#1da1f2',
                        opacity: tweet.isRetweet ? 0.75 : 1
                      }}>
                        {tweet.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="tweet-meta">
                        <div className="user-info">
                          <strong className="username">
                            @{tweet.user?.username || 'Bilinmeyen'}
                          </strong>
                          {tweet.isRetweet && (
                            <span style={{
                              fontSize: '11px',
                              backgroundColor: '#e8f4fd',
                              color: '#1da1f2',
                              padding: '2px 7px',
                              borderRadius: '10px',
                              marginLeft: '8px',
                              fontWeight: '500'
                            }}>
                              Orijinal Tweet
                            </span>
                          )}
                          <span className="user-handle">{tweet.user?.email}</span>
                        </div>
                        <span className="tweet-date">{formatDate(tweet.creationDate)}</span>
                      </div>
                      {/* only show delete button on original tweets owned by current user */}
                      {!tweet.isRetweet && currentUser && tweet.user?.id === currentUser.id && (
                        <button onClick={() => handleDeleteTweet(tweet.id)}
                          className="btn-delete" title="Tweet'i Sil">×</button>
                      )}
                    </div>

                    <div className="tweet-content"><p>{tweet.content}</p></div>

                    <div className="tweet-stats">
                      <div className="stat"><span className="stat-icon">💬</span><span>{tweet.commentsCount || 0}</span></div>
                      <div className="stat"><span className="stat-icon">🔁</span><span>{tweet.retweetsCount || 0}</span></div>
                      <div className="stat"><span className="stat-icon">❤️</span><span>{tweet.likesCount || 0}</span></div>
                    </div>

                    <div className="tweet-actions">
                      <button
                        className={`action-btn ${tweet.likedByCurrentUser ? 'liked' : ''}`}
                        onClick={() => handleLike(tweet.id)}>
                        <span className="action-icon">{tweet.likedByCurrentUser ? '❤️' : '🤍'}</span>
                        <span>{tweet.likedByCurrentUser ? 'Beğenildi' : 'Beğen'}</span>
                      </button>

                      <button
                        className={`action-btn ${tweet.retweetedByCurrentUser ? 'retweeted' : ''}`}
                        onClick={() => handleRetweet(tweet.id)}>
                        <span className="action-icon">🔁</span>
                        <span>{tweet.retweetedByCurrentUser ? 'Retweetlendi' : 'Retweet'}</span>
                      </button>

                      <div className="comment-action">
                        <input type="text" placeholder="Yorum yaz..."
                          value={newComment[tweet.id] || ''}
                          onChange={e => setNewComment(prev => ({ ...prev, [tweet.id]: e.target.value }))}
                          onKeyPress={e => e.key === 'Enter' && handleComment(tweet.id)}
                        />
                        <button onClick={() => handleComment(tweet.id)}
                          disabled={!newComment[tweet.id]?.trim()}
                          className="btn-comment">💬 Yorum Yap</button>
                      </div>
                    </div>

                    {tweet.comments && tweet.comments.length > 0 && (
                      <div className="comments-section">
                        <h4>💬 Yorumlar ({tweet.comments.length})</h4>
                        {tweet.comments.map(comment => (
                          <div key={comment.id} className="comment">
                            <div className="comment-header">
                              <strong>@{comment.user?.username || 'Anonim'}</strong>
                              <span className="comment-date">{formatDate(comment.creationDate)}</span>
                            </div>
                            <p className="comment-content">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <footer className="footer">
            <div className="footer-content">
              <p>Twitter Clone - Tam Stack Proje (Spring Boot + React)</p>
              <p className="footer-links">
                <span>Kullanıcılar: {users.length}</span>
                <span>Tweetler: {tweets.length}</span>
                <span>Toplam Beğeni: {tweets.reduce((sum, t) => sum + (t.likesCount || 0), 0)}</span>
              </p>
              <p className="footer-note">
                <small>Oturum: {currentUser ? `@${currentUser.username}` : 'Açık değil'}</small>
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;