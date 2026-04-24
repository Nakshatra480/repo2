import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

export default function Dashboard() {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const { logout, user } = useContext(AuthContext);

  const fetchThreads = async () => {
    try {
      const res = await axios.get('/api/chat/threads', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.data.length > 0) {
        setThreads(res.data);
        if (!activeThreadId) {
          setActiveThreadId(res.data[0]._id);
        }
      } else {
        // Automatically create a new thread if none exist
        createNewThread(false);
      }
    } catch (error) {
      console.error('Failed to fetch threads', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  const createNewThread = async (updateList = true) => {
    try {
      const res = await axios.post('/api/chat/threads', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (updateList) {
        setThreads(prev => [res.data, ...prev]);
      } else {
        setThreads([res.data]);
      }
      setActiveThreadId(res.data._id);
    } catch (error) {
      console.error('Failed to create thread', error);
    }
  };

  const deleteThread = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/chat/threads/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const newThreads = threads.filter(t => t._id !== id);
      setThreads(newThreads);
      if (activeThreadId === id) {
        setActiveThreadId(newThreads.length > 0 ? newThreads[0]._id : null);
      }
    } catch (error) {
      console.error('Failed to delete thread', error);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        threads={threads} 
        activeThreadId={activeThreadId} 
        setActiveThreadId={setActiveThreadId} 
        createNewThread={createNewThread}
        deleteThread={deleteThread}
        logout={logout}
        user={user}
      />
      <ChatArea activeThreadId={activeThreadId} fetchThreads={fetchThreads} />
    </div>
  );
}
