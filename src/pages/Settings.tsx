
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, Bell, Shield, Brush } from 'lucide-react';
import { toast } from 'sonner';
import HeroBackground from '@/components/HeroBackground';

const Settings = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [autosave, setAutosave] = useState(true);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would persist this setting
    toast.success(`${!darkMode ? 'Dark' : 'Light'} mode enabled`);
  };
  
  const resetSettings = () => {
    setDarkMode(true);
    setNotifications(true);
    setSaveHistory(true);
    setPrivateProfile(false);
    setShowGridLines(true);
    setAutosave(true);
    toast.success('Settings reset to defaults');
  };
  
  return (
    <div className="relative min-h-screen">
      <HeroBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" className="flex items-center gap-2 text-white">
                <ArrowLeft size={18} />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </header>
        
        <main className="container max-w-3xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-full bg-purple-500/20">
                <SettingsIcon className="h-6 w-6 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            
            <div className="space-y-6">
              {/* Appearance Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Appearance</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="text-purple-400" /> : <Sun className="text-yellow-400" />}
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-400">Toggle between dark and light mode</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                </div>
              </div>
              
              {/* Canvas Settings Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Canvas Settings</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brush className="text-purple-400" />
                    <div>
                      <p className="font-medium">Show Grid Lines</p>
                      <p className="text-sm text-gray-400">Display grid lines on canvas</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showGridLines} 
                    onCheckedChange={(checked) => {
                      setShowGridLines(checked);
                      toast.success(`Grid lines ${checked ? 'enabled' : 'disabled'}`);
                    }} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brush className="text-purple-400" />
                    <div>
                      <p className="font-medium">Autosave</p>
                      <p className="text-sm text-gray-400">Automatically save your work</p>
                    </div>
                  </div>
                  <Switch 
                    checked={autosave} 
                    onCheckedChange={(checked) => {
                      setAutosave(checked);
                      toast.success(`Autosave ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </div>
              
              {/* Notifications Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Notifications</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="text-purple-400" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-400">Receive notifications about activity</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={(checked) => {
                      setNotifications(checked);
                      toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </div>
              
              {/* Privacy Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Privacy</h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="text-purple-400" />
                    <div>
                      <p className="font-medium">Private Profile</p>
                      <p className="text-sm text-gray-400">Hide your profile from other users</p>
                    </div>
                  </div>
                  <Switch 
                    checked={privateProfile} 
                    onCheckedChange={(checked) => {
                      setPrivateProfile(checked);
                      toast.success(`Private profile ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="text-purple-400" />
                    <div>
                      <p className="font-medium">Save Drawing History</p>
                      <p className="text-sm text-gray-400">Store your drawing history</p>
                    </div>
                  </div>
                  <Switch 
                    checked={saveHistory} 
                    onCheckedChange={(checked) => {
                      setSaveHistory(checked);
                      toast.success(`Drawing history ${checked ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={resetSettings}
                >
                  Reset to Defaults
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => toast.success('Settings saved successfully!')}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
