'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from "next/image";
import {
    ShoppingBag,
    Utensils,
    Package,
    Tag,
    ShoppingCart,
    Users,
    Bot,
    Menu,
    Gift,
    ShoppingCart as OrderIcon,
    Users as CustomersIcon,
} from 'lucide-react';

// ============================================================
// BUSINESS TYPE DATA
// ============================================================
const BUSINESS_TYPES = {
    ECOMMERCE: {
        id: 'ECOMMERCE',
        label: 'E-commerce',
        description: 'Products • Categories • Orders • Customers',
        icon: ShoppingBag,
        features: [
            { label: 'Products', icon: Package },
            { label: 'Categories', icon: Tag },
            { label: 'Orders', icon: ShoppingCart },
            { label: 'Customers', icon: Users },
            { label: 'Product Agent', icon: Bot },
            { label: 'Order Agent', icon: Bot },
            { label: 'Customer Support Agent', icon: Bot },
        ],
    },
    RESTAURANT: {
        id: 'RESTAURANT',
        label: 'Restaurant',
        description: 'Menu • Deals • Orders • Customers',
        icon: Utensils,
        features: [
            { label: 'Menu', icon: Menu },
            { label: 'Deals', icon: Gift },
            { label: 'Orders', icon: OrderIcon },
            { label: 'Customers', icon: CustomersIcon },
            { label: 'Menu Agent', icon: Bot },
            { label: 'Order Agent', icon: Bot },
            { label: 'Customer Support Agent', icon: Bot },
        ],
    },
};

// ============================================================
// BUSINESS TYPE CARD COMPONENT
// ============================================================
const BusinessTypeCard = ({
    type,
    isSelected,
    onSelect,
    value,
    imageSrc,
}) => {
    const Icon = type.icon;

    return (
        <div
            className={cn(
                "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50",
                isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:bg-muted/50"
            )}
            onClick={() => onSelect(value)}
        >
            {/* Radio Button - Top Left */}
            <div className="absolute top-4 left-4">
                <RadioGroupItem value={value} id={type.id} />
            </div>

            {/* Icon */}
            <div className="mt-6 mb-4 w-40 h-40 flex items-center justify-center">
                <Image
                    src={imageSrc}
                    alt="Business Type Icon"
                    className="w-full h-full object-contain"
                    width={160}
                    height={160}
                />
            </div>

            {/* Business Name */}
            <h3 className="text-lg font-semibold text-foreground">
                {type.label}
            </h3>
            {/* Features List */}
            <div className="w-full">
                <h1 className="text-md font-medium text-muted-foreground my-2">
                    Business Features
                </h1>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {type.features.map((feature, index) => {
                        const FeatureIcon = feature.icon;
                        return (
                            <li
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-1.5"
                            >
                                <FeatureIcon className="h-3 w-3 text-primary/60" />
                                {feature.label}
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Hidden radio input for accessibility */}
            <RadioGroupItem
                value={value}
                id={type.id}
                className="sr-only"
            />
        </div>
    );
};

// ============================================================
// MAIN BUSINESS TYPE SELECTION PAGE
// ============================================================
const BusinessTypeSelectionPage = () => {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState(null);

    const handleSelect = (value) => {
        setSelectedType(value);
    };

    const handleContinue = () => {
        if (selectedType) {
            // Store the business type in localStorage or context
            localStorage.setItem('businessType', selectedType);
            // Navigate to next step
            router.push('/onboarding/business-info');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="text-left mb-8 sm:mb-10">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Choose your business type
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        Tell us what type of business you&apos;re setting up.
                        This helps TeleAgent configure the right tools and AI agents.
                    </p>
                </div>

                {/* Radio Group */}
                <RadioGroup
                    value={selectedType}
                    onValueChange={handleSelect}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* E-commerce Card */}
                    <BusinessTypeCard
                        type={BUSINESS_TYPES.ECOMMERCE}
                        isSelected={selectedType === BUSINESS_TYPES.ECOMMERCE.id}
                        onSelect={handleSelect}
                        value={BUSINESS_TYPES.ECOMMERCE.id}
                        imageSrc="/shopping.svg"
                    />

                    {/* Restaurant Card */}
                    <BusinessTypeCard
                        type={BUSINESS_TYPES.RESTAURANT}
                        isSelected={selectedType === BUSINESS_TYPES.RESTAURANT.id}
                        onSelect={handleSelect}
                        value={BUSINESS_TYPES.RESTAURANT.id}
                        imageSrc="/chef.svg"
                    />
                </RadioGroup>

                {/* Continue Button */}
                <div className="flex justify-center mt-8 sm:mt-10">
                    <Button
                        size="lg"
                        className="min-w-[200px]"
                        onClick={handleContinue}
                        disabled={!selectedType}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BusinessTypeSelectionPage;