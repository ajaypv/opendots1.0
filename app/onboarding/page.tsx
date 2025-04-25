'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { updateUserProfileAction } from '@/app/actions';
import { getInitialAvatar } from '@/utils/image-url';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    age: '',
    gender: 'prefer-not-to-say',
    profileImage: null as File | null,
    imagePreview: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || '', 
      }));
    }
  }, [user]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setImageUploadError('Image size must be less than 2MB');
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError('Image must be a JPEG, PNG, GIF, or WebP file');
      return;
    }
    
    setImageUploadError('');
    setIsImageLoading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profileImage: file,
        imagePreview: reader.result as string
      }));
      setIsImageLoading(false);
    };
    reader.onerror = () => {
      setImageUploadError('Failed to read image file');
      setIsImageLoading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Submit form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await updateUserProfileAction({
        displayName: formData.displayName,
        username: formData.username,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        profileImage: formData.profileImage
      });
      
      if (response.success) {
        router.push('/protected');
      } else {
        setError(response.message || 'Error updating profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              {isImageLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
                  Loading...
                </div>
              ) : formData.imagePreview ? (
                <img 
                  src={formData.imagePreview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"
                  style={{ 
                    backgroundImage: `url("${getInitialAvatar(user?.user_metadata?.full_name, user?.email)}")`,
                    backgroundSize: 'cover'
                  }}
                />
              )}
            </Avatar>
            
            <div className="w-full">
              <Label htmlFor="profileImage" className="block mb-2">
                Profile Picture
              </Label>
              <Input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="w-full"
              />
              {imageUploadError && (
                <p className="text-red-500 text-xs mt-1">{imageUploadError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Upload an image (JPEG, PNG, GIF, or WebP, max 2MB)
              </p>
            </div>
          </div>
          
          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="block mb-2">
              Display Name
            </Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              required
              placeholder="How should we call you?"
            />
          </div>
          
          {/* Username */}
          <div>
            <Label htmlFor="username" className="block mb-2">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a unique username"
              pattern="^[a-zA-Z0-9_-]{3,20}$"
              title="Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens"
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>
          
          {/* Age */}
          <div>
            <Label htmlFor="age" className="block mb-2">
              Age
            </Label>
            <Input
              id="age"
              name="age"
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
            />
          </div>
          
          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="block mb-2">
              Gender
            </Label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || isImageLoading}
          >
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
} 