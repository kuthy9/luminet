
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { useI18n } from '@/hooks/useI18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Subscribe = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { subscription, createCheckoutSession, loading } = useSubscription();
  const navigate = useNavigate();
  
  const plans = [
    {
      name: 'Free',
      price: 'Free',
      icon: Star,
      description: 'Perfect for exploring ideas',
      tier: 'free' as const,
      features: [
        'Up to 10 sparks per month',
        'Basic mesh visualization',
        'Personal canvas workspace',
        'Community browsing'
      ],
      limitations: [
        'No collaboration features',
        'No Muse AI access',
        'No export functionality'
      ]
    },
    {
      name: 'Pro',
      price: '$19/month',
      icon: Zap,
      description: 'For serious creators and collaborators',
      popular: true,
      tier: 'pro' as const,
      features: [
        'Unlimited sparks and ideas',
        'Advanced mesh analytics',
        'Real-time collaboration canvas',
        'Full Muse AI assistant',
        'Export to PDF and web',
        'Priority support'
      ],
      limitations: []
    },
    {
      name: 'Studio',
      price: '$49/month',
      icon: Crown,
      description: 'For teams and organizations',
      tier: 'studio' as const,
      features: [
        'Everything in Pro',
        'Team workspace management',
        'Advanced project incubation',
        'Custom AI training',
        'API access',
        'White-label options',
        'Dedicated support'
      ],
      limitations: []
    }
  ];

  const handlePlanClick = async (planTier: 'free' | 'pro' | 'studio') => {
    // If user is not logged in, redirect to auth
    if (!user) {
      toast.info('Please sign in to manage your subscription');
      navigate('/auth');
      return;
    }

    // Get current tier (default to free if no subscription)
    const currentTier = subscription?.tier || 'free';

    if (planTier === 'free') {
      if (currentTier === 'free') {
        toast.info('You are already on the free plan');
      } else {
        toast.info('To downgrade to free, please contact support');
      }
      return;
    }

    if (planTier === currentTier) {
      toast.info(`You are already on the ${planTier} plan`);
      return;
    }

    try {
      await createCheckoutSession(planTier);
      toast.success('Redirecting to checkout...');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session');
    }
  };

  const getCurrentTier = () => {
    if (!user) return 'free';
    return subscription?.tier || 'free';
  };

  const getButtonText = (planTier: string) => {
    const currentTier = getCurrentTier();
    
    if (!user) {
      return planTier === 'free' ? 'Current Plan' : 'Upgrade';
    }

    if (planTier === currentTier) {
      return 'Current Plan';
    }

    if (planTier === 'free') {
      return currentTier !== 'free' ? 'Downgrade' : 'Current Plan';
    }

    return 'Upgrade';
  };

  const isCurrentPlan = (planTier: string) => {
    return planTier === getCurrentTier();
  };

  if (loading && user) {
    return (
      <Layout>
        <div className="page-content">
          <div className="text-center">Loading subscription information...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-content">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-heading mb-6">
              Choose Your Creative Journey
            </h1>
            <p className="text-xl text-heading max-w-3xl mx-auto">
              From personal inspiration to team collaboration, find the perfect plan for your creative process
            </p>
            {user && subscription && (
              <div className="mt-4">
                <Badge className="bg-primary text-white">
                  Current Plan: {subscription.tier.toUpperCase()}
                </Badge>
              </div>
            )}
            {!user && (
              <div className="mt-4">
                <Badge variant="outline">
                  Sign in to see your current plan
                </Badge>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              const isCurrent = isCurrentPlan(plan.tier);
              const buttonText = getButtonText(plan.tier);
              const isDisabled = isCurrent || (plan.tier === 'free' && getCurrentTier() !== 'free');
              
              return (
                <div 
                  key={index} 
                  className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    plan.popular 
                      ? 'border-coral-300 shadow-lg transform scale-105' 
                      : 'border-warm-200 hover:border-coral-200'
                  } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => !isDisabled && handlePlanClick(plan.tier)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-coral-500 text-white px-6 py-2 text-sm font-bold shadow-lg border-0">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      plan.popular ? 'bg-coral-100' : 'bg-warm-100'
                    }`}>
                      <IconComponent className={`w-8 h-8 ${
                        plan.popular ? 'text-coral-600' : 'text-warm-600'
                      }`} />
                    </div>
                    <h3 className="text-2xl font-bold text-heading mb-2">{plan.name}</h3>
                    <p className="text-heading mb-4">{plan.description}</p>
                    <div className="text-4xl font-bold text-heading">
                      {plan.price}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-6 mb-8">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-heading flex items-center">
                        <Check className="w-4 h-4 mr-2 text-mint-500" />
                        What's included
                      </h4>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start text-heading">
                          <Check className="w-4 h-4 mr-3 text-mint-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {plan.limitations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-heading">Limitations</h4>
                        {plan.limitations.map((limitation, idx) => (
                          <div key={idx} className="flex items-start text-heading">
                            <span className="w-4 h-4 mr-3 flex-shrink-0 mt-0.5 text-center">×</span>
                            <span>{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                      isCurrent
                        ? 'bg-primary text-white cursor-default'
                        : plan.popular 
                        ? 'bg-coral-500 hover:bg-coral-600 text-white cursor-pointer' 
                        : 'border-2 border-warm-200 hover:border-coral-300 hover:bg-coral-50 text-heading bg-white cursor-pointer'
                    } ${isDisabled && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isDisabled}
                  >
                    {buttonText}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-cream-50 rounded-3xl p-12 border border-warm-200 text-center">
            <h3 className="text-2xl font-semibold text-heading mb-6">
              All plans include
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="w-12 h-12 bg-mint-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-mint-600" />
                </div>
                <span className="text-sm font-medium text-heading">14-day free trial</span>
              </div>
              <div>
                <div className="w-12 h-12 bg-peach-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-peach-600" />
                </div>
                <span className="text-sm font-medium text-heading">Cancel anytime</span>
              </div>
              <div>
                <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-coral-600" />
                </div>
                <span className="text-sm font-medium text-heading">Secure payments</span>
              </div>
              <div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-heading">24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Subscribe;
