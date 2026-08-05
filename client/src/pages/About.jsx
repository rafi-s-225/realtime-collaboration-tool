import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Radio, 
  FileText, 
  Palette, 
  Cpu, 
  ArrowRight,
  Database
} from 'lucide-react'
import './About.css'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="about-container animate-fade-in">
      <div className="about-hero glass-panel">
        <div className="about-badge">
          <Cpu size={14} />
          <span>System Architecture & Features</span>
        </div>

        <h1>SyncCraft Realtime Collaboration Engine</h1>
        <p className="about-subtitle">
          Built for high-speed, sub-millisecond multiplayer collaboration over WebSockets. 
          Engineered with modern React 19, Socket.IO bidirectional channels, and HTML5 Canvas drawing pipelines.
        </p>

        <div className="about-cta">
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            <span>Explore Dashboard Workspaces</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stack Grid */}
      <section className="stack-section">
        <h2 className="section-title text-center">Core Technology Stack</h2>

        <div className="stack-grid">
          <div className="stack-card glass-card">
            <div className="stack-icon react">
              <Zap size={24} />
            </div>
            <h3>React 19 & Vite 8</h3>
            <p>Fast component rendering, reactive state streams, and modern hooks structure for fluid UI updates.</p>
          </div>

          <div className="stack-card glass-card">
            <div className="stack-icon socket">
              <Radio size={24} />
            </div>
            <h3>Socket.IO Engine</h3>
            <p>Bidirectional WebSocket event communication handling document edits, canvas stroke streams, and cursor sync.</p>
          </div>

          <div className="stack-card glass-card">
            <div className="stack-icon canvas">
              <Palette size={24} />
            </div>
            <h3>HTML5 Vector Canvas</h3>
            <p>Custom 2D rendering pipeline supporting freehand pencil, geometric shapes, customizable line weights, and undo history.</p>
          </div>

          <div className="stack-card glass-card">
            <div className="stack-icon db">
              <Database size={24} />
            </div>
            <h3>Express & MongoDB Store</h3>
            <p>Robust backend API supporting MongoDB object persistence with instant in-memory fallback for offline/isolated usage.</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase List */}
      <section className="about-features glass-panel">
        <h2>Key Capabilities & Highlights</h2>
        <div className="highlights-list">
          <div className="highlight-item">
            <div className="highlight-bullet"><ShieldCheck size={16} /></div>
            <div>
              <h4>Sub-Millisecond Synchronization</h4>
              <p>Text edits and drawing strokes are broadcasted instantly to every connected peer in the room.</p>
            </div>
          </div>

          <div className="highlight-item">
            <div className="highlight-bullet"><Sparkles size={16} /></div>
            <div>
              <h4>Multi-User Live Cursor Tracking</h4>
              <p>Watch co-workers' live mouse positions move across the whiteboard canvas in real-time.</p>
            </div>
          </div>

          <div className="highlight-item">
            <div className="highlight-bullet"><FileText size={16} /></div>
            <div>
              <h4>Integrated Markdown & Drawing Studios</h4>
              <p>Switch between technical specs documentation and vector whiteboard sketches in one unified platform.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
