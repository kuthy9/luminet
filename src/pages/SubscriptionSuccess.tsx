
import React, { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SubscriptionSuccess = () => {
  const { checkSubscription, subscription } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh subscription status after successful payment
    checkSubscription();
  }, []);

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-mint-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-mint-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-heading mb-4">
            Welcome to {subscription?.tier?.toUpperCase() || 'Pro'}!
          </h1>
          
          <p className="text-xl text-body mb-8">
            Your subscription has been activated successfully. You now have access to all premium features.
          </p>

          <div className="bg-cream-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-heading mb-4">What's now available:</h3>
            <div className="space-y-2 text-left">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-mint-500 mr-3" />
                <span>Unlimited sparks and ideas</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-mint-500 mr-3" />
                <span>Full Muse AI assistant access</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-mint-500 mr-3" />
                <span>Advanced collaboration features</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-mint-500 mr-3" />
                <span>Export and sharing capabilities</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/spark')}
              className="btn-primary px-8 py-3"
            >
              Start Creating
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/muse')}
              className="btn-secondary px-8 py-3"
            >
              Try Muse AI
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionSuccess;
