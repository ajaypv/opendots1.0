'use client';

import { useState } from 'react';
import { OnboardingFormData } from '@/types/user.types';
import { checkUsernameAvailability, completeOnboarding } from '@/app/actions';
import { useRouter } from 'next/navigation';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

export default function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({
    username: '',
    display_name: '',
    age: null,
    gender: null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear username error when typing in username field
    if (name === 'username') {
      setUsernameError(null);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value, 10) : null) : value
    }));
  };

  const validateUsername = async () => {
    // Username format validation
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Username availability check
    const isAvailable = await checkUsernameAvailability(formData.username);
    if (!isAvailable) {
      setUsernameError('Username is already taken');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate username
      const isUsernameValid = await validateUsername();
      if (!isUsernameValid) {
        setIsSubmitting(false);
        return;
      }
      
      // Submit form data
      const result = await completeOnboarding(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Redirect to home page on success
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Username field */}
      <div>
        <label htmlFor="username" className="block mb-1 font-medium">
          Username <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-2">
          This cannot be changed later
        </p>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
          className={`w-full p-2 border rounded ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="johndoe123"
        />
        {usernameError && <p className="mt-1 text-sm text-red-600">{usernameError}</p>}
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
          value={formData.gender || ''}
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
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${
          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Saving...' : 'Complete Profile'}
      </button>
    </form>
  );
} 