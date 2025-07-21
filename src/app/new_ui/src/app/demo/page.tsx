'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// --- INTERFACES ---
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FarmerData {
  name?: string;
  aadhaar_number?: string;
  phone_number?: string;
  state?: string;
  district?: string;
  village?: string;
  land_size_acres?: number;
  bank_account_number?: string;
  ifsc_code?: string;
  family_members?: Array<{
    name: string;
    relation: string;
    age: number;
    gender: string;
  }>;
  exclusion_data?: Record<string, boolean>;
  special_provisions?: {
    region_special: string;
    has_special_certificate: boolean;
    certificate_type: string;
    special_provision_applies: boolean;
  };
  pm_kisan?: {
    special_provisions?: {
      region_special: string;
      has_special_certificate: boolean;
      certificate_type: string;
      special_provision_applies: boolean;
    };
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// --- COMPONENT ---
export default function DemoPage() {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [efrResponse, setEfrResponse] = useState<ApiResponse | null>(null);
  const [eligibilityResponse, setEligibilityResponse] = useState<ApiResponse | null>(null);
  const [isEfrLoading, setIsEfrLoading] = useState(false);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);
  const [copied, setCopied] = useState(''); // For copy-to-clipboard feedback
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- HOOKS & HELPERS ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation on component mount
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '', action: 'initialize' }),
        });
        if (response.ok) {
          const data = await response.json();
          setMessages([{
            id: '1', type: 'assistant',
            content: data.response || 'Welcome! How can I help you?',
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setMessages([{
          id: '1', type: 'assistant',
          content: 'Welcome! How can I help you?',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000); // Reset feedback after 2s
    }
  };
  
  // --- API HANDLERS ---
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue, action: 'chat' }),
      });
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        if (data.farmerData) {
          setFarmerData(data.farmerData);
        }
        if (data.stage === 'completed' && data.farmerData) {
          setFarmerData(data.farmerData);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const uploadToEfr = async () => {
    if (!farmerData) return;
    setIsEfrLoading(true);
    setEfrResponse(null);
    try {
      const response = await fetch('/api/efr-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData),
      });
      const result = await response.json();
      setEfrResponse(result);
    } catch (error) {
      console.error('Failed to upload to EFR:', error);
      setEfrResponse({ success: false, message: 'Failed to upload to EFR server' });
    } finally {
      setIsEfrLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!farmerData) return;
    setIsEligibilityLoading(true);
    setEligibilityResponse(null);
    try {
      const response = await fetch('/api/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData),
      });
      const result = await response.json();
      setEligibilityResponse(result);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      setEligibilityResponse({ success: false, message: 'Failed to check eligibility' });
    } finally {
      setIsEligibilityLoading(false);
    }
  };

  // --- cURL COMMAND GENERATORS ---
  const generateCurlCommand = () => {
    if (!farmerData) return '';
    const data = JSON.stringify(farmerData, null, 2);
    return `curl -X POST http://localhost:8001/farmers \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: supersecretkey" \\\n  -d '${data}'`;
  };

  const generateEligibilityCurl = () => {
    if (!farmerData || !efrResponse?.data?.farmer_id) return '';
    return `curl -X POST http://localhost:8002/eligibility/pm-kisan/${efrResponse.data.farmer_id} \\\n  -H "Content-Type: application/json"`;
  };

  // --- RENDER ---
  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-blue-50 p-4`}>
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏛️ PM-KISAN Demo Dashboard</h1>
          <p className="text-gray-600">Conversational data collection and API testing interface</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Section 1: Conversation Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">💬 Conversation Interface</h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >Send</button>
            </div>
          </div>

          {/* Section 2: Data Display */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">📊 Collected Data</h2>
            <div className="flex-1 overflow-y-auto">
              {farmerData ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h3 className="font-semibold text-green-800 mb-2">✅ Data Collected Successfully</h3>
                    <pre className="text-xs text-green-700 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(farmerData, null, 2)}</pre>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Quick Stats:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded"><span className="font-medium">Name:</span> {farmerData.name || 'N/A'}</div>
                      <div className="bg-gray-50 p-2 rounded"><span className="font-medium">State:</span> {farmerData.state || 'N/A'}</div>
                      <div className="bg-gray-50 p-2 rounded"><span className="font-medium">Land:</span> {farmerData.land_size_acres ? `${farmerData.land_size_acres} acres` : 'N/A'}</div>
                      <div className="bg-gray-50 p-2 rounded"><span className="font-medium">Family:</span> {farmerData.family_members ? `${farmerData.family_members.length} members` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-10">
                  <p>Data will appear here once collected through conversation.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: API Interaction */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col space-y-4">
            {/* EFR API Section */}
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">🚀 EFR API Interaction</h2>
              <button onClick={uploadToEfr} disabled={!farmerData || isEfrLoading} className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isEfrLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Upload to EFR
              </button>
              {farmerData && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">cURL Command (EFR):</label>
                  <div className="relative mt-1">
                    <pre className="text-xs bg-gray-800 text-white p-3 rounded-lg overflow-x-auto"><code>{generateCurlCommand()}</code></pre>
                    <button onClick={() => copyToClipboard(generateCurlCommand(), 'efr')} className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 text-xs rounded hover:bg-gray-500">{copied === 'efr' ? 'Copied!' : 'Copy'}</button>
                  </div>
                </div>
              )}
              {efrResponse && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">EFR API Response:</label>
                  <div className={`mt-1 p-3 rounded-lg text-xs ${efrResponse.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(efrResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <hr/>

            {/* Eligibility Check API Section */}
            <div className="flex-1 overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">🔍 Eligibility Check API</h2>
              <button onClick={checkEligibility} disabled={!efrResponse?.success || isEligibilityLoading} className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isEligibilityLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Check PM-KISAN Eligibility
              </button>
              {efrResponse?.data?.farmer_id && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">cURL Command (Eligibility):</label>
                  <div className="relative mt-1">
                    <pre className="text-xs bg-gray-800 text-white p-3 rounded-lg overflow-x-auto"><code>{generateEligibilityCurl()}</code></pre>
                    <button onClick={() => copyToClipboard(generateEligibilityCurl(), 'eligibility')} className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 text-xs rounded hover:bg-gray-500">{copied === 'eligibility' ? 'Copied!' : 'Copy'}</button>
                  </div>
                </div>
              )}
              {eligibilityResponse && (
                 <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Eligibility API Response:</label>
                  <div className={`mt-1 p-3 rounded-lg text-xs ${eligibilityResponse.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(eligibilityResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}