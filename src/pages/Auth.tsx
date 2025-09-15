
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/hooks/useI18n';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Auth = () => {
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth form submitted:', { mode, email, password, name });
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-heading mb-4">
              {mode === 'signin' ? 'Welcome Back' : 'Join Luminet'}
            </h1>
            <p className="text-muted">
              {mode === 'signin' 
                ? 'Sign in to continue your creative journey' 
                : 'Start your inspiration visualization journey'
              }
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-3xl p-8 border border-warm-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-12 border-warm-200 focus:border-coral-300 rounded-xl"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 border-warm-200 focus:border-coral-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 h-12 border-warm-200 focus:border-coral-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full bg-coral-500 hover:bg-coral-600 text-white h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center mt-6 pt-6 border-t border-warm-200">
              <p className="text-muted">
                {mode === 'signin' 
                  ? "Don't have an account? " 
                  : "Already have an account? "
                }
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-coral-600 hover:text-coral-700 font-medium"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Social Auth */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted mb-4">Or continue with</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" className="flex-1 border-warm-200 hover:border-coral-200">
                Google
              </Button>
              <Button variant="outline" className="flex-1 border-warm-200 hover:border-coral-200">
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
