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
                    These hours describe when your business is operating. TeleAgent remains available 24/7.
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
    required = true
}) => {
    const [value, setValue] = useState('');

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
                {...register(name)}
                onChange={(e) => setValue(e.target.value)}
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
                    value.length > maxLength * 0.9 ? "text-orange-500" : "text-muted-foreground"
                )}>
                    {value.length} / {maxLength}
                </span>
            </div>
        </div>
    );
};

// ============================================================
// MAIN PAGE
// ============================================================
const BusinessKnowledgePage = () => {
    const router = useRouter();
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
        formState: { errors },
    } = useForm({
        resolver: getSchema(),
        defaultValues: getDefaultValues(),
    });

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Attach businessType: 'RESTAURANT' directly to payload for backend API compatibility
            const payload = {
                businessType: 'RESTAURANT',
                ...values,
            };
            await new Promise((resolve) => setTimeout(resolve, 1500));

            toast.add({
                type: "success",
                title: "Success!",
                description: 'Business knowledge saved successfully!'
            });

            console.log('Submitted Data:', payload);
            router.push('/onboarding/telegram-connect');
        } catch (error) {
            toast.add({
                type: "error",
                title: "Error!",
                description: 'Failed to save business knowledge'
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
                        Help TeleAgent understand your business so its AI agents can answer customers accurately.
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
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 text-sm font-medium"
                            onClick={() => router.push('/onboarding/business-info')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
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
                                'Save & Continue'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessKnowledgePage;