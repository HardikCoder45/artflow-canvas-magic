
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Edit, Upload, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import HeroBackground from '@/components/HeroBackground';

interface UserProfile {
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
}

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z.string().max(250, 'Bio must be at most 250 characters').optional(),
});

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      fullName: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    async function loadProfile() {
      try {
        // Load profile from Supabase
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error loading profile:', error);
          return;
        }
        
        if (data) {
          setProfile({
            username: data.username || user.user_metadata.username || '',
            full_name: data.Name || user.user_metadata.full_name || '',
            avatar_url: data.avatar_url,
            bio: data.bio,
          });
          
          form.reset({
            username: data.username || user.user_metadata.username || '',
            fullName: data.Name || user.user_metadata.full_name || '',
            bio: data.bio || '',
          });
          
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } else {
          // Use data from auth metadata
          const metadata = user.user_metadata;
          form.reset({
            username: metadata?.username || '',
            fullName: metadata?.full_name || '',
            bio: '',
          });
        }
      } catch (error) {
        console.error('Error in profile loading:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfile();
  }, [user, navigate, form]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      
      // Check if avatars bucket exists, create if it doesn't
      const { error: bucketError } = await supabase.storage.getBucket('avatars');
      if (bucketError) {
        // Create the bucket if it doesn't exist
        await supabase.storage.createBucket('avatars', {
          public: true,
        });
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;
      
      setAvatarUrl(avatarUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Signed out successfully');
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Prepare profile data
      const profileData = {
        id: user.id,
        username: values.username,
        Name: values.fullName,
        bio: values.bio,
        avatar_url: avatarUrl,
      };
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', user.id);
          
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert([profileData]);
          
        if (error) throw error;
      }
      
      // Update session metadata
      await supabase.auth.updateUser({
        data: {
          username: values.username,
          full_name: values.fullName,
        }
      });
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <HeroBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto py-6 px-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2 text-white">
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </header>
        
        <main className="container max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="text-center">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-purple-600/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-4xl flex items-center justify-center">
                        <User size={48} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-white" />
                    )}
                    <span className="sr-only">Upload avatar</span>
                  </label>
                  
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    disabled={uploading} 
                    className="hidden" 
                  />
                </div>
                
                <p className="mt-4 text-sm text-gray-400">
                  Click to change avatar
                </p>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Profile
                </h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white/5 border-white/10" 
                              placeholder="Your unique username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-white/5 border-white/10" 
                              placeholder="Your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-white/5 border-white/10 min-h-[120px]" 
                              placeholder="Tell us about yourself and your art..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
