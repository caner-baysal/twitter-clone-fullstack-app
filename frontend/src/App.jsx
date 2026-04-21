import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

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
  const [apiStatus, setApiStatus] = useState('Conection test...');
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const currentUserRef = useRef(currentUser);

  const API_URL = 'http://localhost:3000';

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

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const axiosInstance = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => {
      const user = currentUserRef.current;
      if (user) config.headers.Authorization = `Basic ${btoa(`${user.username}:${user.password}`)}`;
      return config;
    }, (error) => Promise.reject(error));
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          notify('Session timed out, please login.', 'error');
          setShowUserModal(true);
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, []);

  useEffect(() => { checkBackendConnection(); }, []);

  const checkBackendConnection = async () => {
    try {
      setApiStatus('Backend connection test...');
      await axios.get(`${API_URL}/test`);
      setApiStatus('✅ Backend connected');
      fetchUsers();
      fetchTweets();
    } catch {
      setApiStatus('❌ Backend connection failed');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/all`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error on fetching users:', error);
    }
  };

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tweet/all`);
      const user = currentUserRef.current;
      const formattedTweets = response.data.map(tweet => ({
        ...tweet,
        likesCount: tweet.likes?.length || 0,
        retweetsCount: tweet.retweets?.length || 0,
        commentsCount: tweet.comments?.length || 0,
        isRetweet: !!tweet.retweetedBy,
        retweetedBy: tweet.retweetedBy || null,
        likedByCurrentUser: user ? tweet.likes?.some(l => l.user?.id === user.id) || false : false,
        retweetedByCurrentUser: user ? tweet.retweets?.some(r => r.user?.id === user.id) || false : false,
      }));
      setTweets(formattedTweets);
    } catch (error) {
      console.error('Error on fetch tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      notify('Please fill in all the inputs!', 'error'); return;
    }
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: newUserName, email: newUserEmail, password: newUserPassword,
      });
      const newUser = { id: response.data.id, username: newUserName, email: newUserEmail, password: newUserPassword };
      setCurrentUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setShowUserModal(false);
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword('123456');
      notify(`Register succeed: ${newUser.username}`);
      fetchTweets();
    } catch (error) { notify(`Register failed: ${parseError(error)}`, 'error'); }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      notify('Please enter username and password!', 'error'); return;
    }
    try {
      await axios.post(`${API_URL}/auth/login`, { username: loginUsername, password: loginPassword });
      const usersResponse = await axios.get(`${API_URL}/user/all`);
      const loggedInUser = usersResponse.data.find(u => u.username === loginUsername);
      if (loggedInUser) {
        setCurrentUser({ ...loggedInUser, password: loginPassword });
        setShowUserModal(false);
        setLoginUsername(''); setLoginPassword('');
        notify(`Login succeed: ${loginUsername}`);
        fetchTweets();
      } else { notify('User not found!', 'error'); }
    } catch (error) { notify(`Login failed: ${parseError(error)}`, 'error'); }
  };

  const handleCreateTweet = async () => {
    if (!newTweet.trim()) { notify('Please enter tweet content!', 'error'); return; }
    if (!currentUser) { notify('You need to login first!', 'error'); setShowUserModal(true); return; }
    try {
      await axiosInstance.post('/tweet', { content: newTweet });
      setNewTweet('');
      notify('Tweet sumbitted!');
      fetchTweets();
    } catch (error) { notify(`Tweet could not be submitted: ${parseError(error)}`, 'error'); }
  };

  const handleLike = async (tweetId) => {
    if (!currentUser) { notify('You need to login first!', 'error'); setShowUserModal(true); return; }
    try { await axiosInstance.post('/like', { tweetId }); fetchTweets(); }
    catch (err) { notify(`Like error: ${parseError(err)}`, 'error'); }
  };

  const handleRetweet = async (tweetId) => {
    if (!currentUser) { notify('You need to login first!', 'error'); setShowUserModal(true); return; }
    try { await axiosInstance.post('/retweet', { tweetId }); notify('Retweet succeed!'); fetchTweets(); }
    catch (error) { notify(`Retweet failed: ${parseError(error)}`, 'error'); }
  };

  const handleComment = async (tweetId) => {
    if (!currentUser) { notify('You need to login first!', 'error'); setShowUserModal(true); return; }
    const commentText = newComment[tweetId];
    if (!commentText?.trim()) { notify('Please enter comment content!', 'error'); return; }
    try {
      await axiosInstance.post('/comment', { content: commentText, tweetId });
      setNewComment(prev => ({ ...prev, [tweetId]: '' }));
      notify('Comment submitted!');
      fetchTweets();
    } catch (error) { notify(`Comment could not be submitted: ${parseError(error)}`, 'error'); }
  };

  const handleDeleteTweet = (tweetId) => {
    if (!currentUser) { notify('You need to login first!', 'error'); return; }
    setDeleteConfirm(tweetId);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/tweet/${deleteConfirm}`);
      notify('Tweet deleted!');
      fetchTweets();
    } catch (error) { notify(`Tweet could not be deleted: ${parseError(error)}`, 'error'); }
    finally { setDeleteConfirm(null); }
  };

  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser({ ...user, password: '123456' });
  };

  const handleLogout = () => { setCurrentUser(null); setShowUserModal(true); setTweets([]); };

  const loadDemoData = async () => {
    const demoUsers = [
      { username: 'jeff_loomis', email: 'jeffloomis@example.com', password: '123456' },
      { username: 'jane_logan', email: 'janelogan@example.com', password: '123456' },
      { username: 'damon_jordison', email: 'demonjordison@example.com', password: '123456' },
    ];
    for (const u of demoUsers) {
      try { await axios.post(`${API_URL}/auth/register`, u); }
      catch { console.log('User already exists:', u.username); }
    }
    await fetchUsers();
    setShowUserModal(false);
    notify('Demo data loaded!');
  };

  const handleTestLogin = () => { setLoginUsername('test'); setLoginPassword('123456'); setActiveTab('login'); };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Soon';
      return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Soon'; }
  };

  const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500'];
  const getAvatarColor = (username) => avatarColors[(username?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex flex-col">

      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm text-sm font-semibold transition-all duration-300 ${
          notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <span className="text-lg">{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Tweet</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure that you want to delete this tweet? You can not take it back</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🐦</div>
              <h2 className="text-2xl font-black text-gray-900">Twitter Clone</h2>
              <span className="inline-block mt-2 text-xs font-medium px-3 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-200">
                {apiStatus}
              </span>
            </div>

            <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
              {['register', 'login'].map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === 'register' ? 'Register' : 'Login'}
                </button>
              ))}
            </div>

            {activeTab === 'register' && (
              <div className="space-y-4">
                <h3 className="text-center font-bold text-gray-700 mb-4">Create New Account</h3>
                {[
                  { placeholder: 'Username *', value: newUserName, onChange: e => setNewUserName(e.target.value), type: 'text' },
                  { placeholder: 'Email *', value: newUserEmail, onChange: e => setNewUserEmail(e.target.value), type: 'email' },
                  { placeholder: 'Password (min 6 characters) *', value: newUserPassword, onChange: e => setNewUserPassword(e.target.value), type: 'password' },
                ].map(({ placeholder, value, onChange, type }) => (
                  <input key={placeholder} type={type} placeholder={placeholder} value={value} onChange={onChange}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 focus:bg-white text-sm transition-all placeholder-gray-400" />
                ))}
                <button onClick={handleRegister}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200 mt-2">
                  Register
                </button>
              </div>
            )}

            {activeTab === 'login' && (
              <div className="space-y-4">
                <h3 className="text-center font-bold text-gray-700 mb-4">Login To Your Account</h3>
                <input type="text" placeholder="Username" value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 focus:bg-white text-sm transition-all placeholder-gray-400" />
                <input type="password" placeholder="Password" value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 focus:bg-white text-sm transition-all placeholder-gray-400" />
                <button onClick={handleLogin}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200 mt-2">
                  Login
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <p className="text-center text-xs text-gray-400">
                For Test: <span className="font-semibold text-sky-600">test</span> / <span className="font-semibold text-sky-600">123456</span>
              </p>
              <button onClick={handleTestLogin}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl text-sm hover:opacity-90 transition-opacity">
                🚀 Login With Test User
              </button>
              <button onClick={loadDemoData}
                className="w-full py-3 border-2 border-sky-300 text-sky-600 font-semibold rounded-2xl text-sm hover:bg-sky-50 transition-colors">
                Load Demo Data (3 users)
              </button>
            </div>
          </div>
        </div>
      )}

      {!showUserModal && (
        <>
          <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-white/50 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black text-sky-500 tracking-tight">🐦 Twitter Clone</h1>
                <span className="hidden sm:inline text-xs font-medium px-3 py-1 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                  {apiStatus}
                </span>
              </div>
              {currentUser && (
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <select value={currentUser.id || ''} onChange={handleUserChange}
                    className="text-sm px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 font-medium cursor-pointer">
                    {users.map(u => <option key={u.id} value={u.id}>@{u.username}</option>)}
                  </select>
                  <span className="text-sm font-bold text-gray-700 px-3 py-2 bg-gray-100 rounded-xl">
                    @{currentUser.username}
                  </span>
                  <button onClick={handleLogout}
                    className="text-sm px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex gap-6 items-start">

            <aside className="w-80 flex-shrink-0 space-y-5 sticky top-24">

              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/10 border border-white/80">
                <h3 className="font-bold text-gray-800 mb-4 text-base">✏️ New Tweet</h3>
                <textarea
                  value={newTweet}
                  onChange={e => setNewTweet(e.target.value)}
                  placeholder={`What's happening?, ${currentUser?.username}?`}
                  maxLength={280} rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 focus:bg-white resize-none text-sm transition-all placeholder-gray-400 leading-relaxed"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs font-medium ${newTweet.length > 250 ? 'text-red-500' : 'text-gray-400'}`}>
                    {newTweet.length}/280
                  </span>
                  <button onClick={handleCreateTweet} disabled={!newTweet.trim()}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-200">
                    Tweet
                  </button>
                </div>
              </div>

              {currentUser && (
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/10 border border-white/80">
                  <div className={`w-12 h-12 ${getAvatarColor(currentUser.username)} rounded-2xl flex items-center justify-center text-white font-black text-xl mb-3`}>
                    {currentUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-black text-gray-800 text-base">@{currentUser.username}</h3>
                  <p className="text-xs text-gray-400 mb-4">{currentUser.email}</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-sky-50 rounded-2xl p-3 text-center border border-sky-100">
                      <div className="text-2xl font-black text-sky-600">
                        {tweets.filter(t => t.user?.id === currentUser.id && !t.isRetweet).length}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">Tweet</div>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-3 text-center border border-pink-100">
                      <div className="text-2xl font-black text-pink-600">
                        {tweets.reduce((s, t) => s + (t.likesCount || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">Likes</div>
                    </div>
                  </div>
                  <button onClick={() => setShowUserModal(true)}
                    className="w-full py-2.5 border-2 border-sky-300 text-sky-600 font-semibold rounded-2xl text-sm hover:bg-sky-50 transition-colors">
                    🔄 Change User
                  </button>
                </div>
              )}
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-white drop-shadow">Recent Tweets</h2>
                <div className="flex items-center gap-3">
                  <button onClick={fetchTweets}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold rounded-2xl text-sm border border-white/30 transition-all">
                    🔄 Refresh
                  </button>
                  <span className="px-3 py-2 bg-white/20 backdrop-blur text-white text-sm font-bold rounded-2xl border border-white/30">
                    {tweets.length} tweet
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-white/80 font-medium">Loading...</p>
                </div>
              ) : tweets.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-xl">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-gray-400 font-semibold">No Tweets Yet, Post The First One!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tweets.map(tweet => (
                    <div
                      key={`${tweet.isRetweet ? 'rt' : 'tw'}-${tweet.id}-${tweet.retweetedBy || ''}`}
                      className={`bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/10 border transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${
                        tweet.isRetweet ? 'border-l-4 border-l-sky-400 border-t border-r border-b border-sky-100' : 'border-white/80'
                      }`}
                    >
                      {tweet.isRetweet && (
                        <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-2xl px-3 py-2 mb-4">
                          <span className="text-sky-500 font-bold text-sm">🔁</span>
                          <p className="text-xs text-gray-600">
                            <span className="font-bold text-sky-600">@{tweet.retweetedBy}</span>
                            <span className="text-gray-500"> retweeted </span>
                            <span className="font-bold text-gray-700">@{tweet.user?.username}</span>
                            <span className="text-gray-500">'s tweet</span>
                          </p>
                        </div>
                      )}


                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-11 h-11 ${getAvatarColor(tweet.user?.username)} rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${tweet.isRetweet ? 'opacity-80' : ''}`}>
                          {tweet.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-900 text-sm">@{tweet.user?.username || 'Bilinmeyen'}</span>
                            {tweet.isRetweet && (
                              <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-600 rounded-full font-semibold border border-sky-200">
                                Original
                              </span>
                            )}
                            <span className="text-gray-400 text-xs">{tweet.user?.email}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(tweet.creationDate)}</p>
                        </div>
                        {!tweet.isRetweet && currentUser && tweet.user?.id === currentUser.id && (
                          <button onClick={() => handleDeleteTweet(tweet.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-lg font-bold flex-shrink-0">
                            ×
                          </button>
                        )}
                      </div>

                      <p className="text-gray-800 text-sm leading-relaxed mb-4 font-medium">{tweet.content}</p>

                      <div className="flex gap-5 mb-4 pb-4 border-b border-gray-100">
                        {[
                          { icon: '💬', count: tweet.commentsCount || 0 },
                          { icon: '🔁', count: tweet.retweetsCount || 0 },
                          { icon: '❤️', count: tweet.likesCount || 0 },
                        ].map(({ icon, count }) => (
                          <div key={icon} className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold">
                            <span>{icon}</span><span>{count}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-wrap mb-3">
                        <button onClick={() => handleLike(tweet.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border transition-all hover:-translate-y-0.5 ${
                            tweet.likedByCurrentUser
                              ? 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200'
                          }`}>
                          <span>{tweet.likedByCurrentUser ? '❤️' : '🤍'}</span>
                          <span>{tweet.likedByCurrentUser ? 'Liked' : 'Like'}</span>
                        </button>

                        <button onClick={() => handleRetweet(tweet.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border transition-all hover:-translate-y-0.5 ${
                            tweet.retweetedByCurrentUser
                              ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-500 hover:border-green-200'
                          }`}>
                          <span>🔁</span>
                          <span>{tweet.retweetedByCurrentUser ? 'Retweeted' : 'Retweet'}</span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input type="text" placeholder="Comment..."
                          value={newComment[tweet.id] || ''}
                          onChange={e => setNewComment(prev => ({ ...prev, [tweet.id]: e.target.value }))}
                          onKeyPress={e => e.key === 'Enter' && handleComment(tweet.id)}
                          className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-200 focus:border-sky-400 focus:outline-none bg-gray-50 focus:bg-white text-xs transition-all placeholder-gray-400" />
                        <button onClick={() => handleComment(tweet.id)}
                          disabled={!newComment[tweet.id]?.trim()}
                          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-xs transition-all whitespace-nowrap">
                          💬 Comment
                        </button>
                      </div>

                      {tweet.comments && tweet.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            💬 Comments ({tweet.comments.length})
                          </h4>
                          {tweet.comments.map(comment => (
                            <div key={comment.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-700">@{comment.user?.username || 'Anonim'}</span>
                                <span className="text-xs text-gray-400">{formatDate(comment.creationDate)}</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="bg-white/10 backdrop-blur border-t border-white/20 py-5 mt-4">
            <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-white/70 text-sm font-medium">Twitter Clone — Spring Boot + React</p>
              <div className="flex gap-3">
                {[
                  { label: `👥 ${users.length} kullanıcı` },
                  { label: `🐦 ${tweets.length} tweet` },
                  { label: `❤️ ${tweets.reduce((s, t) => s + (t.likesCount || 0), 0)} beğeni` },
                ].map(({ label }) => (
                  <span key={label} className="text-xs font-semibold px-3 py-1.5 bg-white/20 text-white rounded-full border border-white/20">
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-white/50 text-xs">
                {currentUser ? `@${currentUser.username} oturumu açık` : 'Oturum kapalı'}
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
