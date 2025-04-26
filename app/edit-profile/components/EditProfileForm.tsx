'use client';

import { useState, useEffect } from 'react';
import { OnboardingProfile } from '@/types/user.types';
import { updateUserProfile } from '@/app/actions';
import { useRouter } from 'next/navigation';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

type EditProfileFormProps = {
  initialProfile: OnboardingProfile | null;
};

export default function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: initialProfile?.display_name || '',
    age: initialProfile?.age || null,
    gender: initialProfile?.gender || ''
  });

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        display_name: initialProfile.display_name,
        age: initialProfile.age,
        gender: initialProfile.gender || ''
      });
    }
  }, [initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value, 10) : null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Submit form data
      const result = await updateUserProfile({
        display_name: formData.display_name,
        age: formData.age,
        gender: formData.gender || null
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to protected page on success
        router.push('/protected');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!initialProfile) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-500">Profile not found. Please complete onboarding first.</p>
        <button
          onClick={() => router.push('/onboarding')}
          className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Go to Onboarding
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Username field (read-only) */}
      <div>
        <label htmlFor="username" className="block mb-1 font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={initialProfile.username}
          disabled
          className="w-full p-2 border border-gray-300 rounded bg-gray-100"
        />
        <p className="text-sm text-gray-500 mt-1">
          Username cannot be changed
        </p>
      </div>
      
      {/* Display Name field */}
      <div>
        <label htmlFor="display_name" className="block mb-1 font-medium">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          value={formData.display_name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="John Doe"
        />
      </div>
      
      {/* Age field */}
      <div>
        <label htmlFor="age" className="block mb-1 font-medium">
          Age
        </label>
        <input
          id="age"
          name="age"
          type="number"
          min="13"
          max="120"
          value={formData.age || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="25"
        />
      </div>
      
      {/* Gender field */}
      <div>
        <label htmlFor="gender" className="block mb-1 font-medium">
          Gender
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select gender</option>
          {genderOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Update Profile'}
        </button>
        
        <button
          type="button"
          onClick={() => router.push('/protected')}
          className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 