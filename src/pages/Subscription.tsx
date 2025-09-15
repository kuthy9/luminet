
import React from 'react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Sparkles } from 'lucide-react';
import { LuminetButton } from "@/components/LuminetButton";
import { LuminetCard } from "@/components/LuminetCard";
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Subscription = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { subscription, createCheckoutSession, loading } = useSubscription();
  const navigate = useNavigate();
  
  const plans = [
    {
      name: 'Free',
      price: 'Free',
      icon: Star,
      color: 'from-slate-600 to-slate-700',
      borderColor: 'border-slate-400',
      tier: 'free' as const,
      features: [
        'Personal inspiration mapping',
        'Up to 5 connections',
        'Basic constellation view',
        'Community browsing access'
      ],
      limitations: [
        'No collaboration canvas',
        'No Muse Agent access',
        'No export functionality'
      ]
    },
    {
      name: 'Pro',
      price: '$29/month',
      icon: Zap,
      color: 'from-primary to-purple-600',
      borderColor: 'border-primary',
      popular: true,
      tier: 'pro' as const,
      features: [
        'Unlimited inspiration connections',
        'Private collaboration canvas',
        'Muse AI assistant access',
        'Advanced constellation analysis',
        'Mind map export capabilities',
        'Priority customer support'
      ],
      limitations: []
    },
    {
      name: 'Studio',
      price: '$99/month',
      icon: Crown,
      color: 'from-purple-600 to-orange-600',
      borderColor: 'border-orange-500',
      tier: 'studio' as const,
      features: [
        'All Pro features included',
        'Public incubation projects',
        'Multi-AI collaboration mode',
        'Team collaboration management',
        'Advanced export formats',
        'API access permissions',
        'White-label customization'
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
      return planTier === 'free' ? 'Current Plan' : 'Upgrade Now';
    }

    if (planTier === currentTier) {
      return 'Current Plan';
    }

    if (planTier === 'free') {
      return currentTier !== 'free' ? 'Downgrade' : 'Current Plan';
    }

    return 'Upgrade Now';
  };

  const isCurrentPlan = (planTier: string) => {
    return planTier === getCurrentTier();
  };

  if (loading && user) {
    return (
      <GlobalLayout>
        <div className="page-content">
          <div className="text-center">Loading subscription information...</div>
        </div>
      </GlobalLayout>
    );
  }

  return (
    <GlobalLayout>
      <div className="page-content">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-heading">
            Choose Your{' '}
            <span className="cosmic-title">
              Inspiration Journey
            </span>
          </h1>
          <p className="text-xl text-body max-w-3xl mx-auto leading-relaxed font-medium">
            From personal thought exploration to team collaborative innovation, find the perfect inspiration companion plan for you
          </p>
          {user && subscription && (
            <div className="mt-6">
              <Badge className="bg-primary text-white text-base px-4 py-2">
                Current Plan: {subscription.tier.toUpperCase()}
              </Badge>
            </div>
          )}
          {!user && (
            <div className="mt-6">
              <Badge variant="outline" className="text-base px-4 py-2">
                Sign in to see your current plan
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isCurrent = isCurrentPlan(plan.tier);
            const buttonText = getButtonText(plan.tier);
            const isDisabled = isCurrent || (plan.tier === 'free' && getCurrentTier() !== 'free');
            
            return (
              <LuminetCard 
                key={index} 
                hoverable 
                glowOnHover={plan.popular}
                className={`relative transition-all duration-500 ${
                  plan.popular ? 'scale-105 shadow-2xl border-2 border-primary/30' : ''
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-white px-6 py-2 text-sm font-bold shadow-lg border-0">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center pb-6">
                  <div className={`w-20 h-20 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mx-auto mb-6 border-2 ${plan.borderColor} transition-transform duration-500 hover:scale-110 shadow-lg`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-heading mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary mb-6">
                    {plan.price}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-green-600 flex items-center text-lg">
                      <Check className="w-5 h-5 mr-2" />
                      Included Features
                    </h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-body">
                        <Check className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                        <span className="leading-relaxed font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-muted text-lg">Feature Limitations</h4>
                      {plan.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-center text-muted">
                          <span className="w-4 h-4 mr-3 text-muted flex-shrink-0 font-bold">×</span>
                          <span className="leading-relaxed">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <LuminetButton 
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className={`w-full font-bold transition-all duration-300 ${
                      isDisabled && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    glowEffect={plan.popular && !isDisabled}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handlePlanClick(plan.tier)}
                  >
                    {buttonText}
                  </LuminetButton>
                </div>
              </LuminetCard>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <LuminetCard className="max-w-4xl mx-auto">
            <p className="text-muted mb-6 text-lg font-medium">All paid plans include</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-body">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium">7-day free trial</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Secure payments</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Crown className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium">24/7 support</span>
              </div>
            </div>
          </LuminetCard>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default Subscription;
