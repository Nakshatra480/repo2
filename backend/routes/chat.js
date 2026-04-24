const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are a calm, supportive, and practical mental health and well-being assistant. Your goal is to help users who feel depressed, confused, or mentally stuck. Help them gain clarity, stay motivated, and make rational decisions. Avoid generic or unrealistic positive advice. Instead, help them break down their problems, think clearly, and take small constructive steps. Acknowledge their feelings, but guide them towards practical solutions. Always maintain a professional, empathetic tone. Keep responses relatively concise but thorough enough to be helpful.`;

// Get all threads for a user
router.get('/threads', protect, async (req, res) => {
  try {
    const threads = await Thread.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new thread
router.post('/threads', protect, async (req, res) => {
  try {
    const thread = await Thread.create({ userId: req.user._id });
    res.status(201).json(thread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a specific thread
router.get('/threads/:id', protect, async (req, res) => {
  try {
    const thread = await Thread.findOne({ _id: req.params.id, userId: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    
    const messages = await Message.find({ threadId: thread._id }).sort({ createdAt: 1 });
    res.json({ thread, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a thread
router.delete('/threads/:id', protect, async (req, res) => {
  try {
    const thread = await Thread.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    
    await Message.deleteMany({ threadId: thread._id });
    res.json({ message: 'Thread removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message in a thread
router.post('/threads/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const threadId = req.params.id;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    let thread = await Thread.findOne({ _id: threadId, userId: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    // Update title on first message if it's default
    if (thread.title === 'New Conversation') {
      thread.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      await thread.save();
    }

    // Save user message
    const userMessage = await Message.create({ threadId, role: 'user', content });

    // Fetch previous messages for context
    const previousMessages = await Message.find({ threadId }).sort({ createdAt: 1 });
    
    // Format for Gemini API
    const history = previousMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini
    const chat = ai.chats.create({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    // We can't set history directly on create in some versions, or we just pass it manually
    // Let's use the simplest approach, generateContent with history.
    
    const contents = [];
    if (SYSTEM_INSTRUCTION) {
        // Just rely on config for system instruction
    }
    
    for (const msg of previousMessages.slice(0, -1)) {
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{text: msg.content}]
        });
    }
    contents.push({ role: 'user', parts: [{text: content}] });

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: contents,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION
        }
    });

    const assistantText = response.text;

    const assistantMessage = await Message.create({ threadId, role: 'assistant', content: assistantText });

    // Touch thread to update updatedAt
    thread.updatedAt = Date.now();
    await thread.save();

    res.json({ userMessage, assistantMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
