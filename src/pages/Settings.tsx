
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, Globe, Shield, Bell, Palette } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

const Settings = () => {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { subscription, createCheckoutSession } = useSubscription();
  const [activeTab, setActiveTab] = useState('account');

  const handleUpgrade = async (tier: 'pro' | 'studio') => {
    try {
      await createCheckoutSession(tier);
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Settings</h1>
            <p className="text-lg text-slate-600">Manage your account and preferences</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-warm-100">
              <TabsTrigger value="account" className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2 text-slate-700">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4" />
                Language
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 text-slate-700">
                <Shield className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 text-slate-700">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <p className="text-slate-600 mt-1">{user?.email || 'Not signed in'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Account Type</label>
                    <div className="mt-1">
                      <Badge className="bg-primary text-white">
                        {subscription?.tier?.toUpperCase() || 'FREE'}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-warm-200">
                    <Button 
                      variant="outline" 
                      onClick={signOut}
                      className="border-warm-200 hover:border-warm-300 hover:bg-warm-50 text-slate-700"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Subscription & Billing</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Current Plan</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="bg-primary text-white">
                        {subscription?.tier?.toUpperCase() || 'FREE'}
                      </Badge>
                      {subscription?.current_period_end && (
                        <span className="text-sm text-slate-600">
                          Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(!subscription || subscription.tier === 'free') && (
                    <div className="pt-4 border-t border-warm-200 space-y-3">
                      <p className="text-slate-600">Upgrade to unlock premium features:</p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleUpgrade('pro')}
                          className="bg-coral-500 hover:bg-coral-600 text-white"
                        >
                          Upgrade to Pro ($19/mo)
                        </Button>
                        <Button 
                          onClick={() => handleUpgrade('studio')}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          Upgrade to Studio ($49/mo)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="language" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Language Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Interface Language</label>
                    <div className="mt-2">
                      <LanguageSelector />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Region</label>
                    <p className="text-slate-500 text-sm mt-1">
                      Language changes will affect the entire application interface.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Privacy & Security</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Data Collection</h4>
                    <p className="text-slate-600 text-sm">
                      We collect minimal data to improve your experience. Your ideas and creative content remain private.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Account Security</h4>
                    <p className="text-slate-600 text-sm">
                      Your account is secured with industry-standard encryption and authentication.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Data Export</h4>
                    <p className="text-slate-600 text-sm">
                      You can export your data at any time from the respective feature pages.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Appearance</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Theme</h4>
                    <p className="text-slate-600 text-sm mb-3">
                      Currently using the warm cream theme optimized for creativity and focus.
                    </p>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-cream-100 border-2 border-primary rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-700">Light</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Font Size</h4>
                    <p className="text-slate-600 text-sm">
                      Using system defaults for optimal readability across devices.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
