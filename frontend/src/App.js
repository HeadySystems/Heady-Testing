// HEADY_BRAND:BEGIN
// HEADY SYSTEMS :: SACRED GEOMETRY
// FILE: frontend/src/App.js
// LAYER: ui/frontend
// 
//         _   _  _____    _    ____   __   __
//        | | | || ____|  / \  |  _ \ \ \ / /
//        | |_| ||  _|   / _ \ | | | | \ V / 
//        |  _  || |___ / ___ \| |_| |  | |  
//        |_| |_||_____/_/   \_\____/   |_|  
// 
//    Sacred Geometry :: Organic Systems :: Breathing Interfaces
// HEADY_BRAND:END

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import CascadePanel from './components/CascadePanel';
import TerminalComponent from './components/Terminal';
import SettingsModal from './components/SettingsModal';
import { getToken } from './utils/auth';

function App() {
  const [currentFile, setCurrentFile] = useState(null); // { path, content }
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('plaintext');

  const token = getToken();

  const handleFileSelect = async (path) => {
    try {
      const res = await axios.get(`/api/files/${path}`, {
         headers: { 'X-Admin-Token': token }
      });
      setCurrentFile({ path, content: res.data.content });

      // Guess language
      const ext = path.split('.').pop();
      const langMap = {
        'js': 'javascript', 'py': 'python', 'json': 'json', 'html': 'html', 'css': 'css', 'md': 'markdown'
      };
      setLanguage(langMap[ext] || 'plaintext');
    } catch (err) {
      console.error("Failed to load file", err);
    }
  };

  const handleCodeChange = (value) => {
    if (currentFile) {
        setCurrentFile({ ...currentFile, content: value });
    }
  };

  const handleSave = async () => {
    if (!currentFile) return;
    try {
        await axios.post('/api/files', {
            path: currentFile.path,
            content: currentFile.content
        }, { headers: { 'X-Admin-Token': token } });
        console.log("Saved");
        // Could show a toast notification here
    } catch (err) {
        console.error("Failed to save", err);
    }
  };

  return (
    <div className="App">
      <Layout
        sidebar={<FileTree onFileSelect={handleFileSelect} />}
        editor={
            currentFile ? (
                <CodeEditor
                    code={currentFile.content}
                    language={language}
                    onChange={handleCodeChange}
                    onSave={handleSave}
                    filename={currentFile.path}
                />
            ) : (
                <div style={{ padding: '20px', color: '#555' }}>Select a file to edit</div>
            )
        }
        cascade={<CascadePanel contextFile={currentFile} />}
        bottom={<TerminalComponent />}
      />

      {/* Settings Button in Header (using portal or absolute) */}
      <div style={{ position: 'absolute', top: '5px', right: '10px', zIndex: 100 }}>
         <button
            onClick={() => setShowSettings(true)}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}
         >
            ⚙️ Settings
         </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
