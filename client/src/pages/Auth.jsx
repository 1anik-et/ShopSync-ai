import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, requestOtp as requestOtpAPI, verifyOtp as verifyOtpAPI } from '../services/api';
import { Sparkles, Mail, Lock, User, Phone, KeyRound, ArrowRight } from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const [mode, setMode] = useState('login'); // login, register, phone, otp
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [skinColor, setSkinColor] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await loginUser(email, password);
        login(data);
        navigate('/');
      } else {
        const data = await registerUser(email, password, name, age, height, weight, skinColor, gender);
        login(data);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtpAPI(phone);
      setMode('otp');
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtpAPI(phone, otp);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const mockGoogleLogin = () => {
    login({ token: 'mock_google_token', user: { id: 'g1', email: 'user@google.com', name: 'Google User' } });
    navigate('/');
  };

  const titles = {
    login: 'Welcome Back',
    register: 'Create Account',
    phone: 'Phone Login',
    otp: 'Verify OTP',
  };

  const subtitles = {
    login: 'Sign in to your ShopSync account',
    register: 'Join ShopSync for smarter shopping',
    phone: 'We\'ll send you a one-time password',
    otp: 'Enter the code sent to your phone',
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header-section">
          <div className="auth-logo">
            <Sparkles size={28} />
          </div>
          <h2>{titles[mode]}</h2>
          <p className="auth-subtitle">{subtitles[mode]}</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}

        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={submitEmailAuth}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label><User size={14} /> Name</label>
                  <input type="text" placeholder="Your full name" value={name} onChange={r => setName(r.target.value)} required />
                </div>
                <div className="form-row" style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group">
                    <label>Age (Optional)</label>
                    <input type="number" placeholder="25" value={age} onChange={r => setAge(r.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Gender (Optional)</label>
                    <select value={gender} onChange={r => setGender(r.target.value)} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff'}}>
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group">
                    <label>Height (cm) (Opt)</label>
                    <input type="number" placeholder="175" value={height} onChange={r => setHeight(r.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg) (Opt)</label>
                    <input type="number" placeholder="70" value={weight} onChange={r => setWeight(r.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Skin Tone (Optional)</label>
                  <select value={skinColor} onChange={r => setSkinColor(r.target.value)} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff'}}>
                      <option value="" disabled>Select</option>
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Olive">Olive</option>
                      <option value="Brown">Brown</option>
                      <option value="Dark">Dark</option>
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label><Mail size={14} /> Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={r => setEmail(r.target.value)} required />
            </div>
            <div className="form-group">
              <label><Lock size={14} /> Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={r => setPassword(r.target.value)} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {mode === 'phone' && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label><Phone size={14} /> Phone Number</label>
              <input type="tel" placeholder="+91 9876543210" value={phone} onChange={r => setPhone(r.target.value)} required />
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Get OTP'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label><KeyRound size={14} /> One-Time Password</label>
              <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={r => setOtp(r.target.value)} maxLength={6} required />
              <span className="form-hint">Check your terminal/console for the test OTP</span>
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        <div className="auth-divider"><span>OR</span></div>
        <button className="google-btn" onClick={mockGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="auth-footer">
           {mode === 'login' && <p>New here? <span onClick={() => setMode('register')}>Create Account</span> | Use <span onClick={() => setMode('phone')}>Phone Number</span></p>}
           {mode === 'register' && <p>Already have an account? <span onClick={() => setMode('login')}>Sign In</span></p>}
           {(mode === 'phone' || mode === 'otp') && <p>Use <span onClick={() => setMode('login')}>Email</span> instead</p>}
        </div>
      </div>
    </div>
  );
};

export default Auth;
