'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from "@/components/ui/toast"
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const businessHoursSchema = z
    .object({
        isOpen: z.boolean().default(true),
        open: z.string().optional(),
        close: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.isOpen) {
            if (!data.open) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Opening time is required',
                    path: ['open'],
                });
            }
            if (!data.close) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Closing time is required',
                    path: ['close'],
                });
            }
        }
    });

const restaurantKnowledgeSchema = z.object({
    businessIdentity: z.string().min(10, 'Business identity is required').max(2000),
    foodVariety: z.string().min(10, 'Food variety information is required').max(4000),
    deliveryInformation: z.string().min(10, 'Delivery information is required').max(2000),
    paymentInformation: z.string().min(10, 'Payment information is required').max(1000),
    reservationInformation: z.string().min(10, 'Reservation information is required').max(1000),
    businessHours: z.object({
        monday: businessHoursSchema,
        tuesday: businessHoursSchema,
        wednesday: businessHoursSchema,
        thursday: businessHoursSchema,
        friday: businessHoursSchema,
        saturday: businessHoursSchema,
        sunday: businessHoursSchema,
    }),
});

const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const BusinessHoursSection = ({ register, watch, setValue }) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Weekly Schedule</h4>
                <p className="text-sm text-muted-foreground max-w-lg">
                    These hours describe when your business is operating. Mezban remains available 24/7.
                </p>
            </div>
            <div className="space-y-3">
                {DAYS.map((day) => {
                    const isOpen = watch(`data.businessHours.${day.key}.isOpen`);
                    return (
                        <div key={day.key} className="flex items-center gap-4 flex-wrap">
                            <div className="w-24 text-sm font-medium">{day.label}</div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={isOpen}
                                    onCheckedChange={(checked) => {
                                        setValue(`data.businessHours.${day.key}.isOpen`, checked);
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {isOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                            {isOpen && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        className="w-28 h-9 text-sm"
                                        {...register(`data.businessHours.${day.key}.open`)}
                                    />
                                    <span className="text-sm text-muted-foreground">to</span>
                                    <Input
                                        type="time"
                                        className="w-28 h-9 text-sm"
                                        {...register(`data.businessHours.${day.key}.close`)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const KnowledgeTextarea = ({
    label,
    description,
    placeholder,
    register,
    name,
    maxLength,
    error,
    required = true,
    watch,
}) => {
    const registered = register(name);
    const currentValue = watch ? (watch(name) || '') : '';

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1">
                <Label htmlFor={name} className="text-sm font-medium">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
                {description}
            </p>
            <Textarea
                id={name}
                placeholder={placeholder}
                className="min-h-35 max-h-65 resize-none overflow-y-auto"
                maxLength={maxLength}
                {...registered}
                aria-invalid={error ? "true" : "false"}
            />
            <div className="flex justify-between items-center">
                {error && (
                    <p className="text-sm text-destructive">
                        {error.message}
                    </p>
                )}
                <span className={cn(
                    "text-sm ml-auto",
                    currentValue.length > maxLength * 0.9 ? "text-orange-500" : "text-muted-foreground"
                )}>
                    {currentValue.length} / {maxLength}
                </span>
            </div>
        </div>
    );
};

// ============================================================
// MAIN PAGE
// ============================================================
import {
    useBusinessKnowledge,
    useUpdateBusinessKnowledge,
    useBusinessHours,
    useUpdateBusinessHours,
} from '@/hooks/useApi';

const BusinessKnowledgePage = ({ mode = "dashboard" }) => {
    const router = useRouter();

    const { data: knowledgeResponse } = useBusinessKnowledge();
    const { data: hoursResponse } = useBusinessHours();
    const updateKnowledgeMutation = useUpdateBusinessKnowledge();
    const updateHoursMutation = useUpdateBusinessHours();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const getDefaultValues = () => {
        const hours = {
            monday: { isOpen: true, open: '09:00', close: '18:00' },
            tuesday: { isOpen: true, open: '09:00', close: '18:00' },
            wednesday: { isOpen: true, open: '09:00', close: '18:00' },
            thursday: { isOpen: true, open: '09:00', close: '18:00' },
            friday: { isOpen: true, open: '09:00', close: '18:00' },
            saturday: { isOpen: false, open: '09:00', close: '18:00' },
            sunday: { isOpen: false, open: '09:00', close: '18:00' },
        };

        return {
            data: {
                businessIdentity: '',
                foodVariety: '',
                deliveryInformation: '',
                paymentInformation: '',
                reservationInformation: '',
                businessHours: hours,
            }
        };
    };

    const getSchema = () => {
        return zodResolver(
            z.object({
                data: restaurantKnowledgeSchema
            })
        );
    };

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: getSchema(),
        defaultValues: getDefaultValues(),
    });

    useEffect(() => {
        if (knowledgeResponse?.data) {
            const k = knowledgeResponse.data;
            setValue('data.businessIdentity', k.businessIdentity || '');
            setValue('data.foodVariety', k.foodVariety || '');
            setValue('data.deliveryInformation', k.deliveryInformation || '');
            setValue('data.paymentInformation', k.paymentInformation || '');
            setValue('data.reservationInformation', k.reservationInformation || '');
        }
    }, [knowledgeResponse, setValue]);

    useEffect(() => {
        if (Array.isArray(hoursResponse?.data) && hoursResponse.data.length > 0) {
            hoursResponse.data.forEach(h => {
                const dayKey = h.dayOfWeek.toLowerCase();
                setValue(`data.businessHours.${dayKey}.isOpen`, h.isOpen);
                setValue(`data.businessHours.${dayKey}.open`, h.open || '09:00');
                setValue(`data.businessHours.${dayKey}.close`, h.close || '18:00');
            });
        }
    }, [hoursResponse, setValue]);

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            await Promise.all([
                updateKnowledgeMutation.mutateAsync(values.data),
                updateHoursMutation.mutateAsync(values.data.businessHours),
            ]);

            toast.add({
                type: "success",
                title: "Success!",
                description: 'Business knowledge saved successfully!'
            });

            if (mode === "onboarding") {
                router.push('/onboarding/telegram-connect');
            }
        } catch (error) {
            toast.add({
                type: "error",
                title: "Error!",
                description: error.response?.data?.message || 'Failed to save business knowledge'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (formErrors) => {
        console.error('Form validation failed:', formErrors);
        toast.add({
            type: "error",
            title: "Please check the form",
            description: "Some required fields are missing or invalid."
        });
    };

    const dataErrors = errors.data || {};

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-left space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Business Knowledge</h1>
                    <p className="text-sm text-muted-foreground">
                        Help Mezban understand your business so its AI agents can answer customers accurately.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
                    {/* RESTAURANT KNOWLEDGE */}
                    <div className="space-y-6">
                        {/* Business Identity */}
                        <KnowledgeTextarea
                            label="Business Identity"
                            description="Tell your AI agent about your restaurant and what makes it special."
                            placeholder="For example, we are Spice House, a family restaurant in Faisalabad serving Pakistani, Chinese, and fast food for dine-in and delivery. We're known for our BBQ, generous portions, and quick service."
                            register={register}
                            watch={watch}
                            name="data.businessIdentity"
                            maxLength={2000}
                            error={dataErrors.businessIdentity}
                        />

                        <Separator />

                        {/* Food Variety / Menu Information */}
                        <KnowledgeTextarea
                            label="Food Variety / Menu Information"
                            description="List your cuisines, popular dishes, and any specialties or must-try items."
                            placeholder="For example, we serve Pakistani BBQ (Seekh Kebab, Chicken Tikka), curries (Chicken Karahi, Chicken Handi, Daal), Chinese (Chicken Chow Mein, Chicken Manchurian), and fast food (Zinger Burger, Loaded Fries, Pizza). We also serve juices, milkshakes, and desserts. Our specialty is Chicken Karahi."
                            register={register}
                            watch={watch}
                            name="data.foodVariety"
                            maxLength={4000}
                            error={dataErrors.foodVariety}
                        />

                        <Separator />

                        {/* Delivery Information */}
                        <KnowledgeTextarea
                            label="Delivery Information"
                            description="Share your delivery area, minimum order, charges, and typical delivery time."
                            placeholder="For example, we deliver within 10km of D Ground, Faisalabad. Minimum order is Rs. 500, delivery charge is Rs. 150, and orders usually arrive in 30-45 minutes. Free delivery on orders above Rs. 2,000. Delivery may take longer during peak hours or bad weather."
                            register={register}
                            watch={watch}
                            name="data.deliveryInformation"
                            maxLength={2000}
                            error={dataErrors.deliveryInformation}
                        />

                        <Separator />

                        {/* Payment Information */}
                        <KnowledgeTextarea
                            label="Payment Information"
                            description="List accepted payment methods for both delivery and dine-in orders."
                            placeholder="For example, for delivery: Cash on Delivery, Easypaisa (0300-1234567), or card on delivery. For dine-in: Cash, credit card, or debit card at the counter."
                            register={register}
                            watch={watch}
                            name="data.paymentInformation"
                            maxLength={1000}
                            error={dataErrors.paymentInformation}
                        />

                        <Separator />

                        {/* Reservation Information */}
                        <KnowledgeTextarea
                            label="Reservation Information"
                            description="Tell the AI how to handle table reservation requests, or say if you don't accept them."
                            placeholder="For example, we accept reservations for up to 10 guests, at least 2 hours in advance. Before confirming, collect the customer's name, phone number, date, time, and number of guests. For larger groups, ask them to call the restaurant directly."
                            register={register}
                            watch={watch}
                            name="data.reservationInformation"
                            maxLength={1000}
                            error={dataErrors.reservationInformation}
                        />

                        <Separator />

                        {/* Weekly Schedule */}
                        <BusinessHoursSection
                            register={register}
                            watch={watch}
                            setValue={setValue}
                        />
                    </div>

                    {/* ============================================ */}
                    {/* NAVIGATION */}
                    {/* ============================================ */}
                    <div className={cn("flex items-center justify-between gap-3 pt-4 border-t border-border", mode === "dashboard" && "justify-end")}>
                        {mode === "onboarding" && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 text-sm font-medium"
                                onClick={() => router.push('/onboarding/business-info')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="h-10 text-sm font-medium"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                mode === "onboarding" ? 'Save & Continue' : 'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessKnowledgePage;