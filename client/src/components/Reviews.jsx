import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchReviews as fetchReviewsAPI, submitReview as submitReviewAPI, likeReview as likeReviewAPI } from '../services/api';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import './Reviews.css';

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const { user } = useContext(AuthContext);

  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    if (!productId) return;
    try {
      const data = await fetchReviewsAPI(productId);
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      // Silently handle — reviews are optional
      console.debug('Reviews not available:', err.message);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) return alert('Please login to like reviews');
    try {
      await likeReviewAPI(reviewId);
      loadReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please login to submit reviews');
    try {
      await submitReviewAPI(productId, newReview.rating, newReview.title, newReview.comment);
      setNewReview({ rating: 5, title: '', comment: '' });
      loadReviews();
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review: ' + err.message);
    }
  };

  const filteredReviews = reviews.filter(r => activeTab === 'All' || r.platform === activeTab);
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'liked') return b.likes - a.likes;
    if (sortBy === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="reviews-section mt-12">
      <h2>Cross-Platform Reviews</h2>
      
      <div className="reviews-controls">
        <div className="reviews-tabs">
          {['All', 'Amazon', 'Flipkart', 'ShopSync'].map(tab => (
            <button 
              key={tab} 
              className={`review-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="reviews-sort">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="liked">Most Liked</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {sortedReviews.length === 0 ? (
          <p className="no-reviews">No reviews for {activeTab} yet. Be the first to review!</p>
        ) : (
          sortedReviews.map(r => (
            <div key={r._id} className="review-card">
              <div className="review-header">
                <div className="review-user">
                  {r.user?.profilePic ? (
                    <img src={r.user.profilePic} alt="avatar" />
                  ) : (
                    <div className="avatar-placeholder">{r.userName?.charAt(0) || 'U'}</div>
                  )}
                  <div>
                    <strong>{r.userName}</strong>
                    <span className={`platform-badge ${r.platform.toLowerCase()}`}>{r.platform}</span>
                  </div>
                </div>
                <div className="review-rating text-gradient">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              {r.title && <h4 className="review-title">{r.title}</h4>}
              <p className="review-text">{r.comment}</p>
              <div className="review-actions">
                <button onClick={() => handleLike(r._id)}><ThumbsUp size={14}/> {r.likes}</button>
                <button><MessageCircle size={14}/> {r.replies?.length || 0} Replies</button>
              </div>
            </div>
          ))
        )}
      </div>

      {user && (
        <div className="write-review glass-panel">
          <h3>Write a ShopSync Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group row">
              <label>Rating:</label>
              <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}>
                {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Stars</option>)}
              </select>
            </div>
            <div className="form-group">
              <input type="text" placeholder="Review Title" value={newReview.title} onChange={e => setNewReview({...newReview, title: e.target.value})} required/>
            </div>
            <div className="form-group">
              <textarea rows="4" placeholder="Share your experience..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} required></textarea>
            </div>
            <button className="btn btn-primary" type="submit">Submit Review</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Reviews;
