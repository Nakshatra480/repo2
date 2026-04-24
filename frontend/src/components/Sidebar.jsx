import React from 'react';
import { MessageSquare, Plus, Trash2, LogOut, User } from 'lucide-react';

export default function Sidebar({ threads, activeThreadId, setActiveThreadId, createNewThread, deleteThread, logout, user }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={createNewThread}>
          <Plus size={18} /> New Conversation
        </button>
      </div>
      
      <div className="thread-list">
        {threads.map(thread => (
          <div 
            key={thread._id} 
            className={`thread-item ${activeThreadId === thread._id ? 'active' : ''}`}
            onClick={() => setActiveThreadId(thread._id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <MessageSquare size={16} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {thread.title}
              </span>
            </div>
            <button className="delete-btn" onClick={(e) => deleteThread(thread._id, e)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <User size={18} />
          <span style={{ fontSize: '14px' }}>{user?.name || 'User'}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
