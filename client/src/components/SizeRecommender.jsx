import React, { useState } from 'react';
import { Ruler, Sparkles, CheckCircle2 } from 'lucide-react';
import { getSizeRecommendation } from '../services/api';
import './SizeRecommender.css';

const SizeRecommender = ({ retailer, category }) => {
  const [status, setStatus] = useState('idle'); // idle, form, analyzing, done, error
  const [result, setResult] = useState(null);
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');
  const [gender, setGender] = useState('male');

  const handleRunAI = async () => {
    setStatus('analyzing');
    try {
      const data = await getSizeRecommendation({
        height: parseFloat(height) || 175,
        weight: parseFloat(weight) || 72,
        gender,
        retailer,
        category,
      });
      setResult(data);
      setStatus('done');
    } catch (err) {
      // Fallback if server is down
      setResult({
        recommendedSize: 'M',
        sizeLabel: 'Medium',
        confidence: 'Medium',
        retailerNote: `${retailer} sizing data based on general measurements.`,
        tip: 'Consider checking the retailer size chart for best results.',
      });
      setStatus('done');
    }
  };

  return (
    <div className="size-recommender glass-panel">
      <div className="size-header flex-between">
        <h3 className="flex-center gap-1">
          <Ruler size={18} className="text-secondary" /> Universal Size Chart
        </h3>
        <span className="retailer-badge text-sm">{retailer}</span>
      </div>
      
      <div className="size-content">
        {status === 'idle' && (
          <div className="size-idle text-center">
            <p className="text-secondary mb-4">
              Stop guessing. Let AI compute your exact {retailer} size based on your body measurements.
            </p>
            <button className="btn btn-secondary w-100" onClick={() => setStatus('form')}>
              <Sparkles size={16} /> Predict My Size
            </button>
          </div>
        )}

        {status === 'form' && (
          <div className="size-form">
            <div className="size-input-row">
              <div className="size-input-group">
                <label>Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" />
              </div>
              <div className="size-input-group">
                <label>Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="72" />
              </div>
            </div>
            <div className="size-input-group" style={{marginBottom: '1rem'}}>
              <label>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Non-binary</option>
              </select>
            </div>
            <button className="btn btn-primary w-100" onClick={handleRunAI}>
              <Sparkles size={16} /> Get My Size
            </button>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="size-analyzing text-center">
            <div className="scanning-bar"></div>
            <p className="text-gradient pulse-text mt-4">Cross-referencing {retailer} sizing models...</p>
          </div>
        )}

        {status === 'done' && result && (
          <div className="size-done text-center animate-enter">
            <CheckCircle2 size={40} className="success-icon mb-2 mx-auto" />
            <p className="text-secondary">Your recommended size at {retailer}</p>
            <div className="recommended-size">{result.recommendedSize}</div>
            <p className="text-sm text-muted">{result.sizeLabel}</p>
            <p className="text-sm mt-2" style={{color: 'var(--accent-cyan)'}}>
              Confidence: {result.confidence}
            </p>
            {result.retailerNote && (
              <p className="text-sm text-muted mt-2" style={{ fontStyle: 'italic' }}>{result.retailerNote}</p>
            )}
            {result.tip && (
              <p className="text-sm text-muted mt-1">{result.tip}</p>
            )}
            <button 
              className="btn btn-secondary mt-4 text-sm" 
              onClick={() => { setStatus('form'); setResult(null); }}
              style={{padding: '0.5rem 1rem'}}
            >
              Recalculate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeRecommender;
